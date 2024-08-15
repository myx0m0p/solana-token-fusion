/* eslint-disable @typescript-eslint/restrict-template-expressions */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value - ${value}`);
}
