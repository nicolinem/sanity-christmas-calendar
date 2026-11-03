import pathlib

OUT = pathlib.Path(__file__).parent / "ny-canvas" / "project"

VILLAGE = "/_blob/208487001bd7ece0606173aba742917e"
LIT = "/_blob/81631ca48488bee7c2396e4665733264"
BANNER = "/_blob/76c27a0d2de19be811e89dde436500c5"
SIGN = "/_blob/1c48bbb90d0d6b963e51f09a324cc6c8"
TREE = "/_blob/db824591736e6ef54c550bf1199a6837"
VIKING = "/_blob/b619ad868ecb2e0a3071bae4660e4d96"
MAGE = "/_blob/d477a06fc47ee68099afd02779949375"
RANGER = "/_blob/619c0aec40cb6fb6b285b75f1bd35682"

MONO = "font-family: 'JetBrains Mono', monospace"
JERSEY = "font-family: 'Jersey 10', 'Pixelify Sans', sans-serif"
BTN = "background: #3a4263; border: 0; box-shadow: inset 0 2px 0 #4d5781; color: #e3ebf5; font: inherit"
BTN_MAIN = "background: #e38628; border: 0; box-shadow: inset 0 2px 0 #fdbe53; color: #2a140e; font: inherit; font-weight: 600"

# (title, term, minutes, status, gives-icon, gives-text)
WEEKS = [
    {"n": 1, "theme": "Studio", "dates": "30. nov–4. des", "state": "done", "tasks": [
        ("Publiser et våpen", "schema", 15, "done", LIT, "En julekule"),
        ("Ikon og preview", "preview", 15, "done", BANNER, "En julekule"),
        ("Regler for våpen", "validation", 20, "done", LIT, "En julekule"),
        ("Velg sprite med bilder", "custom input", 25, "done", SIGN, "En julekule"),
    ], "bonus": ("Se våpenet i Studio", "document view", 30, "done", VIKING, "Ny figur: viking")},
    {"n": 2, "theme": "Innholdsmodellering", "dates": "7.–11. des", "state": "now", "tasks": [
        ("Ny type for monstre", "document type", 20, "done", BANNER, "En julekule"),
        ("Bytte fra monstre", "reference", 15, "active", LIT, "En julekule"),
        ("Finn de sterkeste monstrene", "GROQ", 15, "todo", SIGN, "En julekule"),
        ("Egen pikselkunst", "image", 25, "todo", LIT, "En julekule"),
    ], "bonus": ("Flere GROQ-oppgaver", "GROQ", 30, "todo", MAGE, "Ny figur: magiker")},
    {"n": 3, "theme": "Utover skjemaet", "dates": "14.–18. des", "state": "locked", "tasks": [
        ("Egen Smi-knapp", "document action", 20, "locked", LIT, ""),
        ("Tekst med bilder", "Portable Text", 20, "locked", BANNER, ""),
        ("Svar når du publiserer", "Functions", 25, "locked", SIGN, ""),
        ("Pynt juletreet", "GROQ", 15, "locked", TREE, "En julekule"),
    ], "bonus": ("Typer fra schema", "TypeGen", 30, "locked", RANGER, "Ny figur: jeger")},
]

def kule(size, faded=False):
    """A small Christmas bauble, drawn inline so it needs no uploaded image."""
    o = 0.45 if faded else 1
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 8 9" aria-hidden="true" style="flex: none; opacity: {o}; shape-rendering: crispEdges">'
            '<rect x="3" y="0" width="2" height="1" fill="#c0cbdc"/><circle cx="4" cy="5" r="3.6" fill="#e43b44"/>'
            '<rect x="1" y="4" width="6" height="1" fill="#feae34"/><rect x="2" y="3" width="1" height="1" fill="#ffffff" opacity="0.6"/></svg>')


MARK = {"done": ("✓", "#6fd1a8"), "active": ("▸", "#fdbe53"), "todo": ("○", "#8b9bb4"), "locked": ("·", "#5a6488")}


