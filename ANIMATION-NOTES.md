# Motion, results and the caption studio

This note covers the work added on top of the existing landing page: the motion
audit and mapping, the **Results / See it in action** section, and the
**Caption & Text Effects Studio**.

Nothing here changes the theme, palette, fonts, layout order or copy of the
existing page. All new surfaces use the tokens already declared in
`web/theme.css` (`--s-bg`, `--s-card`, `--s-border`, `--s-text`, `--s-dim`,
`--s-accent`, `--s-accent2`, `--s-glow`, `--s-shadow`, …) and the two site
typefaces, Satoshi and Space Grotesk.

## Files

| File | What it is |
| --- | --- |
| `web/showcase.js` | Results cards: lazy video, hover / in-view playback, play-pause, modal player, before/after slider, nav hide-on-scroll, button ripple, small parallax |
| `web/captions.js` | Preset and font data, gallery, filters, search, favourites, live preview, controls, `applyCaptionStyle()`, JSON output, toast, optional backend POST |
| `web/captions.css` | Styles and 28 keyframe animations for the studio and the results helpers |
| `web/landing.html` | `#results`, `#captions` and `#resDialog` markup, the motion CSS that belongs to the page itself, three script tags and one stylesheet link |
| `studio/server.py` | `/videos/{name}` now also serves `.vtt` as `text/vtt`; `/assets/{name}` serves `.js` and `.css` with the right media type |

The new files are additive. No existing selector was redefined, so the old page
renders exactly as before if the new scripts fail to load.

## 1. Motion audit and mapping

The seven sites were reviewed as **references only** — no code, text, media or
asset was copied. For each one, the single most reusable idea was taken and
rebuilt in the existing design language.

| Reference | Motion studied | What we adopted | Where it lives |
| --- | --- | --- | --- |
| wisecut.ai | Calm editorial pages: sections arrive as one block, text first, media just after | Masked line reveal on headings (translate + clip), short fade-up for supporting copy; no per-letter effects | `.lx-reveal` (existing) + `.hl` / `.hl-in` hero mask |
| invideo.io editor | Dense tool UI where every card is a live sample | Hover/focus a style card and it plays; leave and it resets. Touch plays the card nearest the middle | `#capGrid` + `startCard()` / `stopCard()` in `captions.js` |
| openshorts.app | Vertical clips with word-synced, high-contrast captions | The 28 caption styles themselves, including karaoke sweep, pill pop, meme outline and one-word centre | `web/captions.css` (`fx-*`), `PRESETS` in `captions.js` |
| opus.pro | Long-to-short workflow with visible progress and shimmer | Sheen sweep across step cards and the featured clip; progress-like shimmer on the primary CTA | `.step` sheen (existing), `.res-veil` on the featured card |
| ssemble.com | Timeline of clip thumbnails with a clear play target | Poster-first video cards: a real frame, a duration chip, one obvious play button, expand for the full player | `#results`, `showcase.js` |
| choppity.com | Auto-reframe explained as a comparison | The before/after slider (`ORIGINAL` / `AI CLIP`), draggable with pointer and keyboard | `#baCompare`, `#baHandle`, `#baLive` |
| peakcut.haziqqasmi.com | The project's own page | Left untouched: hero mask, ripple, nav underline, plan border flow. The new sections match that rhythm instead of inventing a second one | `web/landing.html` motion block |

Rules applied to every new animation:

- `transform` and `opacity` only; no animated `width`, `height`, `top` or filters
  on scroll.
- Nothing runs off-screen: the gallery and the results row use
  `IntersectionObserver` to start and stop work.
- `prefers-reduced-motion: reduce` removes all movement and leaves the caption
  text fully visible and readable (see `.cap-stage *` and `.cap-frame *` in
  `captions.css`).
- No layout shift: posters carry `width` / `height`, video cards reserve their
  aspect ratio, and the gallery uses `content-visibility: auto` with an
  intrinsic size.

## 2. Results / See it in action

- One featured **16:9** card and three **9:16** cards, built from the real demo
  files already in `web/videos/`.
- Desktop: the poster plays muted, looped, inline while the pointer is over the
  card; leaving pauses it unless the user pinned it with the play button.
