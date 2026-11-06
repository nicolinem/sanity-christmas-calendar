from weeks import *
from rhythm import big_btn, key

DECORATED = "/_blob/a8961286449ac71d3114aeb42c77a658"
KNIGHT = "/_blob/1d6a0615ea99491d77d7158453be16e1"
VETERAN = "/_blob/a7bb7c391d6f410fb441773e644dcda1"
SWORD = "/_blob/564c767e26e4d22f71dba28a993ca8e9"
AXE = "/_blob/e1bdd56373651fb72699fe7cd84d68a8"
MONSTER = "/_blob/b4f43371fb21a059532007ce44a7f689"


def cozy_page(title, body, w=1280, h=800):
    # The village is decorated from the start in every option here
    return page(title, w, h, body).replace(VILLAGE, DECORATED, 1).replace("opacity: 0.3", "opacity: 0.6", 1)


def chip(text, color):
    return f'<span style="padding: 2px 8px; background: #1b1f33; color: {color}; font-size: 12px">{text}</span>'


def fit(label, score):
    color = {"✓": "#6fd1a8", "~": "#fdbe53", "✗": "#f03e2f"}[score]
    return f'<div style="display: flex; gap: 8px; font-size: 13px"><span style="width: 14px; color: {color}">{score}</span><span style="color: #c0cbdc">{label}</span></div>'


OPTIONS = [
    ("1", "Det du lager, finnes i spillet", "Våpen, monstre og bilder fra Studio dukker opp i spillet. Det er fremgangen. Ingen ekstra belønning.",
     [("Flerspiller: du ser andres våpen", "✓"), ("Koselig fra start", "✓"), ("Synlig fremgang uten innhold", "~")], "Finnes allerede", SWORD, True),
    ("2", "Pynt på figuren din", "Hver oppgave gir noe figuren bærer: lue, skjerf, lykt, kappe. Andre ser det når dere møtes.",
     [("Flerspiller: synlig for alle", "✓"), ("Koselig fra start", "✓"), ("Trenger nye sprites", "~")], "Middels", KNIGHT, True),
    ("3", "Felles juletre", "Bygda er pyntet fra start. Hver oppgave noen gjør, henger en kule med navnet sitt på treet på torget.",
     [("Flerspiller: laget for det", "✓"), ("Koselig fra start", "✓"), ("Din egen fremgang blir mindre synlig", "~")], "Middels", TREE, True),
    ("4", "Din egen hytte", "Alle har en hytte i bygda. Oppgavene pynter din hytte. Andre kan gå forbi og se.",
     [("Flerspiller: én hytte per deltaker", "~"), ("Koselig fra start", "~"), ("Mye kart og grafikk", "✗")], "Stor", LIT, False),
    ("5", "Samling av kort", "Hver oppgave gir et kort med det du lærte. Kortene samles i en bok du kan bla i senere.",
     [("Flerspiller: ikke synlig for andre", "~"), ("Koselig fra start", "✓"), ("Lite spill-følelse", "~")], "Liten", MAGE, False),
    ("6", "Lys i bygda (som nå)", "Bygda er mørk og blir pyntet for hver oppgave.",
     [("Flerspiller: hvem sitt lys?", "✗"), ("Koselig fra start", "✗"), ("Tydelig fremgang", "✓")], "Middels", "/_blob/c51d8f340f690695a3c45e628cb61484", False),
]


def overview():
    cards = []
    for n, title, text, fits, cost, icon, good in OPTIONS:
        ring = "#6fd1a8" if good else "#3a4263"
        cards.append(f'''    <div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; background: #262b44; box-shadow: inset 0 0 0 2px {ring}; min-width: 0">
      <div style="display: flex; align-items: center; gap: 12px">
        <img src="{icon}" alt="" style="width: 40px; height: 40px; image-rendering: pixelated; background: #1b1f33; padding: 4px">
        <div style="display: flex; flex-direction: column; min-width: 0"><span style="font-size: 12px; color: #8b9bb4">Retning {n}</span><span style="font-size: 18px; line-height: 1.2">{title}</span></div>
      </div>
      <span style="font-size: 14px; line-height: 1.45">{text}</span>
      <div style="display: flex; flex-direction: column; gap: 3px">
        {"".join(fit(l, s) for l, s in fits)}
      </div>
      <span style="flex: 1"></span>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px"><span style="color: #8b9bb4">Å bygge</span>{chip(cost, "#e3ebf5")}</div>
    </div>''')
    body = f'''  <div style="position: absolute; inset: 0; background: rgba(27, 31, 51, 0.82)"></div>
  <div style="position: absolute; inset: 36px 48px; display: flex; flex-direction: column; gap: 18px">
    <div style="display: flex; align-items: baseline; gap: 18px">
      <span style="{JERSEY}; font-size: 44px; line-height: 1">Hvordan vises fremgang?</span>
      <span style="font-size: 15px; color: #c0cbdc">Bygda er pyntet fra start i alle retningene unntatt 6.</span>
    </div>
    <div style="flex: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 16px; min-height: 0">
{chr(10).join(cards)}
    </div>
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #1b1f33; box-shadow: inset 0 0 0 2px #6fd1a8; font-size: 15px">
      <span style="color: #6fd1a8">Forslag</span>
      <span>1 som kjerne, 2 for din egen fremgang, 3 for det dere gjør sammen. 4, 5 og 6 legges bort.</span>
    </div>
  </div>'''
    return cozy_page("Fremgang: seks retninger", body)


