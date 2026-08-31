export type Gesture = "dismiss" | "previous" | "next" | "none";

const MINIMUM_DISTANCE = 96;

export function classifyGesture(deltaX: number, deltaY: number): Gesture {
  const horizontal = Math.abs(deltaX);
  const vertical = Math.abs(deltaY);

  if (deltaY >= MINIMUM_DISTANCE && vertical > horizontal) return "dismiss";
  if (horizontal >= MINIMUM_DISTANCE && horizontal > vertical) return deltaX > 0 ? "previous" : "next";
  return "none";
}
