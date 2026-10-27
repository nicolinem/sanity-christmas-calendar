"""Bake the winter variant of Kenney's Tiny Town tilemap.

Kenney ships Tiny Town in summer colours only. Instead of drawing new art, we
palette-swap specific tiles (grass -> snow, pines -> snowy evergreen, slate
roofs -> snow-covered, wood-wall windows -> warm lamplight). Pixels, outlines
and tile layout stay exactly as Kenney drew them, so the result still matches
Tiny Dungeon's characters and items.

Run from the repo root (needs Pillow):
    python3 scripts/winterize-tiles.py
"""

from PIL import Image

SRC = "public/assets/kenney/tiny-town.png"
OUT = "public/assets/winter-town.png"
COLS = 12
TILE = 16

SNOW = {
    "#84c669": "#e3ebf5",  # grass base -> snow
    "#65a556": "#c4d3e6",  # grass tufts -> snow shadow
    "#8bd87d": "#ffffff",  # grass highlight -> fresh snow
    "#479f4a": "#b5c6dc",
}
PATH = {
    "#eaa56c": "#c9a98f",  # dirt -> frozen, trodden earth
    "#cf8254": "#a07e6a",  # pebbles
    "#fec99c": "#e6d3c3",
}
SNOWY_PINE = {
    "#479f4a": "#2c5a4b",  # needles -> deep Nordic evergreen
    "#84c669": "#8fb7a8",  # sunlit side -> hoarfrost
}
EVERGREEN = {
    "#84c669": "#3d7660",
    "#479f4a": "#25493f",
    "#65a556": "#2f5f4f",
    "#8bd87d": "#e9f0f8",
}
SNOW_ROOF = {
    "#5a6988": "#c9d6e7",  # slate -> snow on the roof
    "#8b9bb4": "#e8eff8",
    "#c0cbdc": "#ffffff",
}
LIT_WINDOW = {
    "#c0cbdc": "#ffe09a",  # glass -> warm lamplight
    "#8b9bb4": "#f4a640",
}

ground = [0, 1, 43] + list(range(12, 15)) + list(range(24, 27)) + list(range(36, 43))
rules = {}
for i in ground:
    rules[i] = {**SNOW, **(PATH if i not in (0, 1, 43) else {})}
for i in (28,):
    rules[i] = SNOWY_PINE
for i in (4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 30, 31, 32):
    rules[i] = EVERGREEN
for i in (48, 49, 50, 60, 61, 62, 63):
    rules[i] = SNOW_ROOF
for i in (84,):
    rules[i] = LIT_WINDOW


def hex_to_rgb(h):
    return tuple(int(h[k : k + 2], 16) for k in (1, 3, 5))


def main():
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    for index, mapping in rules.items():
        lut = {hex_to_rgb(a): hex_to_rgb(b) for a, b in mapping.items()}
        ox, oy = (index % COLS) * TILE, (index // COLS) * TILE
        for y in range(oy, oy + TILE):
            for x in range(ox, ox + TILE):
                r, g, b, a = px[x, y]
                if a and (r, g, b) in lut:
                    px[x, y] = (*lut[(r, g, b)], a)
    im.save(OUT)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
