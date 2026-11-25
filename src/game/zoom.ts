// The largest whole-number camera zoom that still fits `view` (world px) in a
// canvas of width × height. Whole zooms keep the pixel art crisp.
export function integerZoom(
  width: number,
  height: number,
  view: { w: number; h: number },
): number {
  return Math.max(1, Math.floor(Math.min(width / view.w, height / view.h)));
}
