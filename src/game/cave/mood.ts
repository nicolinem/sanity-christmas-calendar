// The cave's look, as numbers the scene reads.

// Multiply tint for roof tiles (a wall with no floor below), so they read as
// dark rock above the brick wall fronts.
export const ROOF_TINT = 0x30344c;

// Dark margin around a floor the camera follows over, in tiles, so a corner
// can come out from under the HUD.
export const CAMERA_PAD_TILES = 4;

// Lighting (WebGL only). Ambient for depth 1–9, and darker from depth 10.
export const AMBIENT = 0x3c4260;
export const AMBIENT_DEEP = 0x262a3e;
export const DEEP_FROM = 10;

// A cool light that follows the knight.
export const PLAYER_LIGHT = { radius: 110, color: 0xcfdcff, intensity: 1.1 };

// A warm light on each torch; its radius flickers by ±amount at hz.
export const TORCH_LIGHT = { radius: 72, color: 0xffa45c, intensity: 1.5 };
export const TORCH_FLICKER = { amount: 0.1, hz: 5 };

// A few flakes drifting down through the view (px per second).
export const SNOW = { perSecond: 3, fallSpeed: 10, alpha: 0.5 };
