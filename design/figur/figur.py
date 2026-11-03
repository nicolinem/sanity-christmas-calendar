"""Layered 16x16 characters in the Tiny Dungeon style.

Each layer is a 16x16 map of role letters. A role gets its colour from the
player's choices, so one drawing gives many variants. The dark outline is
added last, around everything that is drawn, like Tiny Dungeon does it.
"""
from PIL import Image
import pathlib, random

HERE = pathlib.Path(__file__).parent
OUTLINE = (0x3F, 0x26, 0x31, 255)


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


# Colour choices, each a (main, shade) pair from the same palette as the UI
SKIN = {"lys": ("#f7c282", "#e19a65"), "middels": ("#e4a672", "#b86f50"),
        "brun": ("#bd6c4a", "#8a4836"), "mørk": ("#8a4836", "#5c2f2a")}
HAIR = {"brun": ("#b86f50", "#763b36"), "svart": ("#3a4466", "#262b44"),
        "blond": ("#fee761", "#feae34"), "rød": ("#f77622", "#be4a2f"),
        "hvit": ("#ffffff", "#c0cbdc"), "rosa": ("#f6757a", "#b55088")}
CLOTH = {"rød": ("#e43b44", "#a22633"), "grønn": ("#3e8948", "#265c42"),
         "blå": ("#0099db", "#124e89"), "lilla": ("#b55088", "#68386c"),
         "grå": ("#8b9bb4", "#5a6988"), "gul": ("#feae34", "#f77622")}
PANTS = {"mørk": ("#3a4466", "#262b44"), "brun": ("#763b36", "#5c2f2a"), "grå": ("#5a6988", "#3a4466")}
FIXED = {"E": "#262b44", "W": "#ffffff", "w": "#c0cbdc", "Y": "#feae34", "y": "#f77622", "k": "#262b44", "G": "#fee761"}

BLANK = ["." * 16] * 16


def grid(*rows, top=0):
    """Rows of up to 16 chars, starting at row `top`; the rest is empty."""
    out = list(BLANK)
    for i, r in enumerate(rows):
        out[top + i] = r.ljust(16, ".")
    return out


# --- Body: head, hands, legs. S/s skin, E eyes, P/p trousers, B boots ---
BODY = grid(
    ".....SSSSSS",
    "....SSSSSSSS",
    "....SSSSSSSS",
    "....SSSSSSSS",
    "....SSESSSES",
    "....sSESssEs",
    ".....ssSSSs",
    "",
    "",
    "..SS........SS",
    "..SS.PPPPPP.SS",
    ".....pp..pp",
    ".....BB..BB",
    top=3)

# --- Hair: H/h ---
HAIRSTYLES = {
    "kort": grid(
        ".....hHHHHh",
        "....hHHHHHHh",
        "....HH.HHH.H",
        "....H",
        top=3),
    "lang": grid(
        ".....hHHHHh",
        "....hHHHHHHh",
        "...HHH.HHH.HH",
        "..HHH.......HH",
        "..HH........HH",
        "..HH........HH",
        "..Hh........hH",
        "..h..........h",
        top=3),
    "bolle": grid(
        "......hHHh",
        ".....hHHHHh",
        "",
        ".....hHHHHh",
        "....hHHHHHHh",
        "....HHHHHHHH",
        "....H......H",
        top=0),
    "fletter": grid(
        ".....hHHHHh",
        "....hHHHHHHh",
        "...HH.HHHH.HH",
        "...H........H",
        "...H........H",
        "..hH........Hh",
        "..H..........H",
        "..h..........h",
        top=3),
    "skjegg": grid(
        ".....hHHHHh",
        "....hHHHHHHh",
        "....HH.HHH.H",
        "....H",
        "",
        "",
        "....HhHHHHhH",
        ".....hHHHHh",
        top=3),
}

