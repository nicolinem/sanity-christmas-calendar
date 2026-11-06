from weeks import *
from progress import cozy_page
from rhythm import big_btn

PAL = {".": None, "r": "#c4242a", "y": "#fdbe53", "b": "#8fd3ff", "g": "#6fd1a8", "w": "#f3e9d2", "k": "#1b1f33", "o": "#e38628"}

ART = {
    "snø": ["....w...", "..w.w.w.", "...www..", "wwwwwww.", "...www..", "..w.w.w.", "....w...", "........"],
    "hjerte": ["........", ".rr.rr..", "rrrrrrr.", "rrrrrrr.", ".rrrrr..", "..rrr...", "...r....", "........"],
    "katt": ["........", ".k...k..", ".kk.kk..", ".kkkkk..", ".kykyk..", ".kkkkk..", "..kkk...", "........"],
    "stjerne": ["...y....", "...y....", "yyyyyyy.", ".yyyyy..", "..yyy...", ".yy.yy..", ".y...y..", "........"],
    "s": ["........", ".rrrrr..", ".r......", ".rrrrr..", ".....r..", ".rrrrr..", "........", "........"],
    "tre": ["...g....", "..ggg...", ".ggggg..", "..ggg...", ".ggggg..", "ggggggg.", "...o....", "........"],
    "smil": ["........", "..yyy...", ".yyyyy..", "yykykyy.", "yyyyyyy.", "ykyyyky.", ".ykkky..", "..yyy..."],
    "striper": ["rrrrrrrr", "wwwwwwww", "gggggggg", "wwwwwwww", "rrrrrrrr", "wwwwwwww", "gggggggg", "wwwwwwww"],
    "sverd": ["......w.", ".....w..", "....w...", "...w....", ".ow.....", "..o.....", ".o.o....", "........"],
}
BASE = {"snø": "#3a6ea5", "hjerte": "#f3e9d2", "katt": "#e38628", "stjerne": "#2c5a4b", "s": "#f3e9d2", "tre": "#c4242a", "smil": "#8fd3ff", "striper": "#f3e9d2", "sverd": "#3a4263"}


def bauble_svg(name, size, uid, ring=None):
    rows = ART[name]
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="1" height="1" fill="{PAL[c]}"/>'
        for y, line in enumerate(rows) for x, c in enumerate(line) if PAL[c])
    extra = f'<circle cx="4" cy="4" r="4.15" fill="none" stroke="{ring}" stroke-width="0.35"/>' if ring else ""
    return f'''<svg width="{size}" height="{size + size // 4}" viewBox="0 -2 8 10" aria-label="Julekule: {name}" style="display: block; overflow: visible; shape-rendering: crispEdges"><defs><clipPath id="c{uid}"><circle cx="4" cy="4" r="4"/></clipPath></defs><rect x="3.2" y="-1.6" width="1.6" height="1.4" fill="#c0cbdc"/><g clip-path="url(#c{uid})"><rect x="0" y="0" width="8" height="8" fill="{BASE[name]}"/>{rects}<rect x="1" y="1" width="1" height="1" fill="#ffffff" opacity="0.5"/></g>{extra}</svg>'''


def tree_with_baubles():
    layers = "\n".join(
        f'    <div style="position: absolute; left: {340 - w // 2}px; top: {t}px; width: {w}px; height: 130px; background: #2c5a4b; clip-path: polygon(50% 0, 100% 100%, 0 100%); box-shadow: inset 0 -10px 0 #3f7a66"></div>'
        for w, t in [(220, 90), (330, 210), (440, 330), (530, 450)])
    spots = [
        ("stjerne", 322, 170, "Siv"), ("hjerte", 280, 270, "Kari"), ("katt", 370, 290, "Ola"),
        ("snø", 230, 380, "Per"), ("s", 330, 360, "Ida"), ("tre", 420, 395, "Jon"),
        ("smil", 190, 500, "Mia"), ("striper", 290, 480, "Ali"), ("sverd", 395, 470, "Du"),
        ("hjerte", 480, 520, "Tor"), ("snø", 150, 545, "Liv"), ("katt", 250, 560, "Eva"),
    ]
    items = []
    for i, (n, x, y, who) in enumerate(spots):
        mine = who == "Du"
        items.append(f'    <div style="position: absolute; left: {x}px; top: {y}px">{bauble_svg(n, 44 if mine else 36, f"t{i}", "#fdbe53" if mine else None)}</div>')
    hover = '''    <div style="position: absolute; left: 228px; top: 222px; padding: 4px 8px; background: #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; font-size: 12px; white-space: nowrap">Kari · uke 2</div>'''
    mine_label = '''    <span style="position: absolute; left: 446px; top: 482px; padding: 2px 8px; background: #1b1f33; font-size: 12px; color: #fdbe53">Din kule</span>'''
    return f'''  <div style="position: absolute; left: 0; top: 0; width: 680px; height: 800px">
    <div style="position: absolute; left: 318px; top: 580px; width: 44px; height: 70px; background: #8a4b2a"></div>
{layers}
    <span style="position: absolute; left: 322px; top: 58px; width: 36px; height: 36px; background: #fdbe53; clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); filter: drop-shadow(0 0 8px #fdbe53)"></span>
{chr(10).join(items)}
{hover}
{mine_label}
  </div>'''