def page(title, w, h, body, extra_css=""):
    return f'''<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jersey+10&amp;family=Pixelify+Sans:wght@400;600&amp;family=JetBrains+Mono:wght@400&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#8fd3ff}}a:hover{{color:#e3ebf5}}{extra_css}
</style>
</helmet>
<div style="position: relative; width: {w}px; height: {h}px; overflow: hidden; background: #1b1f33; font-family: 'Pixelify Sans', system-ui, sans-serif; color: #e3ebf5">
  <img src="{VILLAGE}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.3; image-rendering: pixelated">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''


def term(t, size=12):
    return f'<span style="{MONO}; font-size: {size}px; color: #8fd3ff">{t}</span>'


def header(right_extra=""):
    return f'''    <div style="display: flex; align-items: center; gap: 22px; padding: 14px 22px; border-bottom: 2px solid #1b1f33">
      <span style="{JERSEY}; font-size: 36px; line-height: 1">Julekalenderen</span>
{right_extra}
      <span style="flex: 1"></span>
      <span style="font-size: 14px; color: #fdbe53">5 av 12 oppgaver</span>
      <button type="button" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: transparent; border: 2px solid #8b9bb4; color: #e3ebf5; font: inherit; font-size: 13px">Lukk <span style="padding: 0 4px; background: #3a4263; font-size: 11px">Esc</span></button>
    </div>'''


def panel(inner, inset="32px 48px"):
    return f'''  <div style="position: absolute; inset: {inset}; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column">
{inner}
  </div>'''


def detail():
    t = WEEKS[1]["tasks"][1]
    return f'''      <div style="padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; min-width: 0">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <span style="font-size: 13px; color: #fdbe53">Uke 2 · oppgave 2 · pågår</span>
          <span style="font-size: 22px; line-height: 1.25">{t[0]}</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px">
          <span style="padding: 2px 10px; background: #1b1f33; color: #8fd3ff">{t[1]}</span>
          <span style="padding: 2px 10px; background: #1b1f33; color: #c0cbdc">ca. {t[2]} min</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #1b1f33">
          {kule(36)}
          <div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: #8b9bb4">Gir</span><span style="font-size: 15px">En julekule du tegner selv</span></div>
        </div>
        <p style="margin: 0; font-size: 15px; line-height: 1.5">Koble hvert monster til gjenstandene det slipper. Bruk en {term("reference", 13)} til {term("item", 13)}.</p>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px">
          <div style="display: flex; gap: 10px"><span style="width: 96px; flex: none; color: #8b9bb4">Fil</span><span><span style="{MONO}; font-size: 12px; color: #fdbe53">monster.ts</span> · <a href="#editor">Åpne i editoren</a></span></div>
          <div style="display: flex; gap: 10px"><span style="width: 96px; flex: none; color: #8b9bb4">Sjekkes</span><span>Av seg selv når du publiserer et monster med bytte</span></div>
        </div>
        <span style="flex: 1"></span>
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <button type="button" style="padding: 8px 14px; {BTN_MAIN}; font-size: 14px">Åpne Sanity Studio</button>
          <button type="button" style="padding: 8px 14px; {BTN}; font-size: 14px">Vis et hint</button>
        </div>
      </div>'''


def row(task, selected=False, bonus=False):
    title, t, mins, st, icon, gives = task
    mark, color = MARK[st]
    if bonus:
        mark = "★" if st == "done" else "☆"
        color = "#fdbe53" if st != "locked" else "#5a6488"
    bg = "background: #3a4263; box-shadow: inset 3px 0 0 #fdbe53;" if selected else ""
    dim = "color: #6f7aa0;" if st == "locked" else ""
    status = {"done": '<span style="color: #6fd1a8">Ferdig</span>', "active": '<span style="color: #fdbe53">Pågår</span>'}.get(st, "")
    return f'''          <div style="display: grid; grid-template-columns: 22px minmax(0, 1fr) 56px 30px 54px; gap: 10px; align-items: center; padding: 8px 10px; font-size: 15px; {bg}{dim}">
            <span style="color: {color}">{mark}</span>
            <span>{title} {term(t)}</span>
            <span style="font-size: 12px; color: #8b9bb4">{mins} min</span>
            <span title="Gir: {gives}">{kule(22, st != 'done')}</span>
            <span style="font-size: 12px; text-align: right">{status}</span>
          </div>'''


def section(label):
    return f'          <span style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b9bb4; padding: 0 10px">{label}</span>'


# ---------- Alt 1: liste per uke ----------
def alt_liste():
    tabs = '''      <div role="tablist" style="display: flex; gap: 4px">
        <button type="button" role="tab" aria-selected="false" style="padding: 6px 12px; background: transparent; border: 0; color: #c0cbdc; font: inherit; font-size: 14px"><span style="color: #6fd1a8">✓</span> Uke 1</button>
        <button type="button" role="tab" aria-selected="true" style="padding: 6px 12px; background: #3a4263; border: 0; box-shadow: inset 0 -3px 0 #fdbe53; color: #e3ebf5; font: inherit; font-size: 14px">Uke 2</button>
        <button type="button" role="tab" aria-selected="false" style="padding: 6px 12px; background: transparent; border: 0; color: #5a6488; font: inherit; font-size: 14px">Uke 3 · 14. des</button>
      </div>'''
    w = WEEKS[1]
    rows = "\n".join(row(t, selected=(i == 1)) for i, t in enumerate(w["tasks"]))
    left = f'''      <div style="padding: 18px 12px; display: flex; flex-direction: column; gap: 10px; border-right: 2px solid #1b1f33; min-width: 0">
        <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 0 10px">
          <span style="font-size: 20px">Uke 2: {w["theme"]}</span>
          <span style="font-size: 13px; color: #8b9bb4">{w["dates"]}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px">
{section("Oppgaver · 1 av 4 ferdig")}
{rows}
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px">
{section("Bonus · valgfri")}
{row(w["bonus"], bonus=True)}
        </div>
        <span style="flex: 1"></span>
        <div style="display: flex; align-items: center; gap: 10px; margin: 0 10px; padding: 10px 12px; background: #1b1f33; font-size: 14px">
          <span style="color: #fdbe53">Fredag 11. des</span><span style="color: #c0cbdc">Løsningene kommer. Gjør oppgavene i den rekkefølgen du vil.</span>
        </div>
      </div>'''
    inner = header(tabs) + f'''
    <div style="flex: 1; display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); min-height: 0">
{left}
{detail()}
    </div>'''
    return page("Alternativ 1: liste per uke", 1280, 800, panel(inner))


# ---------- Alt 2: tre store luker ----------
def big_door_open(w, current):
    ring = "#fdbe53" if current else "#3f7a66"
    rows = []
    for i, t in enumerate(w["tasks"]):
        mark, color = MARK[t[3]]
        sel = "background: #3a4263;" if (current and i == 1) else ""
        rows.append(f'''          <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; font-size: 14px; {sel}"><span style="width: 14px; color: {color}">{mark}</span><span style="flex: 1; min-width: 0">{t[0]}</span><img src="{t[4]}" alt="" style="width: 20px; height: 20px; image-rendering: pixelated; opacity: {1 if t[3] == 'done' else 0.45}"></div>''')
    b = w["bonus"]
    rows.append(f'''          <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; font-size: 14px; color: #c0cbdc; border-top: 1px dashed #3a4263"><span style="width: 14px; color: #fdbe53">{"★" if b[3] == "done" else "☆"}</span><span style="flex: 1">Bonus: {b[0]}</span><img src="{b[4]}" alt="" style="width: 20px; height: 20px; image-rendering: pixelated; opacity: {1 if b[3] == 'done' else 0.45}"></div>''')
    done = sum(1 for t in w["tasks"] if t[3] == "done")
    foot = "Frist fredag 11. des" if current else "Ferdig ✓"
    return f'''      <div style="position: relative; display: flex; flex-direction: column; min-width: 0; background: #1b1f33; box-shadow: inset 0 0 0 3px {ring}{', 0 0 0 3px #1b1f33, 0 0 0 6px #fdbe53' if current else ''}">
        <div style="position: absolute; top: 0; bottom: 0; left: -22px; width: 22px; background: #8a4b2a; box-shadow: inset 0 0 0 2px #5a2a1a, inset -4px 0 0 #b46a3a; transform: skewY(-8deg); transform-origin: right"></div>
        <div style="display: flex; align-items: baseline; gap: 10px; padding: 14px 16px 8px">
          <span style="{JERSEY}; font-size: 56px; line-height: 0.8; color: {ring}">{w["n"]}</span>
          <div style="display: flex; flex-direction: column"><span style="font-size: 17px">{w["theme"]}</span><span style="font-size: 12px; color: #8b9bb4">{w["dates"]}</span></div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px; padding: 4px 8px">
{chr(10).join(rows)}
        </div>
        <span style="flex: 1"></span>
        <div style="display: flex; justify-content: space-between; padding: 10px 16px; border-top: 2px solid #262b44; font-size: 13px"><span style="color: {ring}">{foot}</span><span style="color: #c0cbdc">{done} av 4</span></div>
      </div>'''