# ---------- 2: pynt på figuren ----------
def wardrobe():
    slots = [
        ("Lue", "Uke 1 · oppgave 1", True, "#c4242a"),
        ("Skjerf", "Uke 1 · oppgave 2", True, "#6fd1a8"),
        ("Votter", "Uke 1 · oppgave 3", True, "#8fd3ff"),
        ("Lykt", "Uke 1 · oppgave 4", True, "#fdbe53"),
        ("Kappe", "Uke 2 · oppgave 1", True, "#8a4b2a"),
        ("Bjelle", "Uke 2 · oppgave 2", False, ""),
        ("Ski", "Uke 2 · oppgave 3", False, ""),
        ("Reinsdyrgevir", "Bonus", False, ""),
    ]
    cells = "\n".join(
        f'''        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: {"#1b1f33" if on else "#20253a"}; {"box-shadow: inset 0 0 0 2px #fdbe53;" if name == "Kappe" else ""}">
          <span style="width: 28px; height: 28px; background: {color if on else "transparent"}; box-shadow: inset 0 0 0 2px {"#1b1f33" if on else "#3a4263"}; {"" if on else "border: 2px dashed #3a4263; box-sizing: border-box;"}"></span>
          <div style="display: flex; flex-direction: column; min-width: 0"><span style="font-size: 14px; color: {"#e3ebf5" if on else "#6f7aa0"}">{name}</span><span style="font-size: 11px; color: #8b9bb4">{src}</span></div>
          <span style="flex: 1"></span>
          <span style="font-size: 12px; color: {"#6fd1a8" if on else "#5a6488"}">{"På" if on else ""}</span>
        </div>''' for name, src, on, color in slots)
    others = "\n".join(
        f'''      <div style="position: absolute; left: {x}px; top: {y}px; display: flex; flex-direction: column; align-items: center; gap: 4px">
        <span style="padding: 1px 6px; background: rgba(27, 31, 51, 0.85); font-size: 11px">{name}</span>
        <div style="position: relative; width: 48px; height: 48px"><img src="{img}" alt="" style="width: 48px; height: 48px; image-rendering: pixelated">{"<span style='position: absolute; left: 14px; top: -4px; width: 20px; height: 8px; background: #c4242a; box-shadow: 0 -4px 0 -2px #e3ebf5'></span>" if hat else ""}</div>
      </div>''' for name, img, x, y, hat in [("Kari", VIKING, 120, 430, True), ("Ola", MAGE, 230, 470, False), ("Siv", RANGER, 330, 410, True)])
    body = f'''  <div style="position: absolute; left: 0; top: 0; width: 640px; height: 800px">
{others}
  </div>
  <div style="position: absolute; top: 40px; right: 40px; bottom: 40px; width: 560px; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column">
    <div style="display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 2px solid #1b1f33">
      <span style="{JERSEY}; font-size: 32px; line-height: 1">Figuren din</span>
      <span style="flex: 1"></span>
      <span style="font-size: 13px; color: #fdbe53">5 av 12</span>
      <button type="button" style="padding: 4px 8px; background: transparent; border: 2px solid #8b9bb4; color: #e3ebf5; font: inherit; font-size: 12px">Lukk</button>
    </div>
    <div style="display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; padding: 16px 20px; flex: 1; min-height: 0">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: #1b1f33">
        <div style="position: relative; width: 128px; height: 128px">
          <img src="{KNIGHT}" alt="Figuren din" style="width: 128px; height: 128px; image-rendering: pixelated">
          <span style="position: absolute; left: 38px; top: -8px; width: 52px; height: 18px; background: #c4242a; box-shadow: 0 -8px 0 -4px #e3ebf5"></span>
          <span style="position: absolute; left: 34px; top: 58px; width: 60px; height: 10px; background: #6fd1a8"></span>
          <span style="position: absolute; right: -6px; top: 70px; width: 14px; height: 20px; background: #fdbe53; box-shadow: 0 0 12px 4px rgba(253, 190, 83, 0.4)"></span>
        </div>
        <span style="font-size: 13px; color: #c0cbdc">Skissert pynt</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; min-height: 0">
{cells}
      </div>
    </div>
    <div style="padding: 12px 20px; border-top: 2px solid #1b1f33; font-size: 13px; line-height: 1.45; color: #c0cbdc">Hver oppgave gir én ting. Du velger selv hva figuren har på seg. De andre ser figuren din når dere er i bygda samtidig.</div>
  </div>'''
    return cozy_page("Retning 2: pynt på figuren", body)


