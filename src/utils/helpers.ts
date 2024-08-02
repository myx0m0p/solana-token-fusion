import BN from 'bn.js';

export const getFullAmount = (amount: number, decimals: number) =>
  new BN(amount).mul(new BN(10 ** decimals));

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function splitArray<T>(arr: T[], size: number) {
  const result: Array<Array<T>> = [];

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
}

// convert bigint to human readable string
export const bigintToHuman = (amount: bigint, decimals = 9, symbol = 'SOL') => {
  const amountStr = amount.toString();
  const { length } = amountStr;
  const intPart = amountStr.slice(0, length - decimals);
  const decPart = amountStr.slice(length - decimals);
  return `${intPart}.${decPart} ${symbol}`;
};

// convert number to human readable string
export const numberToHuman = (amount: number, precision = 4, decimals = 9, symbol = 'SOL') =>
  `${(amount / 10 ** decimals).toFixed(precision)} ${symbol}`;
