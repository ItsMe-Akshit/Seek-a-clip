"""Landing-page layout check: the results section, the caption studio and the
page chrome at three widths in both themes.

It walks the whole page so lazy media loads and reveal effects run, then
reports overflow, counts and failed requests, and saves one screenshot per
theme and width.

    python tests/qa/landing_visual.py

Needs the site running and Playwright installed (see tests/qa/README.md).
Set QA_BASE to point at another port. Screenshots go to QA_OUT, which defaults
to a folder in the system temp directory so nothing is written into the repo.
"""

import json, os, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("QA_BASE", "http://127.0.0.1:8765").rstrip("/")
OUT = os.environ.get("QA_OUT", os.path.join(tempfile.gettempdir(), "seekaclip-qa"))
CHANNEL = os.environ.get("QA_CHANNEL", "msedge")
WIDTHS = [(1280, 900), (768, 1000), (360, 780)]
THEMES = ["dark", "light"]

os.makedirs(OUT, exist_ok=True)

report = {}
errors = []
bad = []

with sync_playwright() as p:
    try:
        b = p.chromium.launch(channel=CHANNEL)
    except Exception:
        b = p.chromium.launch()
    for theme in THEMES:
        for w, h in WIDTHS:
            key = f"{theme}-{w}"
            ctx = b.new_context(viewport={"width": w, "height": h})
            ctx.add_init_script("localStorage.setItem('sac-theme','%s')" % theme)
            pg = ctx.new_page()
            pg.on("console", lambda m, k=key: m.type == "error" and errors.append(f"[{k}] {m.text}"))
            pg.on("pageerror", lambda e, k=key: errors.append(f"[{k}] JS: {e}"))
            pg.on("response", lambda r, k=key: r.status >= 400 and bad.append(f"[{k}] {r.status} {r.url}"))
            pg.goto(BASE + "/", wait_until="load")
            pg.wait_for_timeout(600)
            pg.evaluate("""async () => {
              const step = Math.round(innerHeight * 0.7);
              for (let y = 0; y < document.body.scrollHeight; y += step) {
                scrollTo(0, y);
                await new Promise(r => setTimeout(r, 140));
              }
            }""")
            pg.wait_for_timeout(800)
            data = pg.evaluate("""() => {
              const q = s => document.querySelector(s);
              const row = q('.res-row');
              return {
                hOverflow: document.documentElement.scrollWidth - innerWidth,
                results: !!q('#results'),
                captions: !!q('#captions'),
                cards: document.querySelectorAll('#capGrid .cap-card').length,
                tabs: document.querySelectorAll('#capTabs .cap-tab').length,
                rowDisplay: row ? getComputedStyle(row).display : null,
                rowScrollable: row ? row.scrollWidth > row.clientWidth + 2 : null,
                frameRatio: q('#capFrame') ? getComputedStyle(q('#capFrame')).aspectRatio : null,
                stageText: q('#capLiveLine') ? q('#capLiveLine').textContent.trim().slice(0, 40) : null,
                selected: q('#capSelectedName') ? q('#capSelectedName').textContent : null,
                resVideos: document.querySelectorAll('#results video').length,
                dialogOpen: q('#resDialog') ? q('#resDialog').open : null,
              };
            }""")
            pg.locator("#results").scroll_into_view_if_needed()
            pg.wait_for_timeout(300)
            pg.locator("#results").screenshot(path=os.path.join(OUT, f"results-{key}.png"))
            pg.locator("#captions").scroll_into_view_if_needed()
            pg.wait_for_timeout(300)
            pg.locator("#captions").screenshot(path=os.path.join(OUT, f"captions-{key}.png"))
            report[key] = data
            ctx.close()
    b.close()

print(json.dumps(report, indent=1))
print("CONSOLE ERRORS:", len(errors))
for e in errors[:25]:
    print("  ", e)
print("BAD RESPONSES:", len(bad))
for e in bad[:25]:
    print("  ", e)
print("SCREENSHOTS:", OUT)
