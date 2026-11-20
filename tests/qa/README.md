# Browser checks for the landing page

Two optional scripts for checking the results section and the caption studio
the way a person would use them. They are **not** part of `tests/run.py`: that
suite runs without a browser and without keys, while these need the site up and
Playwright installed.

## What they need

- The site running (the normal `python -m studio.server`, or the dev server on
  port 8765).
- Playwright's Python package in the venv:

  ```powershell
  .\.venv\Scripts\python.exe -m pip install playwright
  ```

  The scripts launch the installed Microsoft Edge (channel `msedge`) so no
  browser download is needed on Windows. On a machine without Edge, set
  `QA_CHANNEL` to another installed channel, or leave it empty and install
  Chromium with `playwright install chromium`.

## Run

```powershell
.\.venv\Scripts\python.exe tests\qa\landing_visual.py
.\.venv\Scripts\python.exe tests\qa\landing_interact.py
```

| Variable | Default | What it does |
| --- | --- | --- |
| `QA_BASE` | `http://127.0.0.1:8765` | Where the site is |
| `QA_OUT` | a `seekaclip-qa` folder in the system temp dir | Where screenshots go |
| `QA_CHANNEL` | `msedge` | The installed browser channel to drive |

`landing_visual.py` reports horizontal overflow, card counts, the aspect ratio,
console errors and failed responses for 1280 / 768 / 360 in dark and light.
`landing_interact.py` exercises filters, search, favourites, selection, fonts,
controls, Apply, the JSON output, the dialog and its focus handling, the
before/after keyboard handle, hover playback and reduced motion.

Both print a JSON summary at the end. A screenshot folder is useful for a quick
visual diff after a change.