- Phone/tablet: the card that is mostly on screen plays; the rest pause.
- The whole poster is a large open target (`button.res-open`), the play button
  stops propagation so it can toggle playback, and `Enter`/`Space` on the open
  button works too.
- Clicking opens a native `<dialog>` (`showModal`). Focus moves to the close
  button, `Esc` closes, focus returns to the button that opened it, and the
  video `src` is removed on close so memory is not held by four players.
- The before/after comparison is a `role="slider"` handle: pointer drag, arrow
  keys, Home/End, and an `aria-live` sentence that reports the split.
- A small `data-vtt` hook is wired but no `.vtt` file ships: the demo clips
  already carry burned-in captions, so a track would duplicate them.

### Replacing the media

1. Drop the new files into `web/videos/` with the names the page expects
   (`demo-wide.mp4`, `short-1.mp4` … `short-3.mp4`) or add your own and update
   the four `data-src` / `data-poster` attributes on the `.res-card` figures.
2. Keep a poster for every clip. Match the poster's real pixel size in the
   `<img width height>` so the card never jumps while loading.
3. Update `data-title` and `data-note` on the figure; they feed the modal
   heading and the line under the video.
4. Update the visible duration text (`.res-dur`, e.g. `0:06`) when the clip
   length changes.
5. Optional captions: put `short-1.vtt` in `web/videos/`, then add
   `data-vtt="/videos/short-1.vtt"` to that card. The server already serves
   `.vtt` as `text/vtt`; the dialog creates the `<track>` when it opens and
   removes it when it closes.

## 3. Caption & Text Effects Studio

### What is in the box

- 28 presets across nine categories, rendered from data — no duplicated markup.
- Category filter, free-text search (searching leaves the current category and
  looks everywhere), favourites stored in `localStorage` (`sac-caption-favs`),
  and a live count.
- A 9:16 / 16:9 preview frame with editable sample text, replay, reset and
  apply.
- Controls: font (20 families, lazily loaded), size, weight, text colour,
  highlight colour, stroke colour and width, shadow/glow, backing box and box
  colour, letter spacing, uppercase, speed, intensity, position, alignment and
  words per line.
- `Apply style` saves the configuration, shows a toast in an `aria-live`
  region, opens the JSON panel and fires a DOM event.
- Public API: `window.applyCaptionStyle(config)` and
  `window.getCaptionStyle()`. The applied config is also mirrored on
  `window.SAC_CAPTION_STYLE` and announced as `saccaptionstyle`.

### Preset table

| # | Name | Category | Animation | Font | Sample |
| --- | --- | --- | --- | --- | --- |
| 1 | Ember Highlight | Bold | `highlight` | Poppins | THIS IS THE MOMENT |
| 2 | Karaoke Sweep | Karaoke | `karaoke` | Poppins | WAIT FOR IT |
| 3 | Pill Pop | Bold | `pill` | Montserrat | NO WAY |
| 4 | Meme Outline | Outline/Stroke | `outline` | Anton | ABSOLUTE CINEMA |
| 5 | Neon Pulse | Neon/Glow | `neon` | Archivo Black | CLUTCH |
| 6 | Aurora Gradient | Gradient | `gradient` | Poppins | ONE MORE RUN |
| 7 | Studio Minimal | Minimal | `minimal` | Inter | and that was the moment |
| 8 | Typewriter | Retro/Typewriter | `typewriter` | Space Mono | he actually did it |
| 9 | Cinema Lower | Cinematic | `cinema` | Playfair Display | the quiet before |
| 10 | Comic Drop | Playful | `comic` | Luckiest Guy | BOOM! CHAT LOST IT |
| 11 | VHS Rewind | Retro/Typewriter | `vhs` | Press Start 2P | REWIND 1998 |
| 12 | Glitch Split | Trending | `glitch` | Archivo Black | SIGNAL LOST |
| 13 | Ink Script | Playful | `ink` | Caveat | we go again |
| 14 | News Ticker | Minimal | `ticker` | Oswald | BREAKING · THE CLIP IS READY |
| 15 | Emoji Pop | Playful | `emoji` | Poppins | THIS IS HUGE |
| 16 | Confetti Words | Playful | `multicolor` | Bangers | ONE TWO THREE GO |
| 17 | Underline Sweep | Bold | `underline` | Montserrat | THE REAL STORY |
| 18 | Depth 3D | Bold | `depth` | Archivo Black | DEEP IMPACT |
| 19 | One Word Centre | Trending | `oneword` | Anton | WAIT FOR THE ENDING |
| 20 | Blur Reveal | Cinematic | `blur` | Playfair Display | suddenly, everything |
| 21 | Flip In | Trending | `flip` | Montserrat | FLIP THE SCRIPT |
| 22 | Elastic Bounce | Playful | `elastic` | Bangers | BIG ENERGY |
| 23 | Letter Wave | Trending | `wave` | Righteous | RIDE THE WAVE |
| 24 | Spotlight Shine | Neon/Glow | `shine` | Montserrat | MAKE IT SHINE |
| 25 | Line Stack | Minimal | `stack` | Inter | one line at a time |
| 26 | Retro Sunset | Gradient | `sunset` | Bebas Neue | GOLDEN HOUR |
| 27 | Impact Shake | Bold | `impact` | Anton | HIT DIFFERENT |
| 28 | Slide In | Minimal | `slide` | Inter | here comes the clip |