# ---------- 3: felles juletre ----------
def shared_tree():
    import random
    random.seed(4)
    colors = ["#c4242a", "#fdbe53", "#8fd3ff", "#6fd1a8", "#f3e9d2"]
    balls = []
    for i in range(37):
        row = random.random() ** 0.8
        y = 120 + row * 420
        half = 30 + row * 170
        x = 320 + (random.random() * 2 - 1) * half
        balls.append(f'<span style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; width: 14px; height: 14px; background: {random.choice(colors)}; box-shadow: inset -3px -3px 0 rgba(0,0,0,0.25)"></span>')
    mine = '<span style="position: absolute; left: 372px; top: 380px; width: 18px; height: 18px; background: #fdbe53; box-shadow: 0 0 0 3px #1b1f33, 0 0 0 5px #fdbe53, 0 0 16px 6px rgba(253, 190, 83, 0.5)"></span>'
    tree_layers = "\n".join(
        f'<div style="position: absolute; left: {327 - w // 2}px; top: {t}px; width: {w}px; height: 120px; background: #2c5a4b; clip-path: polygon(50% 0, 100% 100%, 0 100%); box-shadow: inset 0 -10px 0 #3f7a66"></div>'
        for w, t in [(200, 100), (300, 220), (400, 340), (480, 450)])
    feed = [
        ("Kari", "Bytte fra monstre", "nå"),
        ("Du", "Bytte fra monstre", "4 min siden"),
        ("Ola", "Ny type for monstre", "12 min siden"),
        ("Siv", "Egen pikselkunst", "i går"),
    ]
    feed_html = "\n".join(
        f'''        <div style="display: flex; gap: 10px; padding: 8px 10px; font-size: 14px; {"background: #3a4263;" if who == "Du" else ""}"><span style="color: #fdbe53; width: 44px">{who}</span><span style="flex: 1">{task}</span><span style="font-size: 12px; color: #8b9bb4">{when}</span></div>'''
        for who, task, when in feed)
    body = f'''  <div style="position: absolute; left: 0; top: 0; width: 680px; height: 800px">
    <div style="position: absolute; left: 307px; top: 570px; width: 40px; height: 60px; background: #8a4b2a"></div>
{tree_layers}
    <span style="position: absolute; left: 311px; top: 70px; width: 32px; height: 32px; background: #fdbe53; clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); filter: drop-shadow(0 0 8px #fdbe53)"></span>
{chr(10).join(balls)}
{mine}
    <span style="position: absolute; left: 400px; top: 376px; padding: 2px 8px; background: #1b1f33; font-size: 12px; color: #fdbe53">Din kule</span>
  </div>
  <div style="position: absolute; top: 40px; right: 40px; width: 520px; padding: 20px; box-sizing: border-box; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column; gap: 14px">
    <div style="display: flex; flex-direction: column; gap: 4px">
      <span style="{JERSEY}; font-size: 36px; line-height: 1">Juletreet på torget</span>
      <span style="font-size: 14px; color: #c0cbdc">Hver oppgave noen gjør, henger en kule på treet.</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px">
      <div style="display: flex; justify-content: space-between; font-size: 14px"><span>38 kuler</span><span style="color: #c0cbdc">Stjernen tennes ved 100</span></div>
      <div style="height: 12px; background: #1b1f33"><div style="width: 38%; height: 12px; background: #fdbe53"></div></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 2px; background: #1b1f33; padding: 4px">
{feed_html}
    </div>
    <span style="font-size: 13px; line-height: 1.45; color: #c0cbdc">Kulene viser hvem som har gjort hva, men ingen rangering. 100 er en startverdi: rundt 10 deltakere ganger 12 oppgaver gir 120 mulige.</span>
  </div>'''
    return cozy_page("Retning 3: felles juletre", body)


if __name__ == "__main__":
    for name, html in {
        "Fremgang.dc.html": overview(),
        "Fremgang-figur.dc.html": wardrobe(),
        "Fremgang-tre.dc.html": shared_tree(),
    }.items():
        (OUT / name).write_text(html)
    print("ok")
