import Stream from './index.js';

/**
 * Returns a function that evaluates to true once every `n` calls.
 */
const skipN = (n: number) => {
  let counter = 0;
  return () => {
    counter = (counter + 1) % n;
    return counter === 0;
  };
};

// Emit a value every 100 millisecond and skip every 10
//
// - `Stream.fromInterval(100)` creates a stream that emits a value every 100 milliseconds.
// - `skipN(10)` creates a filter that allows only every 10th value to pass through.
const $oneSecStream = Stream.fromInterval(100).filter(skipN(10));

// - The stream will print emitted values until the emitted value is 50, then unsubscribes.
// - Once unsubscribed or naturally completed, the completion handler is executed.
$oneSecStream.subscribe({
  next: (tick) => {
    console.log(tick);
    if (tick >= 50) $oneSecStream.unsubscribe?.();
  },
  complete: () => {
    console.log('stream concluded');
  },
});

// Emit a tuple of values every 500 millisecond
//
// - `Stream.fromInterval(500)` creates a stream that emits a value every 500 milliseconds.
// - `Stream.fromInterval(1000)` creates a stream that emits a value every 1 second.
// - withLatestFrom combines both the Streams.
const $halfSecStream = Stream.fromInterval(500);
const $mixedTimerStream =
  Stream.fromInterval(1000).withLatestFrom($halfSecStream);

$mixedTimerStream.subscribe({
  next: ([halfSecTick, oneSecTick]) => {
    console.log(halfSecTick, oneSecTick);
    if (halfSecTick >= 5) $mixedTimerStream.unsubscribe?.();
  },
  complete: () => {
    console.log('stream concluded');
  },
});
