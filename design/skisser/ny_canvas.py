"""Build the trimmed canvas: only the ideas we kept (2026-11-03).

Writes ny-canvas/project/*.dc.html and canvas.json. Images that were never
uploaded before are referenced as /_blob/@<file>; remap.py swaps them for
real ids after upload.
"""
import json
from weeks import OUT, page, JERSEY, alt_liste, corner_board
import rhythm
import progress
import baubles


def figur_board():
    layers = [
        ("Hud", "4 farger"),
        ("Hår", "kort, langt, bolle, fletter, skjegg · 6 farger"),
        ("Overdel", "genser, nissedrakt, frakk, kjole · 6 farger"),
        ("Lue", "ingen, nisselue, topplue, øreklokker, krone"),
        ("Ekstra", "skjerf, votter, lykt"),
    ]
    rows = "\n".join(
        f'      <div style="display: flex; gap: 12px; font-size: 15px"><span style="width: 90px; flex: none; color: #8b9bb4">{a}</span><span>{b}</span></div>'
        for a, b in layers)
    body = f'''  <div style="position: absolute; inset: 0; background: rgba(27, 31, 51, 0.85)"></div>
  <div style="position: absolute; inset: 40px 48px; display: flex; flex-direction: column; gap: 22px">
    <div style="display: flex; flex-direction: column; gap: 6px">
      <span style="{JERSEY}; font-size: 44px; line-height: 1">Egne figurer i lag</span>
      <span style="font-size: 15px; color: #c0cbdc">Prototype tegnet i Tiny Dungeon-stil. Øverst: våre figurer. Nederst: Tiny Dungeon til sammenligning.</span>
    </div>
    <img src="/_blob/@figur-preview.png" alt="Figurer satt sammen av lag" style="width: 960px; height: 360px; image-rendering: pixelated; align-self: flex-start">
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 40px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 8px">
{rows}
        <span style="margin-top: 8px; font-size: 14px; line-height: 1.5; color: #c0cbdc">Hvert lag er et kart over roller (hud, hår, klær). Fargene velges av deltakeren, og den mørke kanten legges på til slutt. Samme kode kan tegne figuren i spillet og i figurskaperen i Studio. Bare forfra foreløpig.</span>
      </div>
      <img src="/_blob/@figur-idle.gif" alt="Figurene puster" style="width: 300px; height: auto; image-rendering: pixelated">
    </div>
  </div>'''
    return page("Egne figurer i lag", 1280, 800, body)


BOARDS = {
    "Uke-liste.dc.html": (0, 300, 1280, 800, "Oversikten: en liste per uke (J)", alt_liste),
    "Uke-hjorne.dc.html": (1360, 300, 1280, 400, "Hjørnekortet", corner_board),
    "Uke-mandag.dc.html": (0, 1220, 1280, 800, "Mandag: en ny uke åpner", rhythm.mandag),
    "Uke-ferdig.dc.html": (1360, 1220, 1280, 800, "En oppgave er ferdig: du får en julekule", rhythm.ferdig),
    "Uke-fredag.dc.html": (0, 2140, 1280, 800, "Fredag: løsningene kommer", rhythm.fredag),
    "Uke-smal.dc.html": (1360, 2140, 1280, 800, "Lista med Studio åpent", rhythm.smal),
    "Fremgang-kuler.dc.html": (0, 3360, 1280, 800, "Tegn din egen julekule", baubles.board),
    "Fremgang-figur.dc.html": (1360, 3360, 1280, 800, "Pynt på figuren din", progress.wardrobe),
    "Figur-lag.dc.html": (0, 4280, 1280, 800, "Egne figurer i lag (prototype)", figur_board),
}

NOTES = {
    "title": {"x": 0, "y": -200, "text": "Sanity-julekalenderen: skisser", "kind": "title1", "maxW": 2640},
    "uka": {"x": 0, "y": 0, "text": "Tre uker med oppgaver, en liste per uke", "kind": "title1", "maxW": 2640},
    "uka-regler": {"x": 2720, "y": 300, "w": 380, "fill": "yellow",
                   "text": "Hver mandag åpner fire oppgaver og én bonus. Man gjør dem i den rekkefølgen man vil i løpet av arbeidsuka. Fredag kommer løsningene. Oppgavene står åpne ut desember. Fire og én er en startverdi."},
    "uka-sporsmal": {"x": 2720, "y": 2140, "w": 380, "fill": "blue",
                     "text": "Åpne spørsmål: Skal løsningen vises i spillet eller bare som lenke til koden? Skal «Sammenlign med din kode» være med?"},
    "fremgang": {"x": 0, "y": 3060, "text": "Fremgang: koselig fra start, og vi ser hverandre", "kind": "title1", "maxW": 2640},
    "fremgang-regler": {"x": 2720, "y": 3360, "w": 380, "fill": "green",
                        "text": "Bygda er pyntet fra start. Fremgang er det du lager i Studio, julekulene du tegner (de henger på samme tre som alle andres), og figuren din. Vi ser hverandre gjennom offentlige datasett og «spøkelser» der de andre var sist, uten egen server."},
    "figur": {"x": 2720, "y": 4280, "w": 380, "fill": "green",
              "text": "Figurskaperen lages av oss før uke 1 og skal være det fineste i Studio. Senere lager deltakerne enklere custom inputs selv: sprite-velgeren i uke 1 og tegnebrettet for kuler i uke 3."},
    "eksempel": {"x": 2720, "y": 4700, "w": 380, "fill": "gray", "text": "Navn, tall og oppgaver i skissene er eksempler."},
}


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    boards = {}
    for name, (x, y, w, h, title, fn) in BOARDS.items():
        (OUT / name).write_text(fn())
        boards[name] = {"x": x, "y": y, "w": w, "h": h, "title": title}
    canvas = {
        "v": 3,
        "createdOnFiles": {"v": 1, "at": "2026-11-03T10:00:00Z"},
        "title": "Sanity-julekalenderen: skisser",
        "launch": {"view": "canvas"},
        "pages": [],
        "boards": boards,
        "order": list(BOARDS),
        "notes": NOTES,
        "designSystems": [],
    }
    (OUT / "canvas.json").write_text(json.dumps(canvas, ensure_ascii=False, indent=2))
    print("ok", len(boards))
