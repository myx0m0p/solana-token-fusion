export function hasOwnProp<O extends Record<string, unknown>, P extends PropertyKey>(
  obj: O,
  prop: P
): obj is O & Record<P, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