# --- Tops: C/c main and shade; trim and details use fixed colours ---
TOPS = {
    "genser": grid(
        "....CCCCCCCC",
        "...CCCCCCCCCC",
        "....cCWCCWCc",
        "....cCCCCCCc",
        top=10),
    "nissedrakt": grid(
        "....WWWWWWWW",
        "...CCCCWCCCCC",
        "....kkkYYkkk",
        "....WWWWWWWW",
        top=10),
    "frakk": grid(
        "....WwWWWWwW",
        "...CCCCYCCCCC",
        "....cCCCYCCc",
        "....cCCCYCCc",
        top=10),
    "kjole": grid(
        "....CCCCCCCC",
        "...CCCCCCCCCC",
        "....cCCYYCCc",
        "...cCCCCCCCCc",
        "...cccccccccc",
        top=10),
}

# --- Hats: A/a main and shade ---
HATS = {
    "ingen": BLANK,
    "nisselue": grid(
        "..........WW",
        "........AAWW",
        "......AAAAa",
        ".....AAAAAAa",
        "...WWWWWWWWWW",
        top=0),
    "topplue": grid(
        ".......WW",
        "......WWWW",
        ".....AaAaAa",
        "....AaAaAaAa",
        "...wWWWWWWWWw",
        top=0),
    "øreklokker": grid(
        ".....aAAAAa",
        "....a......a",
        "",
        "..WW........WW",
        "..Ww........wW",
        "..ww........ww",
        top=2),
    "krone": grid(
        "....Y..Y..Y",
        "....YyYYYyYY",
        "....YGYYYGYY",
        top=2),
}

# --- Scarves: K/k main ---
SCARVES = {
    "ingen": BLANK,
    "skjerf": grid(
        "....KWKWKWKW",
        "....KW",
        ".....W",
        top=10),
}

# --- Small extras ---
EXTRAS = {
    "ingen": BLANK,
    "votter": grid("..MM........MM", "..MM........MM", top=12),
    "lykt": grid("..............k", ".............kkk", ".............YGY", ".............YGY", ".............kkk", top=11),
}


def compose(choice):
    roles = {
        "S": SKIN[choice["hud"]][0], "s": SKIN[choice["hud"]][1],
        "H": HAIR[choice["hårfarge"]][0], "h": HAIR[choice["hårfarge"]][1],
        "C": CLOTH[choice["klesfarge"]][0], "c": CLOTH[choice["klesfarge"]][1],
        "P": PANTS[choice["bukse"]][0], "p": PANTS[choice["bukse"]][1], "B": "#262b44",
        "A": CLOTH[choice["luefarge"]][0], "a": CLOTH[choice["luefarge"]][1],
        "K": CLOTH[choice["skjerffarge"]][0], "M": CLOTH[choice["skjerffarge"]][0],
        **FIXED,
    }
    layers = [BODY, HAIRSTYLES[choice["hår"]], TOPS[choice["overdel"]],
              SCARVES[choice["skjerf"]], HATS[choice["lue"]], EXTRAS[choice["ekstra"]]]
    im = Image.new("RGBA", (16, 16))
    px = im.load()
    for layer in layers:
        for y, row in enumerate(layer):
            for x, ch in enumerate(row[:16]):
                if ch != ".":
                    px[x, y] = hx(roles[ch]) if isinstance(roles[ch], str) else roles[ch]
    return add_outline(im)


def add_outline(im):
    out = Image.new("RGBA", im.size)
    src, dst = im.load(), out.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        if 0 <= x + dx < w and 0 <= y + dy < h:
                            dst[x + dx, y + dy] = OUTLINE
    out.alpha_composite(im)
    return out


OPTIONS = {
    "hud": list(SKIN), "hår": list(HAIRSTYLES), "hårfarge": list(HAIR),
    "overdel": list(TOPS), "klesfarge": list(CLOTH), "bukse": list(PANTS),
    "lue": list(HATS), "luefarge": list(CLOTH), "skjerf": list(SCARVES),
    "skjerffarge": list(CLOTH), "ekstra": list(EXTRAS),
}



