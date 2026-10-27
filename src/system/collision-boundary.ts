import type * as Popper from "@radix-ui/react-popper";

/** The installed Popper boundary type, as TooltipContentProps picks it. */
export type CollisionBoundary = Popper.PopperContentProps["collisionBoundary"];

/** A boundary only bounds a popup when it holds at least one element. */
export function isBounded(boundary: CollisionBoundary) {
  return Array.isArray(boundary) ? boundary.some(Boolean) : !!boundary;
}