def big_door_closed(w):
    return f'''      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-width: 0; background: #8a4b2a; box-shadow: inset 0 0 0 3px #5a2a1a, inset 0 0 0 9px #b46a3a, inset 0 0 0 12px #5a2a1a">
        <div style="position: absolute; left: 0; right: 0; top: 50%; height: 18px; margin-top: -9px; background: #c4242a; box-shadow: inset 0 3px 0 #f03e2f"></div>
        <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 18px; margin-left: -9px; background: #c4242a; box-shadow: inset 3px 0 0 #f03e2f"></div>
        <div style="position: relative; width: 96px; height: 96px; display: grid; place-items: center; background: #fdbe53; box-shadow: inset 0 0 0 4px #e38628, 0 4px 0 #5a2a1a">
          <span style="{JERSEY}; font-size: 80px; line-height: 0.8; color: #5a2a1a">{w["n"]}</span>
        </div>
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 14px; background: #1b1f33">
          <span style="font-size: 16px">{w["theme"]}</span>
          <span style="font-size: 13px; color: #fdbe53">Åpner mandag 14. desember</span>
        </div>
        <div style="position: relative; display: flex; gap: 6px; padding: 6px 10px; background: rgba(27, 31, 51, 0.85); font-size: 12px; color: #c0cbdc"><img src="{TREE}" alt="" style="width: 20px; height: 20px; image-rendering: pixelated"> Siste luke tenner juletreet</div>
      </div>'''


