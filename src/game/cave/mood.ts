// The cave's look, as numbers the scene reads.

// Multiply tint for roof tiles (a wall with no floor below), so they read as
// dark rock above the brick wall fronts.
export const ROOF_TINT = 0x30344c;

// Dark margin around a floor the camera follows over, in tiles, so a corner
// can come out from under the HUD.
export const CAMERA_PAD_TILES = 4;

// Lighting (WebGL only). Ambient for depth 1–9, and darker from depth 10.
export const AMBIENT = 0x464c6e;
export const AMBIENT_DEEP = 0x343a54;
export const DEEP_FROM = 10;

// height = the light's z as a fraction of its radius. Phaser's default 0.1 with
// flat normals makes a light fade within ~3 tiles whatever the radius.
// A cool light that follows the knight.
export const PLAYER_LIGHT = {
  radius: 150,
  color: 0xcfdcff,
  intensity: 0.9,
  height: 0.35,
};

// A warm light on each torch; its radius flickers by ±amount at hz.
export const TORCH_LIGHT = {
  radius: 88,
  color: 0xffa45c,
  intensity: 1.2,
  height: 0.35,
};
// A faint cold glow so the stairs (and a rest floor's chest) can be found in the dark.
export const MARKER_LIGHT = {
  radius: 48,
  color: 0xbfd4ff,
  intensity: 0.7,
  height: 0.4,
};
// The same glow, dimmer, on the rubble where the deepest floor's stairs would be.
export const BOTTOM_LIGHT = { ...MARKER_LIGHT, intensity: 0.4 };
// Isdragen's own cold glow, so the boss shows on a dark floor.
export const ICE_BOSS_LIGHT = {
  radius: 64,
  color: 0x8fd3ff,
  intensity: 1.4,
  height: 0.35,
};
export const TORCH_FLICKER = { amount: 0.1, hz: 5 };

// A few flakes drifting down through the view (px per second).
export const SNOW = { perSecond: 3, fallSpeed: 10, alpha: 0.5 };
