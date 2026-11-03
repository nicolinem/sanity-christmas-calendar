from weeks import *

DARK = "/_blob/c51d8f340f690695a3c45e628cb61484"
SWORD = "/_blob/564c767e26e4d22f71dba28a993ca8e9"
G = ("#2c5a4b", "#3f7a66"); A = ("#e38628", "#fdbe53"); O = ("#3a4263", "#fdbe53")


def corner_at(top, *args):
    return corner(*args).replace("top: 40px", f"top: {top}px", 1)


def bright_page(title, body):
    # Same as page(), but with the village at full strength behind in-game overlays
    return page(title, 1280, 800, body).replace("opacity: 0.3", "opacity: 0.55", 1)


def dots(*cs):
    return "".join(f'<span style="width: 14px; height: 14px; background: {c}; box-shadow: inset 0 0 0 2px {b}"></span>' for c, b in cs)


def big_btn(text, main=True):
    style = "background: #e38628; box-shadow: inset 0 3px 0 #fdbe53, 0 3px 0 #5a2a1a; color: #2a140e; font-weight: 600" if main else "background: #3a4263; box-shadow: inset 0 2px 0 #4d5781; color: #e3ebf5"
    return f'<button type="button" style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 18px; border: 0; font: inherit; font-size: 15px; {style}">{text}</button>'


def key(k):
    return f'<span style="padding: 0 5px; background: rgba(27, 31, 51, 0.6); font-size: 11px; font-weight: 400">{k}</span>'


# ---------- 1: mandag, ny uke ----------
def mandag():
    w = WEEKS[1]
    rows = "\n".join(
        f'''        <div style="display: grid; grid-template-columns: 26px minmax(0, 1fr) 56px; gap: 10px; align-items: center; padding: 7px 10px; font-size: 15px">{kule(20, True)}<span>{t[0]} {term(t[1])}</span><span style="font-size: 12px; color: #8b9bb4; text-align: right">{t[2]} min</span></div>'''
        for t in w["tasks"])
    b = w["bonus"]
    card = f'''  <div style="position: absolute; left: 50%; top: 70px; transform: translateX(-50%); width: 560px; padding: 24px 26px 22px; box-sizing: border-box; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #fdbe53; display: flex; flex-direction: column; gap: 14px">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center">
      <span style="font-size: 13px; color: #fdbe53">Mandag 7. desember</span>
      <span style="{JERSEY}; font-size: 48px; line-height: 0.95">Uke 2 er åpen</span>
      <span style="font-size: 15px; color: #c0cbdc">{w["theme"]}: fire oppgaver, ca. 75 minutter i alt</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 2px; padding: 8px 4px; background: #1b1f33">
{rows}
        <div style="display: grid; grid-template-columns: 26px minmax(0, 1fr) 56px; gap: 10px; align-items: center; padding: 7px 10px; font-size: 15px; color: #c0cbdc; border-top: 1px dashed #3a4263"><span style="color: #fdbe53; text-align: center">☆</span><span>Bonus: {b[0]} {term(b[1])}</span><span style="font-size: 12px; color: #8b9bb4; text-align: right">{b[2]} min</span></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #c0cbdc">
      <span>Gjør dem i den rekkefølgen du vil.</span>
      <span>Løsninger fredag 11. des</span>
    </div>
    <div style="display: flex; justify-content: center; gap: 10px">
      {big_btn("Se oppgavene " + key("J"))}
      {big_btn("Spill videre " + key("Esc"), main=False)}
    </div>
    <span style="text-align: center; font-size: 12px; color: #6fd1a8">Uke 1: 4 av 4 ferdig ✓ · Uke 3 åpner 14. des</span>
  </div>'''
    return bright_page("Mandag: en ny uke åpner", card)


# ---------- 2: oppgave ferdig ----------
def kule_tegnet():
    from baubles import bauble_svg
    return bauble_svg("sverd", 64, "ferdig")