Each entry in `PRESETS` also carries `tags` (search terms), default colours,
duration and stagger.

### Adding a style

1. Add an object to `PRESETS` in `web/captions.js`:

   ```js
   { id:"ribbon", name:"Ribbon Wipe", cat:"Trending", tags:"wipe, ribbon, clean",
     anim:"ribbon", font:"Inter", weight:700, sample:"the next chapter",
     text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.12 }
   ```

2. Add the base state and the animation in `web/captions.css`. The base state
   must be readable with **no** animation, because reduced motion never adds
   `.running`:

   ```css
   .fx-ribbon .w{opacity:1}
   .running.fx-ribbon .w{animation:capRibbon var(--dur) cubic-bezier(.2,.8,.2,1) infinite;
     animation-delay:calc(var(--i) * var(--stagger))}
   @keyframes capRibbon{0%{clip-path:inset(0 100% 0 0);}40%,100%{clip-path:inset(0 0 0 0);}}
   ```

3. If the style needs a new category, add it to `CATS`; existing categories
   are picked up automatically from the preset data.
4. If it needs a new font, add it to `FONTS` (see below). Otherwise the engine
   loads it only when the card nears the screen.

### Adding a font

```js
{ name:"Sora", cat:"Sans", google:"Sora:wght@400;600;800",
  stack:"'Sora','Satoshi',system-ui,sans-serif" }
```

The picker, preview and lazy loader all read the same list. For the **renderer**
(the clips actually produced by the backend), a font also needs:

1. The `.ttf`/`.otf` in `studio/fonts/`.
2. An entry in `FONT_FILES` in `studio/render.py`.
3. A restart (or a new run of `install_fonts()`) so it is copied into the
   data folder's `fonts/` directory.

### Backend hook

The studio stays local-first. To persist the chosen style, add an endpoint and
point the section at it:

```html
<section id="captions" data-endpoint="/api/caption-style">
```

Then `Apply` POSTs the JSON below (same-origin, cookies included). The studio
keeps working if the request fails.

```json
{
  "id": "ember",
  "name": "Ember Highlight",
  "category": "Bold",
  "animation": "highlight",
  "font": "Poppins",
  "fontWeight": 800,
  "fontSize": 48,
  "textColor": "#FFFFFF",
  "highlightColor": "#FDE047",
  "strokeColor": "#FFFFFF",
  "strokeWidth": 0,
  "shadow": "none",
  "box": false,
  "boxColor": "#111827",
  "letterSpacing": "0.000em",
  "uppercase": true,
  "speed": 1,
  "intensity": 1,
  "position": "bottom",
  "align": "center",
  "wordsPerLine": 3,
  "sampleText": "THIS IS THE MOMENT"
}
```

Server-side rules worth keeping:

- Validate against a whitelist of `font`, `animation`, `position`, `align` and
  `shadow`; reject anything else rather than passing it through.
- Clamp `fontSize` (20–96), `fontWeight` (400–900), `strokeWidth` (0–8),
  `wordsPerLine` (1–6), `speed` (0.5–2) and `intensity` (0–1).
- Accept only `#RRGGBB` colours.
- Store it per user (`ctx.uid()`), never globally, and never take the user id
  from the request body.