def alt_tre_luker():
    inner = header() + f'''
    <div style="flex: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; padding: 26px 30px 22px 52px; min-height: 0">
{big_door_open(WEEKS[0], False)}
{big_door_open(WEEKS[1], True)}
{big_door_closed(WEEKS[2])}
    </div>
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 22px; border-top: 2px solid #1b1f33; font-size: 13px; color: #c0cbdc">
      <span>Én stor luke per uke. Klikk en oppgave for å se den.</span>
      <span style="flex: 1"></span>
      <span>Løsningene kommer fredag.</span>
    </div>'''
    return page("Alternativ 2: tre store luker", 1280, 800, panel(inner))


# ---------- Alt 3: kalender med ukerader ----------
def small_door(n, task, bonus=False, sel=False):
    title, t, mins, st, icon, gives = task
    looks = {
        "done": ("#2c5a4b", "inset 0 0 0 2px #3f7a66", "#e3ebf5"),
        "active": ("#e38628", "inset 0 0 0 2px #fdbe53, 0 0 0 3px #1b1f33, 0 0 0 5px #fdbe53", "#2a140e"),
        "todo": ("#3a4263", "inset 0 0 0 2px #fdbe53", "#e3ebf5"),
        "locked": ("#20253a", "inset 0 0 0 2px #2b3150", "#5a6488"),
    }
    bg, ring, fg = looks[st]
    if bonus and st != "done":
        ring = ring.replace("#fdbe53", "#8fd3ff").replace("#2b3150", "#2b3150")
    label = ("Bonus" if bonus else t)
    num = "★" if bonus else str(n)
    return f'''          <div title="{title}" style="display: flex; flex-direction: column; justify-content: space-between; padding: 8px 10px; min-height: 0; background: {bg}; box-shadow: {ring}; {'border: 2px dashed #8fd3ff;' if bonus and st == 'locked' else ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start">
              <span style="{JERSEY}; font-size: 30px; line-height: 0.85; color: {fg}">{num}</span>
              <img src="{icon}" alt="" style="width: 26px; height: 26px; image-rendering: pixelated; opacity: {1 if st == 'done' else (0.3 if st == 'locked' else 0.6)}">
            </div>
            <span style="font-size: 11px; line-height: 1.2; color: {fg}">{label}</span>
          </div>'''


