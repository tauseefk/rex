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

const $oneSecStream = Stream.fromInterval(100).filter(skipN(10));

$oneSecStream.subscribe({
  next: (tick) => {
    console.log(tick);
    if (tick >= 5) $oneSecStream.unsubscribe?.();
  },
  complete: () => {
    console.log('stream concluded');
  },
});
