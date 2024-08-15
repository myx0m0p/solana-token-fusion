import { assertNever } from './assertNever';

type Units = 'ms' | 's' | 'min';

function toMs(value: number, from: Exclude<Units, 'ms'>): number {
  switch (from) {
    case 's':
      return value * 1000;
    case 'min':
      return value * 60 * 1000;

    default:
      return assertNever(from);
  }
}

function toS(value: number, from: Exclude<Units, 's'>): number {
  switch (from) {
    case 'ms':
      return value / 1000;
    case 'min':
      return value * 60;

    default:
      return assertNever(from);
  }
}

function toMin(value: number, from: Exclude<Units, 'min'>): number {
  switch (from) {
    case 'ms':
      return value / 1000 / 60;
    case 's':
      return value / 60;

    default:
      return assertNever(from);
  }
}

function ms(value: number) {
  return {
    toS: () => toS(value, 'ms'),
    toMin: () => toMin(value, 'ms'),
  };
}

function s(value: number) {
  return {
    toMs: () => toMs(value, 's'),
    toMin: () => toMin(value, 's'),
  };
}

function min(value: number) {
  return {
    toMs: () => toMs(value, 'min'),
    toS: () => toS(value, 'min'),
  };
}

export const timeUnit = {
  toMs,
  toS,
  toMin,
  ms,
  s,
  min,
} as const;
