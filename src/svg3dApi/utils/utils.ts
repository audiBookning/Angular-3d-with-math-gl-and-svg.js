/*
    UTILS - general
   */
export const GroupBy = <T>(
  array: Array<T>,
  property: (x: T) => string
): { [key: string]: Array<T> } =>
  array.reduce((memo: { [key: string]: Array<T> }, x: T) => {
    if (!memo[property(x)]) {
      memo[property(x)] = [];
    }
    memo[property(x)].push(x);
    return memo;
  }, {});

// REF: https://stackoverflow.com/a/47125303/3658510
export const color_generator = () =>
  '#' +
  Math.round(0x1000000 + 0xffffff * Math.random())
    .toString(16)
    .slice(1);
