"""Click-through check for the results player and the caption studio.

It exercises the parts that a screenshot cannot prove: filter, search,
favourites, card selection, the font picker, the controls, the aspect toggle,
Apply (toast, saved style, JSON, public API), the dialog (focus, Esc, focus
restore, src release), the before/after keyboard handle, hover playback and
reduced motion.

    python tests/qa/landing_interact.py

Needs the site running and Playwright installed (see tests/qa/README.md).
"""

import json, os, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("QA_BASE", "http://127.0.0.1:8765").rstrip("/")
OUT = os.environ.get("QA_OUT", os.path.join(tempfile.gettempdir(), "seekaclip-qa"))
CHANNEL = os.environ.get("QA_CHANNEL", "msedge")

os.makedirs(OUT, exist_ok=True)
res = {}
errs = []

with sync_playwright() as p:
    try:
        b = p.chromium.launch(channel=CHANNEL)
    except Exception:
        b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 900})
    pg = ctx.new_page()
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.on("pageerror", lambda e: errs.append("JS: " + str(e)))
    pg.goto(BASE + "/", wait_until="load")
    pg.wait_for_timeout(500)

    # the caption section, scrolled so reveals fire
    y = pg.evaluate("() => document.querySelector('#captions').offsetTop - 90")
    pg.evaluate("(y) => scrollTo(0, y)", y)
    pg.wait_for_timeout(1200)
    pg.locator("#captions").screenshot(path=os.path.join(OUT, "cap-section-1280.png"))

    # category, search and empty state
    pg.click("#capTabs .cap-tab:nth-child(3)")
    pg.wait_for_timeout(400)
    tab_cards = pg.locator("#capGrid .cap-card").count()
    pg.fill("#capSearch", "neon")
    pg.wait_for_timeout(400)
    search_cards = pg.locator("#capGrid .cap-card").count()
    pg.fill("#capSearch", "zzzznotathing")
    pg.wait_for_timeout(300)
    empty_shown = pg.evaluate("() => !document.getElementById('capEmpty').hidden")
    pg.fill("#capSearch", "")
    pg.click("#capTabs .cap-tab:nth-child(1)")
    pg.wait_for_timeout(300)
    res["tabs"] = {"category": tab_cards, "search_neon": search_cards, "empty_shown": empty_shown}

    # selecting a card updates the button state and the live name
    first = pg.locator("#capGrid .cap-card").first
    first.locator(".cap-open").click()
    pg.wait_for_timeout(400)
    res["select"] = pg.evaluate("""() => {
      const c = document.querySelector('#capGrid .cap-card');
      return { pressed: c.dataset.selected, name: document.getElementById('capSelectedName').textContent,
               live: getComputedStyle(document.querySelector('#capLiveLine')).color };
    }""")

    # favourites persist and filter
    pg.locator("#capGrid .cap-star").first.click()
    pg.wait_for_timeout(200)
    fav_on = pg.evaluate("() => JSON.parse(localStorage.getItem('sac-caption-favs')||'[]')")
    pg.click("#capFavToggle")
    pg.wait_for_timeout(300)
    fav_cards = pg.locator("#capGrid .cap-card").count()
    pg.click("#capFavToggle")
    pg.wait_for_timeout(300)
    res["favs"] = {"stored": fav_on, "filtered": fav_cards}

    # the font picker
    pg.click("#capFontBtn")
    pg.wait_for_timeout(250)
    open_state = pg.evaluate("() => !document.getElementById('capFontList').hidden")
    opts = pg.locator("#capFontList .cap-font").count()
    pg.locator("#capFontList .cap-font").nth(2).click()
    pg.wait_for_timeout(600)
    chosen = pg.evaluate("() => ({btn: document.getElementById('capFontBtn').textContent.trim(), hidden: document.getElementById('capFontList').hidden})")
    res["fonts"] = {"opened": open_state, "listed": opts, "chosen": chosen}

    # controls repaint the live preview
    pg.evaluate("""() => {
      const size = document.getElementById('capSize');
      size.value = '72'; size.dispatchEvent(new Event('input', {bubbles:true}));
      const hi = document.getElementById('capHiColor');
      hi.value = '#22d3ee'; hi.dispatchEvent(new Event('input', {bubbles:true}));
      const box = document.getElementById('capBox');
      box.checked = true; box.dispatchEvent(new Event('change', {bubbles:true}));
    }""")
    pg.wait_for_timeout(500)
    res["controls"] = pg.evaluate("""() => {
      const line = document.querySelector('#capLiveLine .w');
      const wrap = document.getElementById('capLiveLine .cap-line');
      return { fontSize: line && getComputedStyle(line).fontSize,
               plate: wrap ? wrap.className : null,
               plateBg: wrap ? getComputedStyle(wrap).backgroundColor : null };
    }""")

    # aspect ratio
    pg.click('.cap-ratio button[data-ratio="16x9"]')
    pg.wait_for_timeout(400)
    wide = pg.evaluate("() => getComputedStyle(document.getElementById('capFrame')).aspectRatio")
    pg.click('.cap-ratio button[data-ratio="9x16"]')
    pg.wait_for_timeout(300)
    tall = pg.evaluate("() => getComputedStyle(document.getElementById('capFrame')).aspectRatio")
    res["ratio"] = {"wide": wide, "tall": tall}

    # apply: toast, saved style, JSON, public API
    pg.click("#capApply")
    pg.wait_for_timeout(400)
    res["apply"] = pg.evaluate("""() => ({
      toast: document.getElementById('capToast').className,
      msg: document.getElementById('capToastMsg').textContent,
      json: (document.getElementById('capJson').textContent || '').slice(0, 120),
      saved: !!localStorage.getItem('sac-caption-style'),
      api: typeof window.applyCaptionStyle,
      fn: typeof window.getCaptionStyle
    })""")
    pg.fill("#capText", "one two three four five")
    pg.wait_for_timeout(500)
    res["json_live"] = pg.evaluate("() => JSON.parse(document.getElementById('capJson').textContent).sampleText")
    pg.click("#capReplay")
    pg.wait_for_timeout(200)
    res["replay"] = pg.evaluate("() => document.querySelectorAll('#capLiveLine .w').length > 0 ? 'words present' : 'missing'")

    # dialog: Enter on the open button, focus in, Esc, focus back, src released
    pg.evaluate("() => document.querySelector('#results').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(700)
    opener = pg.locator("#results .res-open").first
    opener.focus()
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(600)
    opened = pg.evaluate("""() => {
      const d = document.getElementById('resDialog');
      return { open: d.open, title: document.getElementById('resDialogTitle').textContent,
               hasSrc: !!document.getElementById('resDialogVideo').getAttribute('src'),
               focus: document.activeElement.className,
               track: !!document.querySelector('#resDialogVideo track') };
    }""")
    pg.screenshot(path=os.path.join(OUT, "res-dialog-1280.png"))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(500)
    closed = pg.evaluate("""() => ({
      open: document.getElementById('resDialog').open,
      src: document.getElementById('resDialogVideo').getAttribute('src'),
      focus: document.activeElement.className,
      restored: document.activeElement === document.querySelector('#results .res-open')
    })""")
    res["dialog"] = {"opened": opened, "closed": closed}

    # before/after slider by keyboard
    ba = pg.locator("#baCompare")
    ba.scroll_into_view_if_needed()
    pg.wait_for_timeout(400)
    pg.focus("#baHandle")
    before = pg.evaluate("() => document.getElementById('baHandle').getAttribute('aria-valuenow')")
    pg.keyboard.press("ArrowRight")
    pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(300)
    after_v = pg.evaluate("() => document.getElementById('baHandle').getAttribute('aria-valuenow')")
    res["beforeafter"] = {"before": before, "after": after_v}

    # hover playback
    pg.evaluate("() => document.querySelector('#results').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(500)
    pg.locator("#results .res-card").first.hover()
    pg.wait_for_timeout(1200)
    res["hover"] = pg.evaluate("""() => {
      const v = document.querySelector('#results video');
      return { paused: v.paused, muted: v.muted, currentTime: Math.round(v.currentTime * 100) / 100,
               hasSrc: !!v.getAttribute('src') };
    }""")
    ctx.close()

    # reduced motion keeps the caption readable and stops the animation
    ctx2 = b.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
    pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: errs.append("RM JS: " + str(e)))
    pg2.goto(BASE + "/", wait_until="load")
    pg2.wait_for_timeout(600)
    y2 = pg2.evaluate("() => document.querySelector('#captions').offsetTop - 90")
    pg2.evaluate("(y) => scrollTo(0, y)", y2)
    pg2.wait_for_timeout(900)
    res["reduced"] = pg2.evaluate("""() => {
      const w = document.querySelector('#capLiveLine .w');
      const cs = w ? getComputedStyle(w) : null;
      return { words: document.querySelectorAll('#capLiveLine .w').length,
               text: document.getElementById('capLiveLine').textContent.trim().slice(0, 40),
               opacity: cs && cs.opacity, anim: cs && cs.animationName,
               cards: document.querySelectorAll('#capGrid .cap-card').length,
               frame: document.getElementById('capFrame').className };
    }""")
    pg2.locator("#captions").screenshot(path=os.path.join(OUT, "cap-section-reduced.png"))
    ctx2.close()
    b.close()

print(json.dumps(res, indent=1))
print("ERRORS:", len(errs))
for e in errs[:20]:
    print("  ", e)
print("SCREENSHOTS:", OUT)
