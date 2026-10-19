import type { ComponentId } from "./catalog";

// Ends a chain of page branches. When every ComponentId has been handled,
// `value` has narrowed to `never` and this compiles. A page without a branch
// is a type error at the call site, and throws if the types are bypassed.
export function assertNever(value: never, context: string): never {
  throw new Error(`${context}: unhandled component ${String(value)}`);
}

// Narrowing replacement for `[...].includes(component)`, which narrows nothing.
// The ids are checked against ComponentId, so a mistyped id fails the build.
export function isOneOf<const T extends ComponentId>(
  id: ComponentId,
  ids: readonly T[],
): id is T {
  return ids.some((candidate) => candidate === id);
}
