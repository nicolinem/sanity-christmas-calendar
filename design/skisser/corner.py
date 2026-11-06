import pathlib, re

def card(left, top, width, counter, door_label, door_ring, body, footer_left):
    return f'''  <div style="position: absolute; top: {top}px; left: {left}px; width: {width}px; padding: 12px 14px; box-sizing: border-box; background: rgba(38, 43, 68, 0.95); border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column; gap: 10px">
    <div style="display: flex; align-items: baseline; gap: 10px">
      <span style="font-family: 'Jersey 10', 'Pixelify Sans', sans-serif; font-size: 24px; line-height: 1">Julekalenderen</span>
      <span style="flex: 1"></span>
      <span style="font-size: 12px; color: #c0cbdc">{counter}</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; background: #1b1f33; box-shadow: inset 0 0 0 2px {door_ring}">
      <span style="font-size: 12px; color: {door_ring}">{door_label}</span>
{body}
    </div>
    <div style="display: flex; align-items: center; gap: 8px; font-size: 12px">
      {footer_left}
      <span style="flex: 1"></span>
      <button type="button" style="display: inline-flex; align-items: center; gap: 6px; min-height: 28px; padding: 0 8px; background: #3a4263; border: 0; box-shadow: inset 0 2px 0 #4d5781; color: #e3ebf5; font: inherit; font-size: 12px">Alle luker <span style="padding: 0 4px; background: #1b1f33; font-size: 10px">J</span></button>
    </div>
  </div>
'''

TOPRIGHT = '''  <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 6px">
    <button type="button" aria-label="Lyd av" title="Lyd av" style="display: grid; place-items: center; width: 32px; height: 32px; padding: 0; background: #3a4263; border: 0; box-shadow: inset 0 2px 0 #4d5781; color: #c0cbdc">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M2 6 H5 L9 3 V13 L5 10 H2 Z"/><path d="M11.5 6 L14.5 10 M14.5 6 L11.5 10"/></svg>
    </button>
    <button type="button" style="display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 10px; background: #3a4263; border: 0; box-shadow: inset 0 2px 0 #4d5781; color: #e3ebf5; font: inherit; font-size: 13px"><span style="color: #f03e2f">■</span> Sanity Studio</button>
  </div>
'''

FILE_LINK = '<span style="font-family: \'JetBrains Mono\', monospace; color: #fdbe53">{f}</span><a href="#editor">Åpne i editoren</a>'
MONO_FONT = "&amp;family=JetBrains+Mono:wght@400"

def strip_doors_js(s):
    a = s.index("<script type=\"text/x-dc\" data-dc-script")
    b = s.index("</script>", a) + len("</script>")
    head = s[a:s.index(">", a)+1]
    return s[:a] + head + "\nclass Component extends DCLogic {\nrenderVals() {\nreturn {};\n}\n}\n</script>" + s[b:]

def ensure_mono(s):
    if "JetBrains+Mono" not in s:
        s = s.replace("family=Pixelify+Sans:wght@400;600", "family=Pixelify+Sans:wght@400;600" + MONO_FONT, 1)
    return s

def cut(s, start_marker, end_marker):
    a = s.index(start_marker); b = s.index(end_marker, a)
    return s[:a], s[b:]

# --- V2-vanlig ---
p = pathlib.Path("V2-vanlig.dc.html"); s = p.read_text()
pre, post = cut(s, '  <div style="position: absolute; top: 0; left: 0; right: 0; height: 44px;', '  <div style="position: absolute; left: 664px; top: 62px;')
body = '''      <span style="font-size: 16px; line-height: 1.25">Lag en document type for monstre</span>
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px">
        <div style="display: flex; gap: 8px"><span style="color: #6fd1a8">✓</span><span>Typen <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fdbe53">monster</span> finnes</span></div>
        <div style="display: flex; gap: 8px; color: #8b9bb4"><span>·</span><span>Publiser et monster</span></div>
      </div>'''
s = pre + card(16, 16, 340, "6 av 24 luker", "Luke 8 · i dag", "#fdbe53", body, FILE_LINK.format(f="monster.ts")) + "\n" + TOPRIGHT + "\n" + post
s = strip_doors_js(ensure_mono(s)); p.write_text(s)

# --- Ui-vanlig ---
p = pathlib.Path("Ui-vanlig.dc.html"); s = p.read_text()
pre, post = cut(s, '  <div style="position: absolute; top: 0; left: 0; right: 0; height: 44px;', '  <div style="position: absolute; top: 54px; right: 16px;')
body = '''      <span style="font-size: 16px; line-height: 1.25">Lag en egen document type for monstre</span>
      <span style="font-size: 13px; color: #c0cbdc">Ny luke. Snakk med Brann ved smia for å få den.</span>'''
s = pre + card(16, 16, 340, "6 av 24 luker", "Luke 8 · i dag · ca. 20 min", "#fdbe53", body, '<span style="color: #8b9bb4">Gå til smia og trykk E</span>') + "\n" + TOPRIGHT + "\n" + post
s = s.replace('<div style="position: absolute; top: 54px; right: 16px; display: inline-flex;', '<div style="position: absolute; top: 60px; right: 16px; display: inline-flex;')
s = strip_doors_js(ensure_mono(s)); p.write_text(s)

# --- V2-ferdig ---
p = pathlib.Path("V2-ferdig.dc.html"); s = p.read_text()
pre, post = cut(s, '  <div style="position: absolute; top: 0; left: 0; right: 0; height: 44px;', '  <div style="position: absolute; left: 50%; top: 84px;')
body = '''      <span style="font-size: 16px; line-height: 1.25">Validation: regler for våpen</span>
      <span style="font-size: 13px; color: #fdbe53">Luke 4 er åpen. Snakk med Brann.</span>'''
s = pre + card(16, 16, 340, "3 av 24 luker", "Luke 3 · ferdig ✓", "#6fd1a8", body, '<span style="color: #8b9bb4">Løsningen kommer fredag</span>') + "\n" + post
s = s.replace('left: 50%; top: 84px; transform: translateX(-50%); width: 540px;', 'left: 50%; top: 64px; transform: translateX(-30%); width: 540px;')
s = strip_doors_js(s); p.write_text(s)

# --- Ui-studio ---
p = pathlib.Path("Ui-studio.dc.html"); s = p.read_text()
pre, post = cut(s, '    <div style="position: absolute; top: 0; left: 0; right: 0; padding: 10px 24px 12px;', '    <div style="position: absolute; top: 112px; right: 24px;')
body = '''      <span style="font-size: 16px; line-height: 1.25">Validation: regler for våpen</span>
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px">
        <div style="display: flex; gap: 8px"><span style="color: #6fd1a8">✓</span><span>Våpen uten sprite blir nektet</span></div>
        <div style="display: flex; gap: 8px; color: #8b9bb4"><span>·</span><span>Navn som er tatt, blir nektet</span></div>
      </div>'''
c = card(16, 16, 320, "2 av 24 luker", "Luke 3 · i dag", "#fdbe53", body, FILE_LINK.format(f="item.tsx"))
c = "\n".join(("  " + line) if line else line for line in c.split("\n"))
s = pre + c + "\n" + post
s = s.replace('<div style="position: absolute; top: 112px; right: 24px; width: 230px;', '<div style="position: absolute; top: 16px; right: 16px; width: 230px;')
s = strip_doors_js(s); p.write_text(s)
print("ok")
