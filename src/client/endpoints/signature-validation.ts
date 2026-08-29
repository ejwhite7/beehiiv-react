/** Runtime guards for JavaScript callers of dual-signature endpoint methods. */

/** Require a non-null, non-array object payload with a clear operation label. */
export function requireObjectPayload<T extends object>(
  operation: string,
  value: unknown,
): T {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${operation} requires an object payload`);
  }
  return value as T;
}

/** Require a string-array payload for tag mutation calls. */
export function requireStringArrayPayload(
  operation: string,
  value: unknown,
): string[] {
  if (
    !Array.isArray(value) ||
    value.some((item: unknown) => typeof item !== 'string')
  ) {
    throw new TypeError(`${operation} requires a string array payload`);
  }
  return value;
}
