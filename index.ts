interface Observer<T> {
  next(t: T): void;
  complete(): void;
}

interface Observable<T> {
  subscribe: (observer: Observer<T>) => void;
  unsubscribe?: () => void;
}

/**
 * @extends Observable
 * @param {function} subscribe
 */
export default class Stream<T> implements Observable<T> {
  subscribe: (o: Observer<T>) => void;
  unsubscribe?: () => void;

  constructor(subscribe: (o: Observer<T>) => void, unsubscribe?: () => void) {
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;
  }

  private compose<U>(operator: (s: Stream<T>) => Stream<U>): Stream<U> {
    return operator(this);
  }

  map<U>(fn: (t: T) => U): Stream<U> {
    return this.compose(_map(fn));
  }

  filter(fn: (t: T) => boolean): Stream<T> {
    return this.compose(_filter(fn));
  }

  debounceTime(ms: number) {
    return this.compose(debounceTime(ms));
  }

  /**
   * @template U
   * @param {Stream<U>} stream
   */
  withLatestFrom<U>(stream: Stream<U>) {
    return this.compose(_withLatestFrom(stream));
  }

  /**
   * @param {string} type
   * @param {HTMLElement} target
   * @returns {Stream<Event>}
   */
  static fromEvent(type: string, target: HTMLElement): Stream<Event> {
    const _streamFromEvent: Stream<Event> = new Stream((observer) => {
      target.addEventListener(type, observer.next);
      _streamFromEvent.unsubscribe = () => {
        observer.complete();
        target.removeEventListener(type, observer.next);
      };
    });

    return _streamFromEvent;
  }

  /**
   * @param {number} ms
   * @returns {Stream<number>}
   */
  static fromTimer(ms: number): Stream<number> {
    const _streamFromTimer: Stream<number> = new Stream((observer) => {
      let _tick = 0;
      const _timer = setTimeout(() => {
        _tick += 1;
        observer.next(_tick);
      }, ms);

      _streamFromTimer.unsubscribe = () => {
        observer.complete();
        clearTimeout(_timer);
      };
    });

    return _streamFromTimer;
  }

  /**
   * @param {number} ms
   * @returns {Stream<number>}
   */
  static fromInterval(ms: number): Stream<number> {
    const _streamFromInterval: Stream<number> = new Stream((observer) => {
      let _tick = 0;
      const _timer = setInterval(() => {
        _tick += 1;
        observer.next(_tick);
      }, ms);

      _streamFromInterval.unsubscribe = () => {
        observer.complete();
        clearInterval(_timer);
      };
    });

    return _streamFromInterval;
  }
}

/**
 * Creates a mapping operator that applies the mapping function to each item of the stream.
 * @template T, U
 * @param {(t: T) => U} fn
 * @returns {(s: Stream<T>) => Stream<U>}
 */
function _map<T, U>(fn: (t: T) => U): (s: Stream<T>) => Stream<U> {
  return (stream) => {
    const _mappedStream: Stream<U> = new Stream((observer) => {
      stream.subscribe({
        next: (data) => observer.next(fn(data)),
        complete: observer.complete,
      });

      _mappedStream.unsubscribe = () => {
        if (typeof stream.unsubscribe === 'function') {
          stream.unsubscribe();
        }
      };
    });

    return _mappedStream;
  };
}

const noOp = () => {};

/**
 * Filters items emitted by the source stream using a predicate.
 * @template T
 * @param {(t: T) => boolean} fn
 * @returns {(s: Stream<T>) => Stream<T>}
 */
function _filter<T>(fn: (t: T) => boolean): (s: Stream<T>) => Stream<T> {
  return (stream) => {
    const _filteredStream: Stream<T> = new Stream((observer) => {
      stream.subscribe({
        next: (data) => (fn(data) ? observer.next(data) : noOp()),
        complete: observer.complete,
      });

      _filteredStream.unsubscribe = () => {
        if (typeof stream.unsubscribe === 'function') {
          stream.unsubscribe();
        }
      };
    });

    return _filteredStream;
  };
}

/**
 * Delays the emission of items from the observable stream by a specified time in milliseconds.
 * @template T
 * @param {number} ms
 * @returns {(s: Stream<T>) => Stream<T>}
 */
function debounceTime<T>(ms: number): (s: Stream<T>) => Stream<T> {
  let _timer: number | null = null;
  return (stream) => {
    const _debouncedStream: Stream<T> = new Stream((observer) => {
      stream.subscribe({
        next: (data) => {
          if (_timer) {
            clearTimeout(_timer);
            _timer = null;
          }
          _timer = window.setTimeout(() => observer.next(data), ms);
        },
        complete: () => {
          if (_timer) window.clearTimeout(_timer);
          observer.complete();
        },
      });

      _debouncedStream.unsubscribe = () => {
        if (_timer) window.clearTimeout(_timer);
        if (typeof stream.unsubscribe === 'function') {
          stream.unsubscribe();
        }
      };
    });

    return _debouncedStream;
  };
}

/**
 * Combines two streams, emitting values as tuples of the most recent values from each stream whenever either stream emits a value.
 * @template T, U
 * @param {Stream<T>} streamA
 * @returns {(streamB: Stream<U>) => Stream<[T, U]>}
 */
function _withLatestFrom<T, U>(
  streamA: Stream<T>,
): (streamB: Stream<U>) => Stream<[T, U]> {
  let dataA: T;
  let dataB: U;

  let shouldComplete = false;
  return (streamB) => {
    const _tupleStream: Stream<[T, U]> = new Stream((observer) => {
      streamA.subscribe({
        next: (data) => {
          dataA = data;
          observer.next([dataA, dataB]);
        },
        complete: () => {
          if (!shouldComplete) {
            shouldComplete = true;
            return;
          }

          observer.complete();
        },
      });
      streamB.subscribe({
        next: (data) => {
          dataB = data;
          observer.next([dataA, dataB]);
        },
        complete: () => {
          if (!shouldComplete) {
            shouldComplete = true;
            return;
          }

          observer.complete();
        },
      });

      _tupleStream.unsubscribe = () => {
        if (typeof streamB.unsubscribe === 'function') {
          streamB.unsubscribe();
        }
        if (typeof streamA.unsubscribe === 'function') {
          streamA.unsubscribe();
        }
      };
    });

    return _tupleStream;
  };
}