def alt_ukerader():
    rows = []
    n = 1
    for w in WEEKS:
        cells = []
        for t in w["tasks"]:
            cells.append(small_door(n, t))
            n += 1
        cells.append(small_door(0, w["bonus"], bonus=True))
        lab_color = {"done": "#6fd1a8", "now": "#fdbe53", "locked": "#6f7aa0"}[w["state"]]
        sub = {"done": "ferdig ✓", "now": "denne uka", "locked": "åpner 14. des"}[w["state"]]
        rows.append(f'''        <div style="display: flex; flex-direction: column; justify-content: center; gap: 2px; padding-right: 6px">
          <span style="font-size: 17px; color: {lab_color}">Uke {w["n"]}</span>
          <span style="font-size: 12px; color: #c0cbdc">{w["theme"]}</span>
          <span style="font-size: 12px; color: {lab_color}">{sub}</span>
        </div>
''' + "\n".join(cells))
    grid = "\n".join(rows)
    left = f'''      <div style="padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; border-right: 2px solid #1b1f33; min-height: 0">
        <div style="flex: 1; display: grid; grid-template-columns: 116px repeat(5, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 10px; min-height: 0">
{grid}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #c0cbdc">
          <span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 12px; height: 12px; background: #2c5a4b; box-shadow: inset 0 0 0 2px #3f7a66"></span>Ferdig</span>
          <span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 12px; height: 12px; background: #e38628"></span>Pågår</span>
          <span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 12px; height: 12px; background: #3a4263; box-shadow: inset 0 0 0 2px #fdbe53"></span>Åpen</span>
          <span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 12px; height: 12px; background: #20253a; box-shadow: inset 0 0 0 2px #2b3150"></span>Kommer</span>
          <span style="display: inline-flex; align-items: center; gap: 6px"><span style="color: #fdbe53">★</span>Bonus, valgfri</span>
        </div>
      </div>'''
    inner = header() + f'''
    <div style="flex: 1; display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); min-height: 0">
{left}
{detail()}
    </div>'''
    return page("Alternativ 3: kalender med ukerader", 1280, 800, panel(inner))


# ---------- Alt 4: liste med adventslys ----------
def candle(w, lit, part):
    flame = f'''<div style="width: 14px; height: 22px; margin: 0 auto -2px; background: #fdbe53; box-shadow: inset 0 -8px 0 #e38628, 0 0 18px 6px rgba(253, 190, 83, 0.35)"></div>''' if lit else '<div style="width: 2px; height: 10px; margin: 12px auto -2px; background: #1b1f33"></div>'
    body_c = "#f3e9d2" if w["state"] != "locked" else "#5a6488"
    fill = f'<div style="position: absolute; left: 0; right: 0; bottom: 0; height: {part}%; background: rgba(253, 190, 83, 0.35)"></div>' if (not lit and part) else ""
    lab_color = {"done": "#6fd1a8", "now": "#fdbe53", "locked": "#6f7aa0"}[w["state"]]
    sub = {"done": "4 av 4 ✓", "now": "1 av 4", "locked": "14. des"}[w["state"]]
    return f'''        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 120px">
          <div>
            {flame}
            <div style="position: relative; width: 36px; height: 84px; background: {body_c}; box-shadow: inset -6px 0 0 rgba(0, 0, 0, 0.12)">{fill}</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px"><span style="font-size: 16px; color: {lab_color}">Uke {w["n"]}</span><span style="font-size: 12px; color: #c0cbdc">{sub}</span></div>
        </div>'''


def alt_lys():
    w = WEEKS[1]
    tasks = []
    for i, t in enumerate(w["tasks"]):
        tasks.append(row(t, selected=(i == 1)))
        if i == 1:
            tasks.append(f'''          <div style="display: flex; flex-direction: column; gap: 10px; margin: 0 0 6px 32px; padding: 12px 14px; background: #1b1f33; font-size: 14px; line-height: 1.5">
            <span>Koble hvert monster til gjenstandene det slipper. Bruk en {term("reference", 13)} til {term("item", 13)}.</span>
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13px">
              <span style="{MONO}; font-size: 12px; color: #fdbe53">monster.ts</span><a href="#editor">Åpne i editoren</a>
              <span style="color: #8b9bb4">Sjekkes av seg selv når du publiserer</span>
              <span style="flex: 1"></span>
              <button type="button" style="padding: 6px 12px; {BTN}; font-size: 13px">Vis et hint</button>
              <button type="button" style="padding: 6px 12px; {BTN_MAIN}; font-size: 13px">Åpne Sanity Studio</button>
            </div>
          </div>''')
    inner = header() + f'''
    <div style="display: flex; align-items: flex-end; justify-content: center; gap: 30px; padding: 20px 22px 14px; border-bottom: 2px solid #1b1f33; background: linear-gradient(#262b44, #20253a)">
{candle(WEEKS[0], True, 0)}
{candle(WEEKS[1], False, 25)}
{candle(WEEKS[2], False, 0)}
      <div style="align-self: center; max-width: 300px; margin-left: 20px; font-size: 14px; line-height: 1.45; color: #c0cbdc">Ett lys per uke. Det tennes når ukas fire oppgaver er ferdige. Det siste lyset tenner juletreet i bygda.</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 16px 22px; min-height: 0; max-width: 820px; width: 100%; box-sizing: border-box; align-self: center">
      <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 0 10px">
        <span style="font-size: 20px">Uke 2: {w["theme"]}</span>
        <span style="font-size: 13px; color: #8b9bb4">{w["dates"]} · løsninger fredag</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px">
{chr(10).join(tasks)}
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px">
{section("Bonus · valgfri")}
{row(w["bonus"], bonus=True)}
      </div>
    </div>'''
    return page("Alternativ 4: liste med adventslys", 1280, 800, panel(inner))