def ferdig():
    c = corner_at(16, 16, "Oppgave 2 · ferdig ✓", "#6fd1a8", "Bytte fra monstre",
                  [(True, "Ny julekule å tegne")],
                  '<span style="color: #8b9bb4">2 av 4 denne uka</span>', [G, G, O, O])
    card = f'''  <div style="position: absolute; left: 50%; top: 64px; transform: translateX(-50%); width: 540px; padding: 24px 28px 22px; box-sizing: border-box; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #fdbe53; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px">
      <span style="{JERSEY}; font-size: 46px; line-height: 0.95">Oppgave ferdig!</span>
      <span style="font-size: 15px; color: #c0cbdc">Bytte fra monstre</span>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #c0cbdc"><span>Uke 2</span><div style="display: flex; gap: 4px">{dots(G, G, O, O)}</div><span>2 av 4</span></div>
    </div>
    <div style="align-self: stretch; display: flex; align-items: center; gap: 16px; padding: 14px 16px; background: #1b1f33; text-align: left">
      {kule_tegnet()}
      <div style="display: flex; flex-direction: column; gap: 4px">
        <span style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #fdbe53">Du fikk en julekule</span>
        <span style="font-size: 15px; line-height: 1.4">Tegn den, så henger den på treet på torget sammen med de andres.</span>
      </div>
    </div>
    <div style="align-self: stretch; display: flex; flex-direction: column; gap: 6px; padding: 12px 16px; background: #1b1f33; text-align: left">
      <span style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b9bb4">Det du lærte</span>
      <span style="font-size: 14px; line-height: 1.5">En {term("reference", 13)} peker på et annet dokument. Med {term("to: [{type: 'item'}]", 12)} kan den bare peke på gjenstander.</span>
    </div>
    <div style="display: flex; gap: 10px">
      {big_btn("Tegn kula")}
      {big_btn("Velg neste oppgave " + key("J"), main=False)}
    </div>
  </div>'''
    return bright_page("Når en oppgave er ferdig", c + "\n" + card)


# ---------- 3: fredag, løsninger ----------
def sol_row(task, state):
    title, t, mins, st, icon, gives = task
    mark, color, right = {
        "done": ("✓", "#6fd1a8", '<a href="#losning">Se løsning</a>'),
        "sel": ("✓", "#6fd1a8", '<span style="color: #fdbe53">Viser løsning</span>'),
        "todo": ("○", "#8b9bb4", '<a href="#losning" style="color: #8b9bb4">Se løsning</a>'),
    }[state]
    bg = "background: #3a4263; box-shadow: inset 3px 0 0 #fdbe53;" if state == "sel" else ""
    return f'''          <div style="display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px 10px; font-size: 15px; {bg}">
            <span style="color: {color}">{mark}</span>
            <span>{title} {term(t)}</span>
            <span style="font-size: 13px">{right}</span>
          </div>'''


def fredag():
    w = WEEKS[1]
    tabs = '''      <div role="tablist" style="display: flex; gap: 4px">
        <button type="button" role="tab" aria-selected="false" style="padding: 6px 12px; background: transparent; border: 0; color: #c0cbdc; font: inherit; font-size: 14px"><span style="color: #6fd1a8">✓</span> Uke 1</button>
        <button type="button" role="tab" aria-selected="true" style="padding: 6px 12px; background: #3a4263; border: 0; box-shadow: inset 0 -3px 0 #fdbe53; color: #e3ebf5; font: inherit; font-size: 14px">Uke 2</button>
        <button type="button" role="tab" aria-selected="false" style="padding: 6px 12px; background: transparent; border: 0; color: #5a6488; font: inherit; font-size: 14px">Uke 3 · 14. des</button>
      </div>'''
    states = ["done", "sel", "todo", "todo"]
    rows = "\n".join(sol_row(t, s) for t, s in zip(w["tasks"], states))
    left = f'''      <div style="padding: 18px 12px; display: flex; flex-direction: column; gap: 12px; border-right: 2px solid #1b1f33; min-width: 0">
        <div style="display: flex; align-items: center; gap: 10px; margin: 0 10px; padding: 10px 12px; background: #1b1f33; box-shadow: inset 0 0 0 2px #8fd3ff; font-size: 14px">
          <span style="color: #8fd3ff">Fredag 11. des</span><span>Løsningene for uke 2 er klare.</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 0 10px">
          <span style="font-size: 20px">Uke 2: {w["theme"]}</span>
          <span style="font-size: 13px; color: #8b9bb4">2 av 4 ferdig</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px">
{rows}
        </div>
        <span style="flex: 1"></span>
        <span style="padding: 0 10px; font-size: 13px; line-height: 1.5; color: #c0cbdc">Oppgavene du ikke har gjort, står åpne. Du kan se løsningen og likevel gjøre dem selv. Pynten i bygda kommer når sjekken går gjennom.</span>
      </div>'''
    code = '''<span style="color: #8b9bb4">// monster.ts</span>
defineField({
  name: <span style="color: #6fd1a8">'drops'</span>,
  type: <span style="color: #6fd1a8">'array'</span>,
  of: [{
    type: <span style="color: #6fd1a8">'reference'</span>,
    to: [{type: <span style="color: #6fd1a8">'item'</span>}],
  }],
}),'''
    right = f'''      <div style="padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; min-width: 0">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <span style="font-size: 13px; color: #8fd3ff">Løsning · oppgave 2</span>
          <span style="font-size: 22px; line-height: 1.25">Bytte fra monstre</span>
        </div>
        <pre style="margin: 0; padding: 14px 16px; background: #1b1f33; {MONO}; font-size: 13px; line-height: 1.55; color: #e3ebf5; white-space: pre-wrap">{code}</pre>
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: #1b1f33; font-size: 14px; line-height: 1.5">
          <span style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b9bb4">Hvorfor</span>
          <span>{term("array", 12)} gir flere bytter per monster. {term("to", 12)} gjør at Studio bare lar deg velge gjenstander.</span>
        </div>
        <span style="flex: 1"></span>
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <button type="button" style="padding: 8px 14px; {BTN}; font-size: 14px">Sammenlign med din kode</button>
          <a href="#docs" style="align-self: center; font-size: 14px">Reference type i dokumentasjonen</a>
        </div>
      </div>'''
    inner = header(tabs).replace("5 av 12 oppgaver", "6 av 12 oppgaver") + f'''
    <div style="flex: 1; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); min-height: 0">
{left}
{right}
    </div>'''
    return page("Fredag: løsningene kommer", 1280, 800, panel(inner))


