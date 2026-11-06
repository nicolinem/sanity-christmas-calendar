import sys
from PIL import Image, ImageDraw
root, out = sys.argv[1], sys.argv[2]
town = Image.open(f"{root}/public/assets/winter-town.png").convert("RGBA")
dun = Image.open(f"{root}/public/assets/kenney/tiny-dungeon.png").convert("RGBA")
T = 16
def tile(sheet, f):
    c, r = f % 12, f // 12
    return sheet.crop((c*T, r*T, c*T+T, r*T+T))
def unlit(t):
    t = t.copy(); px = t.load()
    for y in range(T):
        for x in range(T):
            r,g,b,a = px[x,y]
            if a and r > 200 and g > 150:  # yellow glass and its highlights -> dark glass
                px[x,y] = (58, 68, 99, a)
    return t
W, H = 18, 9
def scene(decorated):
    im = Image.new("RGBA", (W*T, H*T), (38, 43, 68, 255))
    for y in range(6, H):
        for x in range(W):
            im.alpha_composite(tile(town, 0), (x*T, y*T))
    for x0 in (1, 7, 13):
        rows = [[48,49,50],[60,61,62],[72,73,75],[84,85,84]]
        for ry, row in enumerate(rows):
            for rx, f in enumerate(row):
                t = tile(town, f)
                if f == 84 and not decorated: t = unlit(t)
                im.alpha_composite(t, ((x0+rx)*T, (2+ry)*T))
        if decorated:
            im.alpha_composite(tile(dun, 29), ((x0+1)*T, 4*T))
    for x in (0, 5, 11, 17):
        gold = decorated and x == 11
        im.alpha_composite(tile(town, 3 if gold else 4), (x*T, 4*T))
        im.alpha_composite(tile(town, 15 if gold else 16), (x*T, 5*T))
    d = ImageDraw.Draw(im)
    if decorated:
        colors = [(253,190,83,255),(240,62,47,255),(143,211,255,255)]
        for x0 in (1, 7, 13):
            for i, px in enumerate(range(x0*T+1, (x0+3)*T, 4)):
                d.rectangle([px, 4*T-1, px+1, 4*T], fill=colors[i % 3])
    for sx, sy in [(20,6),(70,14),(120,4),(170,20),(220,9),(260,24),(40,28),(150,30)]:
        d.point((sx, sy), fill=(227,235,245,255))
    return im.resize((W*T*4, H*T*4), Image.NEAREST)
scene(False).save(f"{out}/village-plain.png")
scene(True).save(f"{out}/village-decorated.png")
for f, n in [(84, "window-lit"), (15, "tree-gold")]:
    tile(town, f).resize((64,64), Image.NEAREST).save(f"{out}/{n}.png")
unlit(tile(town, 84)).resize((64,64), Image.NEAREST).save(f"{out}/window-dark.png")
tile(dun, 29).resize((64,64), Image.NEAREST).save(f"{out}/banner.png")
tile(town, 83).resize((64,64), Image.NEAREST).save(f"{out}/sign.png")
print("ok")