# ---------- Hjørnekortet, ukeversjon ----------
def corner(left, label, ring, title, steps, footer, dots):
    dot_html = "".join(f'<span style="width: 14px; height: 14px; background: {c}; box-shadow: inset 0 0 0 2px {b}"></span>' for c, b in dots)
    step_html = "\n".join(f'        <div style="display: flex; gap: 8px; {"color: #8b9bb4" if not ok else ""}"><span style="{"color: #6fd1a8" if ok else ""}">{"✓" if ok else "·"}</span><span>{s}</span></div>' for ok, s in steps)
    return f'''  <div style="position: absolute; top: 40px; left: {left}px; width: 340px; padding: 12px 14px; box-sizing: border-box; background: rgba(38, 43, 68, 0.95); border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column; gap: 10px">
    <div style="display: flex; align-items: center; gap: 10px">
      <span style="{JERSEY}; font-size: 24px; line-height: 1">Uke 2</span>
      <div style="display: flex; gap: 4px">{dot_html}</div>
      <span style="flex: 1"></span>
      <span style="font-size: 12px; color: #c0cbdc">frist fredag</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; background: #1b1f33; box-shadow: inset 0 0 0 2px {ring}">
      <span style="font-size: 12px; color: {ring}">{label}</span>
      <span style="font-size: 16px; line-height: 1.25">{title}</span>
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px">
{step_html}
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px">
      {footer}
      <span style="flex: 1"></span>
      <button type="button" style="display: inline-flex; align-items: center; gap: 6px; min-height: 28px; padding: 0 8px; {BTN}; font-size: 12px">Alle oppgaver <span style="padding: 0 4px; background: #1b1f33; font-size: 10px">J</span></button>
    </div>
  </div>'''


def corner_board():
    G = ("#2c5a4b", "#3f7a66"); A = ("#e38628", "#fdbe53"); O = ("#3a4263", "#fdbe53")
    a = corner(40, "Oppgave 2 av 4 · pågår", "#fdbe53", "Bytte fra monstre",
               [(True, "Feltet <span style=\"font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fdbe53\">drops</span> finnes"), (False, "Publiser et monster med bytte")],
               f'<span style="{MONO}; color: #fdbe53">monster.ts</span><a href="#editor">Åpne i editoren</a>', [G, A, O, O])
    b = corner(470, "Oppgave 2 · ferdig ✓", "#6fd1a8", "Bytte fra monstre",
               [(True, "En julekule")],
               '<span style="color: #fdbe53">Neste: Finn de sterkeste monstrene</span>', [G, G, O, O])
    c = corner(900, "Uke 2 · ferdig ✓", "#6fd1a8", "Alle fire oppgavene er gjort",
               [(True, "4 kuler på treet"), (False, "Bonus: Flere GROQ-oppgaver")],
               '<span style="color: #8b9bb4">Uke 3 åpner mandag</span>', [G, G, G, G])
    labels = '''  <div style="position: absolute; left: 40px; right: 40px; bottom: 28px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 90px; font-size: 14px; color: #c0cbdc">
    <span>Mens du jobber: én prikk per oppgave, og den du holder på med.</span>
    <span>Når en oppgave er ferdig: kortet blir grønt og viser neste.</span>
    <span>Når uka er ferdig: bonusen står igjen som valgfri.</span>
  </div>'''
    return page("Hjørnekortet med uker", 1280, 400, a + "\n" + b + "\n" + c + "\n" + labels)


if __name__ == "__main__":
  for name, html in {
      "Uke-liste.dc.html": alt_liste(),
      "Uke-hjorne.dc.html": corner_board(),
  }.items():
    (OUT / name).write_text(html)
  print("ok")
