"""Point the canvas files at newly uploaded images.

blob-map.txt holds "<old id> <file>" from the first upload. Pages refer to
images either by an old id (/_blob/<old id>) or, for images never uploaded,
by name (/_blob/@<file>).

  python3 remap.py              lists the files in assets/ that must be uploaded
  python3 remap.py new-ids.txt  rewrites ny-canvas/project with the new ids

new-ids.txt has one "<file> <new id>" line per uploaded image.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).parent
PAGES = sorted((HERE / "ny-canvas" / "project").glob("*.html"))
old = dict(l.split() for l in (HERE / "blob-map.txt").read_text().splitlines() if l.strip())


def needed():
    names = set()
    for page in PAGES:
        for ref in re.findall(r"/_blob/(@?[\w.-]+)", page.read_text()):
            names.add(ref[1:] if ref.startswith("@") else old.get(ref, f"?{ref}"))
    return sorted(names)


if len(sys.argv) < 2:
    print("\n".join(needed()))
    sys.exit()

new = dict(l.split() for l in pathlib.Path(sys.argv[1]).read_text().splitlines() if l.strip())
for page in PAGES:
    text = page.read_text()
    for old_id, name in old.items():
        if name in new:
            text = text.replace(f"/_blob/{old_id}", f"/_blob/{new[name]}")
    for name, new_id in new.items():
        text = text.replace(f"/_blob/@{name}", f"/_blob/{new_id}")
    page.write_text(text)
    left = re.findall(r"/_blob/(@[\w.-]+|[0-9a-f]{32})", text)
    stale = [r for r in left if r.startswith("@") or r in old]
    if stale:
        print(f"{page.name}: mangler ny id for {sorted(set(stale))}")
print("ferdig")