- Treat the JSON as styling only. Never build an ffmpeg command from it: the
  renderer should map an allow-listed `animation` id to a known ffmpeg
  expression, exactly like the existing presets in `studio/render.py`.

The renderer currently has three caption presets (`bounce`, `hype`, `clean`)
and a fixed hook style. Mapping the studio to those is a natural next step:
`animation` + colours + stroke + box can drive an ASS style, while the
word-level motion stays a fixed renderer choice per preset.

## 4. Extra ideas

- **Save to account.** The `data-endpoint` hook plus a small table would let a
  signed-in user keep several styles and pick one per clip.
- **Copy CSS.** A button that serialises the chosen style into a ready-to-paste
  CSS block (the JSON is already there).
- **Style of the week.** Rotate a featured preset in the results section with
  the same clip, so the caption choice has context.
- **Transcript timing.** Use the existing word timings from `studio/render.py`
  to drive the preview at real speed instead of a constant loop.
- **Compare A/B.** Two preview frames side by side with one shared sample text.
- **Keyboard browsing.** Left/right arrows to move between cards once the grid
  has focus, matching the favourite and open buttons.
- **Shareable state.** Encode the style in the URL hash so a link opens the
  studio on that preset.
- **Real before/after.** Render the same frame through the pipeline and ship
  that pair instead of the current illustrative images.

## 5. QA checklist

Verified on the running site at 360, 768 and 1280 px, in dark and light, with
Microsoft Edge through Playwright:

- [x] `/assets/captions.css`, `/assets/captions.js` and `/assets/showcase.js`
      return 200 with the right content types.
- [x] `#results` and `#captions` render; 28 cards, 11 filter buttons, four
      result videos; no horizontal overflow at any width.
- [x] Category filter, search across all categories, empty state, favourites
      persisted in `localStorage`.
- [x] Card selection updates `aria-pressed` and the live preview name.
- [x] Font picker opens, lists 20 families, closes on choose and on `Esc`.
- [x] Size, weight, colours, stroke, shadow, box, spacing, speed, intensity,
      position, alignment and words-per-line all repaint the preview.
- [x] 9:16 ⇄ 16:9 toggle changes the frame ratio.
- [x] `Apply` shows the `aria-live` toast, persists the style, fills the JSON
      box (also while tweaking) and exposes `applyCaptionStyle` /
      `getCaptionStyle`.
- [x] Replay rebuilds the words.
- [x] Dialog opens from the poster with `Enter`, moves focus to close, closes on
      `Esc`, releases the video `src` and returns focus to the opener.
- [x] Before/after slider responds to `ArrowRight` and updates
      `aria-valuenow` + the live sentence.
- [x] Hover plays the first result card muted; leaving pauses it.
- [x] `prefers-reduced-motion: reduce` leaves the caption text visible, removes
      animations and keeps all 28 cards usable.
- [x] Zero console errors and zero failed requests during the crawl.
- [x] `tests/test_captions.py` passes (20 checks).
- [x] `tests/run.py` passes all suites (run with `.env` moved aside, because
      that file pins the real data folder and the storage test expects none).

Re-run the browser checks with the local server up:

```powershell
cd "<project>"
$env:PATH = "C:\seekaclip-tools\ffmpeg\ffmpeg-9.0.2-essentials_build\bin;" + $env:PATH
.\.venv\Scripts\python.exe -m studio.server
```

```powershell
.\.venv\Scripts\python.exe tests\qa\landing_visual.py
.\.venv\Scripts\python.exe tests\qa\landing_interact.py
```

Both read `QA_BASE`, `QA_OUT` and `QA_CHANNEL`; see `tests/qa/README.md` for the
defaults and for the one-time Playwright install.

## 6. Known limits

- The gallery stages are **16:9** thumbnails even though the output is 9:16;
  the badge on each card names its category, not an aspect ratio, so it does
  not promise a shape the thumbnail does not have.
- No `.vtt` tracks ship by default: the demo clips already have burned-in
  captions. Support and wiring are in place for when clean clips are used.
- The before/after images are illustrative frames from the demo set, not a
  real render pair.
- The style is stored in `localStorage` only; nothing is written to the server
  until `data-endpoint` is set and implemented.
- Fonts come from Google Fonts on demand. A self-hosted set is the next step if
  the site must work fully offline.