def idle_frames(choice):
    """Two frames: the second bobs the upper body down one pixel."""
    a = compose(choice)
    b = Image.new("RGBA", (16, 16))
    b.alpha_composite(a.crop((0, 0, 16, 13)), (0, 1))
    b.alpha_composite(a.crop((0, 13, 16, 16)), (0, 13))
    return [a, b]


def gif(picks, path, scale=8):
    frames = []
    for f in range(2):
        sheet = Image.new("RGBA", (len(picks) * 20 * scale, 20 * scale), (38, 43, 68, 255))
        for i, c in enumerate(picks):
            sheet.alpha_composite(idle_frames(c)[f].resize((16 * scale, 16 * scale), Image.NEAREST), (i * 20 * scale + 2 * scale, 2 * scale))
        frames.append(sheet.convert("P", palette=Image.ADAPTIVE))
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=450, loop=0, disposal=2)


if __name__ == "__main__":
    rnd = random.Random(7)
    picks = [
        dict(hud="lys", hår="kort", hårfarge="brun", overdel="genser", klesfarge="rød", bukse="mørk", lue="nisselue", luefarge="rød", skjerf="ingen", skjerffarge="grønn", ekstra="ingen"),
        dict(hud="brun", hår="lang", hårfarge="svart", overdel="frakk", klesfarge="grønn", bukse="brun", lue="topplue", luefarge="lilla", skjerf="skjerf", skjerffarge="lilla", ekstra="votter"),
        dict(hud="middels", hår="fletter", hårfarge="rød", overdel="kjole", klesfarge="blå", bukse="mørk", lue="øreklokker", luefarge="blå", skjerf="ingen", skjerffarge="rød", ekstra="ingen"),
        dict(hud="lys", hår="skjegg", hårfarge="hvit", overdel="nissedrakt", klesfarge="rød", bukse="mørk", lue="nisselue", luefarge="rød", skjerf="ingen", skjerffarge="rød", ekstra="lykt"),
        dict(hud="mørk", hår="bolle", hårfarge="svart", overdel="genser", klesfarge="gul", bukse="grå", lue="ingen", luefarge="rød", skjerf="skjerf", skjerffarge="rød", ekstra="ingen"),
        dict(hud="middels", hår="kort", hårfarge="blond", overdel="frakk", klesfarge="lilla", bukse="mørk", lue="krone", luefarge="gul", skjerf="ingen", skjerffarge="grønn", ekstra="lykt"),
    ]
    for _ in range(10):
        picks.append({k: rnd.choice(v) for k, v in OPTIONS.items()})
    td = Image.open("/Users/nicoline.mork/Projects/Personal/sanity-christmas-calendar/public/assets/kenney/tiny-dungeon.png").convert("RGBA")
    S = 6
    cols = 8
    rows = (len(picks) + cols - 1) // cols + 1
    sheet = Image.new("RGBA", (cols * 20 * S, rows * 20 * S), (38, 43, 68, 255))
    for i, c in enumerate(picks):
        x, y = (i % cols) * 20 * S + 2 * S, (i // cols) * 20 * S + 2 * S
        sheet.alpha_composite(compose(c).resize((16 * S, 16 * S), Image.NEAREST), (x, y))
    for j, idx in enumerate([85, 86, 87, 88, 96, 97, 98, 99]):
        t = td.crop(((idx % 12) * 16, (idx // 12) * 16, (idx % 12) * 16 + 16, (idx // 12) * 16 + 16))
        sheet.alpha_composite(t.resize((16 * S, 16 * S), Image.NEAREST), (j * 20 * S + 2 * S, (rows - 1) * 20 * S + 2 * S))
    sheet.save(HERE / "preview.png")
    gif(picks[:6], HERE / "idle.gif")
    print("ok", sheet.size)

