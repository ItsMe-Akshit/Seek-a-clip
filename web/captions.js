/* ==========================================================================
   Seek-a-clip — Caption & Text Effects Studio
   --------------------------------------------------------------------------
   One config array drives the whole gallery, the filters, the favourites,
   the live preview and the exported JSON. Add a style by adding one object
   to PRESETS. Add a font by adding one object to FONTS.

   Nothing here touches the site chrome: the captions are rendered inside
   their own dark "video frame" and use their own CSS variables.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("captions");
  if (!root) return;                                   // section not on this page

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none)").matches;

  /* ---------------------------------------------------------------------
     1. FONTS
     Each font is loaded from Google Fonts only when a card or a font
     option is actually previewed. The stack always ends in a locally
     available fallback, so an offline machine still renders the preview.
     --------------------------------------------------------------------- */
  var FONTS = [
    { name: "Inter",          cat: "Sans",     google: "Inter:wght@400;600;700;900",                 stack: "'Inter','Satoshi',system-ui,sans-serif" },
    { name: "Poppins",        cat: "Sans",     google: "Poppins:wght@400;600;700;800;900",           stack: "'Poppins','Satoshi',system-ui,sans-serif" },
    { name: "Montserrat",     cat: "Sans",     google: "Montserrat:wght@400;600;700;800;900",        stack: "'Montserrat','Satoshi',system-ui,sans-serif" },
    { name: "Bebas Neue",     cat: "Display",  google: "Bebas+Neue",                                 stack: "'Bebas Neue','Anton','Satoshi',sans-serif" },
    { name: "Anton",          cat: "Display",  google: "Anton",                                      stack: "'Anton','Archivo Black','Satoshi',sans-serif" },
    { name: "Oswald",         cat: "Display",  google: "Oswald:wght@400;600;700",                    stack: "'Oswald','Satoshi',sans-serif" },
    { name: "Archivo Black",  cat: "Display",  google: "Archivo+Black",                              stack: "'Archivo Black','Anton','Satoshi',sans-serif" },
    { name: "Luckiest Guy",   cat: "Display",  google: "Luckiest+Guy",                               stack: "'Luckiest Guy','Bangers',cursive" },
    { name: "Bangers",        cat: "Display",  google: "Bangers",                                    stack: "'Bangers','Luckiest Guy',cursive" },
    { name: "Pacifico",       cat: "Script",   google: "Pacifico",                                   stack: "'Pacifico','Caveat',cursive" },
    { name: "Caveat",         cat: "Script",   google: "Caveat:wght@400;600;700",                    stack: "'Caveat','Pacifico',cursive" },
    { name: "Dancing Script", cat: "Script",   google: "Dancing+Script:wght@400;600;700",            stack: "'Dancing Script','Caveat',cursive" },
    { name: "Playfair Display",cat: "Serif",   google: "Playfair+Display:wght@400;600;700;900",      stack: "'Playfair Display',Georgia,serif" },
    { name: "Merriweather",   cat: "Serif",    google: "Merriweather:wght@400;700;900",              stack: "'Merriweather',Georgia,serif" },
    { name: "DM Serif Display",cat:"Serif",    google: "DM+Serif+Display",                           stack: "'DM Serif Display',Georgia,serif" },
    { name: "JetBrains Mono", cat: "Mono",     google: "JetBrains+Mono:wght@400;600;700",            stack: "'JetBrains Mono',ui-monospace,monospace" },
    { name: "Space Mono",     cat: "Mono",     google: "Space+Mono:wght@400;700",                    stack: "'Space Mono',ui-monospace,monospace" },
    { name: "Press Start 2P", cat: "Fun",      google: "Press+Start+2P",                             stack: "'Press Start 2P',ui-monospace,monospace" },
    { name: "Righteous",      cat: "Fun",      google: "Righteous",                                  stack: "'Righteous','Bangers',cursive" },
    { name: "Silkscreen",     cat: "Fun",      google: "Silkscreen:wght@400;700",                    stack: "'Silkscreen','Press Start 2P',monospace" }
  ];
  var fontByName = {};
  FONTS.forEach(function (f) { fontByName[f.name] = f; });
  var loadedFonts = {};

  function fontStack(name) {
    var f = fontByName[name];
    return f ? f.stack : "'Satoshi',system-ui,sans-serif";
  }

  function ensureFont(name, done) {
    var f = fontByName[name];
    if (!f || loadedFonts[name]) { if (done) done(); return; }
    loadedFonts[name] = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + f.google + "&display=swap";
    link.onload = function () {
      if (document.fonts && document.fonts.load) {
        document.fonts.load("700 16px \"" + name + "\"");
      }
      if (done) done();
    };
    link.onerror = function () { if (done) done(); };
    document.head.appendChild(link);
  }

  /* ---------------------------------------------------------------------
     2. PRESETS
     `anim` maps to one CSS class: fx-<anim>. All of them are defined in
     captions.css and only run while the card has the .running class.
     --------------------------------------------------------------------- */
  var PRESETS = [
    { id:"ember",    name:"Ember Highlight", cat:"Bold",             tags:"word highlight, colour pop", anim:"highlight",  font:"Poppins",          weight:800, sample:"THIS IS THE MOMENT",   text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.16 },
    { id:"karaoke",  name:"Karaoke Sweep",   cat:"Karaoke",          tags:"progressive fill, sing-along", anim:"karaoke",  font:"Poppins",          weight:800, sample:"WAIT FOR IT",          text:"#FFFFFF", hi:"#4ADE80", dur:2.8, stagger:0.2 },
    { id:"pill",     name:"Pill Pop",        cat:"Bold",             tags:"active word box, rounded",   anim:"pill",      font:"Montserrat",       weight:800, sample:"NO WAY",               text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.24 },
    { id:"outline",  name:"Meme Outline",    cat:"Outline/Stroke",   tags:"stroke, fill, viral",        anim:"outline",   font:"Anton",            weight:400, sample:"ABSOLUTE CINEMA",      text:"#FFFFFF", hi:"#FDE047", stroke:"#FFFFFF", sw:1.6, dur:2.6, stagger:0.18 },
    { id:"neon",     name:"Neon Pulse",      cat:"Neon/Glow",        tags:"glow, pulse, night",         anim:"neon",      font:"Archivo Black",    weight:400, sample:"CLUTCH",               text:"#FFFFFF", hi:"#22D3EE", dur:2.2, stagger:0.2 },
    { id:"aurora",   name:"Aurora Gradient", cat:"Gradient",         tags:"animated gradient, colour",  anim:"gradient",  font:"Poppins",          weight:800, sample:"ONE MORE RUN",         text:"#FFFFFF", hi:"#A855F7", dur:4,    stagger:0.08 },
    { id:"minimal",  name:"Studio Minimal",  cat:"Minimal",          tags:"clean, subtitle, fade",      anim:"minimal",   font:"Inter",            weight:600, sample:"and that was the moment", text:"#FFFFFF", hi:"#FFFFFF", dur:2.2, stagger:0.12, ls:"-0.01em", tt:"none" },
    { id:"type",     name:"Typewriter",      cat:"Retro/Typewriter", tags:"cursor, typing, mono",       anim:"typewriter",font:"Space Mono",       weight:700, sample:"he actually did it",   text:"#FFFFFF", hi:"#FDE047", dur:3,    stagger:0.18 },
    { id:"cinema",   name:"Cinema Lower",    cat:"Cinematic",         tags:"letter-spaced, lowercase",   anim:"cinema",    font:"Playfair Display", weight:600, sample:"the quiet before",     text:"#FFFFFF", hi:"#FFFFFF", dur:3,    stagger:0.06, ls:"0.18em", tt:"lowercase" },
    { id:"comic",    name:"Comic Drop",      cat:"Playful",           tags:"bounce, hard shadow",        anim:"comic",     font:"Luckiest Guy",     weight:400, sample:"BOOM! CHAT LOST IT",   text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.14 },
    { id:"vhs",      name:"VHS Rewind",      cat:"Retro/Typewriter", tags:"tape, flicker, scanlines",   anim:"vhs",       font:"Press Start 2P",   weight:400, sample:"REWIND 1998",          text:"#FFFFFF", hi:"#67E8F9", dur:2.6, stagger:0.1 },
    { id:"glitch",   name:"Glitch Split",    cat:"Trending",          tags:"rgb split, error, hype",     anim:"glitch",    font:"Archivo Black",    weight:400, sample:"SIGNAL LOST",          text:"#FFFFFF", hi:"#22D3EE", dur:1.8, stagger:0.12 },
    { id:"ink",      name:"Ink Script",      cat:"Playful",           tags:"handwritten, soft",          anim:"ink",       font:"Caveat",           weight:700, sample:"we go again",          text:"#FFFFFF", hi:"#FDE047", dur:2.8, stagger:0.14, ls:"0.01em", tt:"none" },
    { id:"ticker",   name:"News Ticker",     cat:"Minimal",           tags:"lower third, scrolling",     anim:"ticker",    font:"Oswald",           weight:600, sample:"BREAKING · THE CLIP IS READY", text:"#FFFFFF", hi:"#FDE047", dur:7, stagger:0 },
    { id:"emoji",    name:"Emoji Pop",       cat:"Playful",           tags:"emoji, reaction, keywords",  anim:"emoji",     font:"Poppins",          weight:800, sample:"THIS IS HUGE",         text:"#FFFFFF", hi:"#FDE047", dur:2.6, stagger:0.16 },
    { id:"confetti", name:"Confetti Words",  cat:"Playful",           tags:"multi-colour, party",        anim:"multicolor",font:"Bangers",          weight:400, sample:"ONE TWO THREE GO",     text:"#FFFFFF", hi:"#FDE047", dur:2.6, stagger:0.1 },
    { id:"underline",name:"Underline Sweep", cat:"Bold",              tags:"underline, svg draw",        anim:"underline", font:"Montserrat",       weight:800, sample:"THE REAL STORY",       text:"#FFFFFF", hi:"#FDE047", dur:2.6, stagger:0.16 },
    { id:"depth",    name:"Depth 3D",        cat:"Bold",              tags:"extruded, 3d, heavy",        anim:"depth",     font:"Archivo Black",    weight:400, sample:"DEEP IMPACT",          text:"#FFFFFF", hi:"#FDE047", dur:2.6, stagger:0.1 },
    { id:"oneword",  name:"One Word Centre", cat:"Trending",          tags:"one word, big centre",       anim:"oneword",   font:"Anton",            weight:400, sample:"WAIT FOR THE ENDING",  text:"#FFFFFF", hi:"#FDE047", dur:2.8, stagger:0.22 },
    { id:"blur",     name:"Blur Reveal",     cat:"Cinematic",         tags:"blur to sharp, dreamy",      anim:"blur",      font:"Playfair Display", weight:600, sample:"suddenly, everything", text:"#FFFFFF", hi:"#FFFFFF", dur:2.6, stagger:0.12 },
    { id:"flip",     name:"Flip In",         cat:"Trending",          tags:"3d flip, rotate",            anim:"flip",      font:"Montserrat",       weight:800, sample:"FLIP THE SCRIPT",      text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.13 },
    { id:"elastic",  name:"Elastic Bounce",  cat:"Playful",           tags:"elastic, spring",            anim:"elastic",   font:"Bangers",          weight:400, sample:"BIG ENERGY",           text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.11 },
    { id:"wave",     name:"Letter Wave",     cat:"Trending",          tags:"letter stagger, wave",       anim:"wave",      font:"Righteous",        weight:400, sample:"RIDE THE WAVE",        text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0 },
    { id:"shine",    name:"Spotlight Shine", cat:"Neon/Glow",         tags:"shine sweep, glossy",        anim:"shine",     font:"Montserrat",       weight:800, sample:"MAKE IT SHINE",        text:"#FFFFFF", hi:"#FDE047", dur:2.8, stagger:0 },
    { id:"stack",    name:"Line Stack",      cat:"Minimal",           tags:"line by line, clean",        anim:"stack",     font:"Inter",            weight:700, sample:"one line at a time",   text:"#FFFFFF", hi:"#FFFFFF", dur:2.8, stagger:0.13 },
    { id:"sunset",   name:"Retro Sunset",    cat:"Gradient",          tags:"warm gradient, vhs",         anim:"sunset",    font:"Bebas Neue",       weight:400, sample:"GOLDEN HOUR",          text:"#FFFFFF", hi:"#FB7185", dur:1.6, stagger:0.08 },
    { id:"impact",   name:"Impact Shake",    cat:"Bold",              tags:"shake, keyword, emphasis",   anim:"impact",    font:"Anton",            weight:400, sample:"HIT DIFFERENT",        text:"#FFFFFF", hi:"#FDE047", dur:2.4, stagger:0.12 },
    { id:"slide",    name:"Slide In",        cat:"Minimal",           tags:"slide, per word",            anim:"slide",     font:"Inter",            weight:700, sample:"here comes the clip",  text:"#FFFFFF", hi:"#FFFFFF", dur:2.6, stagger:0.12 }
  ];

  var CATS = ["All", "Trending", "Minimal", "Bold", "Karaoke", "Neon/Glow", "Gradient", "Retro/Typewriter", "Cinematic", "Playful", "Outline/Stroke"];
  var presetById = {};
  PRESETS.forEach(function (p) { presetById[p.id] = p; });

  var FAV_KEY = "sac-caption-favs";
  var STYLE_KEY = "sac-caption-style";
  var favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]") || []; } catch (e) { favs = []; }
  var selectedId = "ember";
  var activeCat = "All";
  var query = "";
  var showFavs = false;

  /* ---------------------------------------------------------------------
     3. RENDERING A LINE
     --------------------------------------------------------------------- */
  function letterise(word, counter) {
    var out = "";
    for (var i = 0; i < word.length; i++) {
      out += '<span class="l" style="--i:' + counter.n++ + '">' + esc(word[i]) + "</span>";
    }
    return '<span class="w" style="--i:' + counter.w++ + '">' + out + "</span>";
  }

  function lineHTML(text, p, opts) {
    opts = opts || {};
    var group = Math.max(1, Number(opts.group) || 0);
    var words = String(text).trim().split(/\s+/).filter(Boolean);
    if (!words.length) words = ["your", "caption"];
    var counter = { n: 0, w: 0 };
    var emojiAt = Math.min(2, words.length - 1);

    function wordHTML(word, localIndex, globalIndex) {
      var html = p.anim === "wave"
        ? letterise(word, counter)
        : '<span class="w" style="--i:' + (counter.w++) + '">' + esc(word) + "</span>";
      if (p.anim === "emoji" && (globalIndex == null ? localIndex : globalIndex) === emojiAt) {
        html += '<span class="emo" style="--i:' + (counter.w++) + '" aria-hidden="true">\uD83D\uDD25</span>';
      }
      return html;
    }

    var chunks = [];
    if (p.anim === "ticker") {
      // three copies make a seamless-looking ticker inside a small frame
      var one = words.map(function (w, i) { return wordHTML(w, i, i); }).join("");
      chunks = [one, one, one];
    } else if (p.anim === "stack" || group > 0) {
      var rows = [];
      for (var i = 0; i < words.length; i += group || 1) {
        rows.push('<span class="cap-row">' + words.slice(i, i + (group || 1)).map(function (w, k) {
          return wordHTML(w, k, i + k);
        }).join("") + "</span>");
      }
      chunks = rows;
    } else {
      chunks = words.map(function (w, i) { return wordHTML(w, i, i); });
    }

    var cls = "cap-line" + (p.anim === "stack" || group > 0 ? " grouped" : "");
    var html = '<div class="' + cls + '">' + chunks.join("") + "</div>";
    if (p.anim === "underline") {
      html = '<div class="' + cls + '">' + chunks.join("") +
        '<svg class="cap-ul" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6 C 52 1, 148 1, 198 6"/></svg></div>';
    }
    return html;
  }

  function paintStage(stage, p, text) {
    stage.className = "cap-stage fx-" + p.anim;
    stage.style.setProperty("--ff", fontStack(p.font));
    stage.style.setProperty("--fw", p.weight || 700);
    stage.style.setProperty("--c-text", p.text || "#FFFFFF");
    stage.style.setProperty("--c-hi", p.hi || "#FDE047");
    stage.style.setProperty("--c-stroke", p.stroke || p.text || "#FFFFFF");
    stage.style.setProperty("--sw", (p.sw || 1.6) + "px");
    stage.style.setProperty("--ls", p.ls || "0");
    stage.style.setProperty("--tt", p.tt || "uppercase");
    stage.style.setProperty("--dur", (p.dur || 2.4) + "s");
    stage.style.setProperty("--stagger", (p.stagger || 0.15) + "s");
    stage.style.setProperty("--int", "1");
    var wrap = stage.querySelector(".cap-line-wrap");
    wrap.innerHTML = lineHTML(text || p.sample, p, { group: 0 });
    if (p.anim === "vhs") {
      var scan = document.createElement("span");
      scan.className = "cap-scan";
      scan.setAttribute("aria-hidden", "true");
      stage.appendChild(scan);
    }
  }

  /* ---------------------------------------------------------------------
     4. GALLERY
     --------------------------------------------------------------------- */
  var grid = $("capGrid");
  var empty = $("capEmpty");
  var count = $("capCount");
  var tabs = $("capTabs");
  var search = $("capSearch");
  var favToggle = $("capFavToggle");

  tabs.innerHTML = CATS.map(function (c) {
    return '<button class="cap-tab" type="button" data-cat="' + esc(c) + '" aria-pressed="' +
      (c === "All") + '">' + esc(c) + "</button>";
  }).join("");

  function filtered() {
    var q = query.toLowerCase();
    return PRESETS.filter(function (p) {
      if (showFavs && favs.indexOf(p.id) < 0) return false;
      if (activeCat !== "All" && p.cat !== activeCat) return false;
      if (!q) return true;
      return (p.name + " " + p.cat + " " + p.tags + " " + p.anim).toLowerCase().indexOf(q) >= 0;
    });
  }

  function cardHTML(p) {
    var isFav = favs.indexOf(p.id) >= 0;
    var on = p.id === selectedId;
    return '<article class="cap-card" data-id="' + p.id + '" data-selected="' + on + '">' +
      '<div class="cap-stage fx-' + p.anim + '" aria-hidden="true">' +
        '<img class="cap-bg" src="/videos/short-' + (p.id.charCodeAt(0) % 3 + 1) + '.jpg" alt="" loading="lazy" decoding="async">' +
        '<span class="cap-shade"></span><span class="cap-badge">' + esc(p.cat.split("/")[0]) + '</span>' +
        '<div class="cap-line-wrap"></div>' +
      '</div>' +
      '<button class="cap-open" type="button" aria-pressed="' + on + '" aria-label="Preview ' + esc(p.name) + ', ' + esc(p.tags) + '"></button>' +
      '<div class="cap-meta"><div><b>' + esc(p.name) + "</b><small>" + esc(p.tags.split(",")[0]) + "</small></div>" +
      '<button class="cap-star" type="button" data-fav="' + p.id + '" aria-pressed="' + isFav + '" aria-label="' +
      (isFav ? "Remove " : "Add ") + esc(p.name) + (isFav ? " from favourites" : " to favourites") + '">' +
      '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"/></svg></button></div></article>';
  }

  function setPressed(card, on) {
    card.dataset.selected = String(on);
    var open = card.querySelector(".cap-open");
    if (open) open.setAttribute("aria-pressed", String(on));
  }

  function renderGallery(keepFocus) {
    var list = filtered();
    grid.innerHTML = list.map(cardHTML).join("");
    empty.hidden = list.length > 0;
    count.textContent = list.length + (list.length === 1 ? " style" : " styles");
    // paint the sample text into every new stage
    list.forEach(function (p) {
      var card = grid.querySelector('[data-id="' + p.id + '"]');
      if (!card) return;
      paintStage(card.querySelector(".cap-stage"), p, p.sample);
    });
    observeCards();
    if (keepFocus) {
      var first = grid.querySelector(".cap-open");
      if (first) first.focus({ preventScroll: true });
    }
  }

  /* hover, focus, tap and (on touch) the card nearest the middle --------- */
  var cardObserver = null;
  var visibleCards = [];

  function startCard(card) {
    var p = presetById[card.dataset.id];
    if (!p) return;
    ensureFont(p.font);
    var stage = card.querySelector(".cap-stage");
    if (!stage.classList.contains("running")) {
      stage.classList.remove("running");
      void stage.offsetWidth;                          // restart CSS animations
      stage.classList.add("running");
    }
  }
  function stopCard(card) {
    var stage = card.querySelector(".cap-stage");
    if (stage) stage.classList.remove("running");
  }

  function observeCards() {
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(grid.querySelectorAll(".cap-card"), function (c) { c.classList.add("in-view"); });
      return;
    }
    if (!cardObserver) {
      cardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle("in-view", e.isIntersecting);
          var i = visibleCards.indexOf(e.target);
          if (i < 0 && e.isIntersecting) visibleCards.push(e.target);
          if (!e.isIntersecting && i >= 0) visibleCards.splice(i, 1);
        });
        if (coarse) autoRunNearest();
      }, { threshold: [0, 0.25, 0.55, 1], rootMargin: "0px 0px -10% 0px" });
    } else {
      cardObserver.disconnect();
    }
    visibleCards = [];
    Array.prototype.forEach.call(grid.querySelectorAll(".cap-card"), function (c) {
      cardObserver.observe(c);
      watchFont(c);
    });
  }

  /* Load a card's font only when the card comes near the screen. */
  var fontObserver = null;
  function watchFont(card) {
    if (!("IntersectionObserver" in window)) return;
    if (!fontObserver) {
      fontObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var p = presetById[en.target.dataset.id];
          if (p) ensureFont(p.font);
          fontObserver.unobserve(en.target);
        });
      }, { rootMargin: "240px 0px" });
    }
    fontObserver.observe(card);
  }

  var autoQueued = 0;
  function autoRunNearest() {
    if (!coarse || calm) return;
    if (autoQueued) return;
    autoQueued = requestAnimationFrame(function () {
      autoQueued = 0;
      var mid = window.innerHeight / 2;
      var best = null, bestD = Infinity;
      visibleCards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = c; }
      });
      visibleCards.forEach(function (c) { if (c !== best) stopCard(c); });
      if (best) startCard(best);
    });
  }
  window.addEventListener("scroll", autoRunNearest, { passive: true });

  grid.addEventListener("pointerover", function (e) {
    var card = e.target.closest(".cap-card");
    if (card && !coarse) startCard(card);
  });
  grid.addEventListener("pointerout", function (e) {
    var card = e.target.closest(".cap-card");
    if (!card || coarse) return;
    if (card.contains(e.relatedTarget)) return;
    stopCard(card);
  });
  grid.addEventListener("focusin", function (e) {
    var card = e.target.closest(".cap-card");
    if (card) startCard(card);
  });
  grid.addEventListener("focusout", function (e) {
    var card = e.target.closest(".cap-card");
    if (card && !card.contains(e.relatedTarget)) stopCard(card);
  });

  grid.addEventListener("click", function (e) {
    var star = e.target.closest(".cap-star");
    if (star) {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(star.dataset.fav, star);
      return;
    }
    var card = e.target.closest(".cap-card");
    if (!card) return;
    selectPreset(card.dataset.id, true);
    if (coarse) {
      if (card.querySelector(".cap-stage").classList.contains("running")) stopCard(card);
      else { visibleCards.forEach(stopCard); startCard(card); }
    }
  });

  /* filters ------------------------------------------------------------- */
  function setCategory(cat) {
    activeCat = cat;
    Array.prototype.forEach.call(tabs.querySelectorAll(".cap-tab"), function (x) {
      x.setAttribute("aria-pressed", String(x.dataset.cat === cat));
    });
  }

  tabs.addEventListener("click", function (e) {
    var b = e.target.closest(".cap-tab");
    if (!b) return;
    setCategory(b.dataset.cat);
    renderGallery();
  });

  var searchTimer = 0;
  search.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      query = search.value.trim();
      // Searching should look everywhere, not only inside the open tab.
      if (query && activeCat !== "All") setCategory("All");
      renderGallery();
    }, 120);
  });

  favToggle.addEventListener("click", function () {
    showFavs = !showFavs;
    favToggle.setAttribute("aria-pressed", String(showFavs));
    renderGallery();
  });

  function toggleFav(id, btn) {
    var at = favs.indexOf(id);
    if (at >= 0) favs.splice(at, 1);
    else favs.push(id);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {}
    btn.setAttribute("aria-pressed", String(at < 0));
    btn.setAttribute("aria-label", (at < 0 ? "Remove " : "Add ") + (presetById[id] ? presetById[id].name : "style") +
      (at < 0 ? " from favourites" : " to favourites"));
    if (showFavs) renderGallery();
  }

  /* ---------------------------------------------------------------------
     5. LIVE PREVIEW
     --------------------------------------------------------------------- */
  var frame = $("capFrame");
  var liveLineWrap = $("capLiveLine");
  var liveBg = $("capLiveBg");
  var textInput = $("capText");
  var ui = {
    font: $("capFontBtn"),
    fontList: $("capFontList"),
    size: $("capSize"), sizeVal: $("capSizeVal"),
    weight: $("capWeight"), weightVal: $("capWeightVal"),
    textColor: $("capTextColor"), textHex: $("capTextHex"),
    hiColor: $("capHiColor"), hiHex: $("capHiHex"),
    strokeColor: $("capStrokeColor"), strokeHex: $("capStrokeHex"),
    stroke: $("capStroke"), strokeVal: $("capStrokeVal"),
    shadow: $("capShadow"),
    box: $("capBox"), boxColor: $("capBoxColor"),
    spacing: $("capSpacing"), spacingVal: $("capSpacingVal"),
    upper: $("capUpper"),
    speed: $("capSpeed"), speedVal: $("capSpeedVal"),
    intensity: $("capIntensity"), intensityVal: $("capIntensityVal"),
    position: $("capPosition"),
    align: $("capAlign"),
    wpl: $("capWpl")
  };
  var styleState = {};
  var currentPreset = presetById[selectedId];
  var liveTimer = 0;

  function shadowValue(kind, hi) {
    if (kind === "soft") return "0 2px 12px rgba(0,0,0,.55)";
    if (kind === "glow") return "0 0 14px " + hi + ", 0 0 34px " + hi;
    if (kind === "hard") return "3px 3px 0 #0B0713, 6px 6px 0 rgba(0,0,0,.35)";
    return "none";
  }

  function configFromUI() {
    var p = currentPreset || presetById.ember;
    var text = textInput.value.trim() || p.sample;
    var speed = Number(ui.speed.value) || 1;
    return {
      id: p.id,
      name: p.name,
      category: p.cat,
      animation: p.anim,
      font: ui.font.dataset.font || p.font,
      fontWeight: Number(ui.weight.value) || p.weight,
      fontSize: Number(ui.size.value) || 48,
      textColor: ui.textColor.value,
      highlightColor: ui.hiColor.value,
      strokeColor: ui.strokeColor.value,
      strokeWidth: Number(ui.stroke.value) || 0,
      shadow: ui.shadow.value,
      box: ui.box.checked,
      boxColor: ui.boxColor.value,
      letterSpacing: (Number(ui.spacing.value) / 100).toFixed(3) + "em",
      uppercase: ui.upper.checked,
      speed: speed,
      intensity: Number(ui.intensity.value) / 100,
      position: ui.position.value,
      align: ui.align.value,
      wordsPerLine: Number(ui.wpl.value) || 3,
      sampleText: text
    };
  }

  function applyConfigToUI(c) {
    if (!c) return;
    currentPreset = presetById[c.id] || currentPreset;
    if (fontByName[c.font]) { ensureFont(c.font); setFontButton(c.font); }
    if (c.fontSize) ui.size.value = c.fontSize;
    if (c.fontWeight) ui.weight.value = c.fontWeight;
    if (c.textColor) ui.textColor.value = c.textColor;
    if (c.highlightColor) ui.hiColor.value = c.highlightColor;
    if (c.strokeColor) ui.strokeColor.value = c.strokeColor;
    if (c.strokeWidth != null) ui.stroke.value = c.strokeWidth;
    if (c.shadow) ui.shadow.value = c.shadow;
    if (c.box != null) ui.box.checked = !!c.box;
    if (c.boxColor) ui.boxColor.value = c.boxColor;
    if (c.letterSpacing) ui.spacing.value = Math.round(parseFloat(c.letterSpacing) * 100) || 0;
    if (c.uppercase != null) ui.upper.checked = !!c.uppercase;
    if (c.speed) ui.speed.value = c.speed;
    if (c.intensity != null) ui.intensity.value = Math.round(c.intensity * 100);
    if (c.position) ui.position.value = c.position;
    if (c.align) ui.align.value = c.align;
    if (c.wordsPerLine) ui.wpl.value = c.wordsPerLine;
    if (c.sampleText) textInput.value = c.sampleText;
    syncLabels();
  }

  function syncLabels() {
    ui.sizeVal.textContent = ui.size.value + "px";
    ui.weightVal.textContent = ui.weight.value;
    ui.textHex.textContent = ui.textColor.value.toUpperCase();
    ui.hiHex.textContent = ui.hiColor.value.toUpperCase();
    ui.strokeHex.textContent = ui.strokeColor.value.toUpperCase();
    ui.strokeVal.textContent = Number(ui.stroke.value).toFixed(1) + "px";
    ui.spacingVal.textContent = Number(ui.spacing.value) / 100 + "em";
    ui.speedVal.textContent = Number(ui.speed.value).toFixed(1) + "\u00D7";
    ui.intensityVal.textContent = ui.intensity.value + "%";
  }

  function paintLive(restart) {
    var c = configFromUI();
    styleState = c;
    var p = currentPreset || presetById.ember;
    var speed = Number(c.speed) || 1;
    frame.dataset.ratio = frame.dataset.ratio || "9x16";
    frame.dataset.pos = c.position;
    frame.dataset.align = c.align;
    frame.className = "cap-frame fx-" + c.animation;
    frame.style.setProperty("--c-text", c.textColor);
    frame.style.setProperty("--c-hi", c.highlightColor);
    frame.style.setProperty("--c-stroke", c.strokeColor);
    frame.style.setProperty("--sw", c.strokeWidth + "px");
    frame.style.setProperty("--ff", fontStack(c.font));
    frame.style.setProperty("--fw", c.fontWeight);
    frame.style.setProperty("--fs", c.fontSize);
    frame.style.setProperty("--ls", c.letterSpacing);
    frame.style.setProperty("--tt", c.uppercase ? "uppercase" : "none");
    frame.style.setProperty("--ts", shadowValue(c.shadow, c.highlightColor));
    frame.style.setProperty("--box", c.box ? c.boxColor : "transparent");
    frame.style.setProperty("--radius", c.box ? "10px" : "0");
    frame.style.setProperty("--pad", c.box ? "0.18em 0.4em" : "0");
    frame.style.setProperty("--dur", ((p.dur || 2.4) / speed) + "s");
    frame.style.setProperty("--stagger", ((p.stagger || 0.15) / speed) + "s");
    frame.style.setProperty("--int", c.intensity);

    liveLineWrap.innerHTML = lineHTML(c.sampleText, { anim: c.animation, sample: c.sampleText },
      { group: (c.animation === "oneword" || c.animation === "ticker") ? 0 : c.wordsPerLine });
    var line = liveLineWrap.querySelector(".cap-line");
    if (line) line.classList.toggle("has-box", c.box);

    if (restart && !calm) {
      frame.classList.remove("running");
      void frame.offsetWidth;
      frame.classList.add("running");
    }
  }

  function queuePaint(restart) {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { paintLive(restart !== false); }, 90);
  }

  /* font picker --------------------------------------------------------- */
  function renderFontList() {
    var groups = {};
    FONTS.forEach(function (f) { (groups[f.cat] = groups[f.cat] || []).push(f); });
    var html = "";
    Object.keys(groups).forEach(function (cat) {
      html += '<div class="cap-fontgroup">' + esc(cat) + "</div>";
      groups[cat].forEach(function (f) {
        html += '<button class="cap-font" type="button" data-font="' + esc(f.name) + '" aria-pressed="' +
          (ui.font.dataset.font === f.name) + '" style="font-family:' + f.stack + '">' +
          esc(f.name) + "<small>" + esc(cat) + "</small></button>";
      });
    });
    ui.fontList.innerHTML = html;
  }

  function setFontButton(name) {
    ui.font.dataset.font = name;
    ui.font.querySelector(".nm").textContent = name;
    ui.font.querySelector(".nm").style.fontFamily = fontStack(name);
    Array.prototype.forEach.call(ui.fontList.querySelectorAll(".cap-font"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.font === name));
    });
  }

  ui.font.addEventListener("click", function () {
    var open = ui.font.getAttribute("aria-expanded") === "true";
    ui.font.setAttribute("aria-expanded", String(!open));
    ui.fontList.hidden = open;
    if (!open) {
      var sel = ui.fontList.querySelector('[aria-pressed="true"]');
      if (sel) sel.focus({ preventScroll: true });
    }
  });

  ui.fontList.addEventListener("pointerover", function (e) {
    var b = e.target.closest(".cap-font");
    if (b) ensureFont(b.dataset.font);
  });
  ui.fontList.addEventListener("focusin", function (e) {
    var b = e.target.closest(".cap-font");
    if (b) ensureFont(b.dataset.font);
  });
  ui.fontList.addEventListener("click", function (e) {
    var b = e.target.closest(".cap-font");
    if (!b) return;
    ensureFont(b.dataset.font, function () { paintLive(true); });
    setFontButton(b.dataset.font);
    ui.font.setAttribute("aria-expanded", "false");
    ui.fontList.hidden = true;
    ui.font.focus();
    queuePaint(true);
  });
  document.addEventListener("click", function (e) {
    if (!ui.font.contains(e.target) && !ui.fontList.contains(e.target)) {
      ui.font.setAttribute("aria-expanded", "false");
      ui.fontList.hidden = true;
    }
  });
  ui.fontList.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    ui.font.setAttribute("aria-expanded", "false");
    ui.fontList.hidden = true;
    ui.font.focus();
    e.stopPropagation();
  });

  /* controls ------------------------------------------------------------ */
  ["input", "change"].forEach(function (evt) {
    root.addEventListener(evt, function (e) {
      if (!e.target.closest(".cap-controls") && e.target !== textInput) return;
      syncLabels();
      queuePaint(true);
    });
  });

  $("capReplay").addEventListener("click", function () {
    paintLive(true);
    if (calm) { frame.classList.remove("running"); }
  });

  $("capReset").addEventListener("click", function () {
    setPreset(currentPreset.id, true);
    paintLive(true);
    toast("Preview reset to " + currentPreset.name + ".");
  });

  Array.prototype.forEach.call(document.querySelectorAll(".cap-ratio button"), function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".cap-ratio button"), function (x) {
        x.classList.toggle("on", x === b);
      });
      frame.dataset.ratio = b.dataset.ratio;
      paintLive(true);
    });
  });

  /* selecting a preset -------------------------------------------------- */
  function setPreset(id, updateUI) {
    var p = presetById[id] || presetById.ember;
    currentPreset = p;
    selectedId = p.id;
    ensureFont(p.font);
    if (updateUI !== false) {
      ui.size.value = 48;
      ui.weight.value = p.weight || 700;
      ui.textColor.value = p.text || "#FFFFFF";
      ui.hiColor.value = p.hi || "#FDE047";
      ui.strokeColor.value = p.stroke || "#FFFFFF";
      ui.stroke.value = p.sw || 0;
      ui.shadow.value = p.anim === "neon" || p.anim === "shine" ? "glow" : "none";
      ui.box.checked = p.anim === "pill";
      ui.boxColor.value = "#111827";
      ui.spacing.value = p.ls ? Math.round(parseFloat(p.ls) * 100) || 0 : 0;
      ui.upper.checked = (p.tt || "uppercase") !== "lowercase";
      ui.speed.value = 1;
      ui.intensity.value = 100;
      ui.position.value = "bottom";
      ui.align.value = "center";
      ui.wpl.value = 3;
      textInput.value = p.sample;
      ui.font.dataset.font = p.font;
      setFontButton(p.font);
      syncLabels();
    }
    Array.prototype.forEach.call(grid.querySelectorAll(".cap-card"), function (c) {
      setPressed(c, c.dataset.id === selectedId);
    });
    var name = $("capSelectedName");
    if (name) name.textContent = p.name;
  }

  function selectPreset(id, scroll) {
    setPreset(id, true);
    paintLive(true);
    if (scroll) {
      // bring the live stage into view without yanking the page on desktop
      var studio = $("capStudio");
      if (studio && window.innerWidth < 960) {
        studio.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
      }
    }
  }

  /* ---------------------------------------------------------------------
     6. APPLY + JSON + BACKEND HOOK
     --------------------------------------------------------------------- */
  function toast(message) {
    var t = $("capToast");
    if (!t) return;
    $("capToastMsg").textContent = message;
    t.classList.add("on");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove("on"); }, 3600);
  }

  function saveStyle(c) {
    try { localStorage.setItem(STYLE_KEY, JSON.stringify(c)); } catch (e) {}
    window.SAC_CAPTION_STYLE = c;
    var pre = $("capJson");
    if (pre) pre.textContent = JSON.stringify(c, null, 2);
    var details = $("capJsonBox");
    if (details) details.open = true;
    window.dispatchEvent(new CustomEvent("saccaptionstyle", { detail: c }));
    var endpoint = root.dataset.endpoint;
    if (endpoint) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(c)
      }).catch(function () { /* the studio still works offline */ });
    }
    return c;
  }

  function applyStyle() {
    var c = saveStyle(configFromUI());
    Array.prototype.forEach.call(grid.querySelectorAll(".cap-card"), function (x) {
      setPressed(x, x.dataset.id === c.id);
    });
    toast(c.name + " applied \u2014 the clip renderer can now pick up this style.");
  }

  window.applyCaptionStyle = function (cfg) {
    if (cfg && typeof cfg === "object") {
      applyConfigToUI(cfg);
      paintLive(true);
    }
    return saveStyle(configFromUI());
  };
  window.getCaptionStyle = function () {
    return styleState && styleState.id ? styleState : configFromUI();
  };

  $("capApply").addEventListener("click", applyStyle);

  /* ---------------------------------------------------------------------
     7. BOOT
     --------------------------------------------------------------------- */
  renderFontList();
  renderGallery();
  setPreset("ember", true);
  paintLive(true);
  ui.size.value = 48;
  syncLabels();

  // restore the last applied style, if this browser has one
  try {
    var saved = JSON.parse(localStorage.getItem(STYLE_KEY) || "null");
    if (saved && saved.id && presetById[saved.id]) {
      setPreset(saved.id, true);
      applyConfigToUI(saved);
      paintLive(true);
      var pre = $("capJson");
      if (pre) pre.textContent = JSON.stringify(saved, null, 2);
    }
  } catch (e) {}

  /* keep the exposed JSON in sync while the user tweaks */
  var jsonTimer = 0;
  root.addEventListener("input", function () {
    clearTimeout(jsonTimer);
    jsonTimer = setTimeout(function () {
      var pre = $("capJson");
      if (pre) pre.textContent = JSON.stringify(configFromUI(), null, 2);
    }, 160);
  });
})();
