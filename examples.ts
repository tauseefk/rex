import Stream from './index';

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