def editor():
    rows = ART["sverd"]
    cell = 22
    cells = []
    for y in range(8):
        for x in range(8):
            c = PAL[rows[y][x]] or BASE["sverd"]
            cells.append(f'<rect x="{x * cell}" y="{y * cell}" width="{cell}" height="{cell}" fill="{c}" stroke="#1b1f33" stroke-width="1"/>')
    grid = f'<svg width="{8 * cell}" height="{8 * cell}" viewBox="0 0 {8 * cell} {8 * cell}" style="display: block; shape-rendering: crispEdges"><defs><clipPath id="ed"><circle cx="{4 * cell}" cy="{4 * cell}" r="{4 * cell}"/></clipPath></defs><g opacity="0.25">{"".join(cells)}</g><g clip-path="url(#ed)">{"".join(cells)}</g><circle cx="{4 * cell}" cy="{4 * cell}" r="{4 * cell}" fill="none" stroke="#fdbe53" stroke-width="2"/></svg>'
    sw = "".join(
        f'<span style="width: 28px; height: 28px; background: {c}; box-shadow: inset 0 0 0 2px #1b1f33{", 0 0 0 2px #fdbe53" if c == "#f3e9d2" else ""}"></span>'
        for c in ["#c4242a", "#fdbe53", "#8fd3ff", "#6fd1a8", "#f3e9d2", "#e38628", "#1b1f33"])
    return f'''  <div style="position: absolute; top: 40px; right: 40px; width: 520px; padding: 20px; box-sizing: border-box; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column; gap: 16px">
    <div style="display: flex; flex-direction: column; gap: 4px">
      <span style="{JERSEY}; font-size: 36px; line-height: 1">Lag julekula di</span>
      <span style="font-size: 14px; color: #c0cbdc">8 × 8 ruter. Du får en ny kule for hver oppgave du gjør.</span>
    </div>
    <div style="display: flex; gap: 20px; align-items: center">
      <div style="padding: 14px; background: #1b1f33">{grid}</div>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div style="display: grid; grid-template-columns: repeat(4, 28px); gap: 6px">{sw}</div>
        <div style="display: flex; gap: 6px">
          <button type="button" style="padding: 5px 10px; {BTN}; font-size: 13px; box-shadow: inset 0 0 0 2px #fdbe53">Tegn</button>
          <button type="button" style="padding: 5px 10px; {BTN}; font-size: 13px">Visk</button>
          <button type="button" style="padding: 5px 10px; {BTN}; font-size: 13px">Fyll</button>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #c0cbdc">Slik blir den: {bauble_svg("sverd", 40, "pv")}</div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: #1b1f33; font-size: 14px; line-height: 1.5">
      <span style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b9bb4">Kan bli en egen oppgave</span>
      <span>Kula lagres som et dokument i ditt Studio. Bonusoppgave: lag tegnebrettet selv som en {term("custom input", 12)}.</span>
    </div>
    <div style="display: flex; gap: 10px">
      {big_btn("Heng opp på treet")}
      {big_btn("Senere", main=False)}
    </div>
  </div>'''


def board():
    return cozy_page("Tegnede julekuler", tree_with_baubles() + "\n" + editor())


if __name__ == "__main__":
    (OUT / "Fremgang-kuler.dc.html").write_text(board())
    print("ok")
