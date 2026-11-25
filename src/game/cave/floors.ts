// Floors with a rest room where you can tie the rope.
export const ROPE_FLOORS = [5, 10] as const;

// The rest floors the rope reaches: the ones you have already been to.
export function ropeFloors(deepest: number): number[] {
  return ROPE_FLOORS.filter((floor) => floor <= deepest);
}

// The deepest floor dug so far: no stairs lead on from it.
export const MAX_DEPTH = 10;