# ---------- 4: lista med Studio åpent ----------
def smal():
    w = WEEKS[1]
    rows = []
    for i, t in enumerate(w["tasks"]):
        rows.append(row(t, selected=(i == 1)).replace("grid-template-columns: 22px minmax(0, 1fr) 56px 30px 54px", "grid-template-columns: 22px minmax(0, 1fr) 30px 54px").replace(f'<span style="font-size: 12px; color: #8b9bb4">{t[2]} min</span>\n', ""))
        if i == 1:
            rows.append(f'''          <div style="display: flex; flex-direction: column; gap: 8px; margin: 0 0 6px 32px; padding: 10px 12px; background: #1b1f33; font-size: 14px; line-height: 1.45">
            <span>Koble hvert monster til gjenstandene det slipper. Bruk en {term("reference", 13)} til {term("item", 13)}.</span>
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13px">
              <span style="{MONO}; font-size: 12px; color: #fdbe53">monster.ts</span><a href="#editor">Åpne i editoren</a>
              <span style="flex: 1"></span>
              <button type="button" style="padding: 5px 10px; {BTN}; font-size: 13px">Vis et hint</button>
            </div>
          </div>''')
    lst = f'''  <div style="position: absolute; left: 24px; top: 24px; bottom: 24px; width: 712px; background: #262b44; border: 2px solid #1b1f33; box-shadow: inset 0 0 0 2px #3a4263; display: flex; flex-direction: column">
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 2px solid #1b1f33">
      <span style="{JERSEY}; font-size: 28px; line-height: 1">Oppgaver</span>
      <div style="display: flex; gap: 4px; font-size: 13px">
        <span style="padding: 4px 8px; color: #c0cbdc"><span style="color: #6fd1a8">✓</span> 1</span>
        <span style="padding: 4px 8px; background: #3a4263; box-shadow: inset 0 -3px 0 #fdbe53">Uke 2</span>
        <span style="padding: 4px 8px; color: #5a6488">3</span>
      </div>
      <span style="flex: 1"></span>
      <button type="button" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: transparent; border: 2px solid #8b9bb4; color: #e3ebf5; font: inherit; font-size: 12px">Lukk <span style="padding: 0 4px; background: #3a4263; font-size: 10px">Esc</span></button>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 14px 8px; min-height: 0">
      <div style="display: flex; flex-direction: column; gap: 2px">
{section("Uke 2 · 1 av 4 ferdig · frist fredag")}
{chr(10).join(rows)}
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px">
{section("Bonus · valgfri")}
{row(w["bonus"], bonus=True).replace("grid-template-columns: 22px minmax(0, 1fr) 56px 30px 54px", "grid-template-columns: 22px minmax(0, 1fr) 30px 54px").replace('<span style="font-size: 12px; color: #8b9bb4">30 min</span>' + chr(10), "")}
      </div>
    </div>
  </div>'''
    studio = '''  <div style="position: absolute; top: 0; right: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; background: #ffffff; box-shadow: -2px 0 0 #1b1f33">
    <div style="display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 14px; background: #1b1f33; font-size: 13px; color: #c0cbdc">
      <span style="color: #f03e2f">■</span><span style="flex: 1">Sanity Studio</span>
      <span style="padding: 4px 8px">Egen fane</span>
      <span style="padding: 4px 10px; background: #3a4263; color: #e3ebf5">✕ Lukk Studio</span>
    </div>
    <div style="flex: 1; display: grid; place-items: center; font-family: Inter, system-ui, sans-serif; font-size: 14px; color: #6e7683">Studio: Monster → Snømonsteret → Drops</div>
  </div>'''
    body = lst + "\n" + studio
    return bright_page("Lista med Studio åpent", body).replace("width: 100%; height: 100%; object-fit: cover", "width: 760px; height: 100%; object-fit: cover", 1)


if __name__ == "__main__":
    for name, html in {
        "Uke-mandag.dc.html": mandag(),
        "Uke-ferdig.dc.html": ferdig(),
        "Uke-fredag.dc.html": fredag(),
        "Uke-smal.dc.html": smal(),
    }.items():
        (OUT / name).write_text(html)
    print("ok")
