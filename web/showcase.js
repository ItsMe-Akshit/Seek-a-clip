/* ==========================================================================
   Seek-a-clip — Results previews + landing motion
   --------------------------------------------------------------------------
   • lazy video cards with hover / in-view playback
   • one native <dialog> player with focus restore
   • a pointer + keyboard before/after slider
   • small motion extras: nav that steps out of the way, button ripples and
     a very light parallax on the ambient grid

   Everything is progressive: without JS the posters and captions still show.
   ========================================================================== */
(function () {
  "use strict";

  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------------------------------------------------------------
     1. VIDEO CARDS
     --------------------------------------------------------------------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-demo-video]"));

  function loadVideo(card) {
    var video = card.querySelector("video");
    if (!video || video.dataset.loaded === "1") return video;
    video.dataset.loaded = "1";
    if (!video.getAttribute("src")) video.setAttribute("src", card.dataset.src);
    video.load();
    return video;
  }

  function playing(card, on) {
    var box = card.querySelector(".res-video") || card;
    box.classList.toggle("playing", on);
    var btn = card.querySelector(".res-play");
    if (btn) {
      btn.setAttribute("aria-label", on ? "Pause preview" : "Play preview");
      btn.setAttribute("aria-pressed", String(on));
    }
  }

  function play(card, auto) {
    if (auto && calm) return;
    var video = loadVideo(card);
    if (!video) return;
    video.muted = true;                                // never surprise anyone with sound
    var attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(function () {});
    playing(card, true);
  }

  function pause(card) {
    var video = card.querySelector("video");
    if (video && !video.paused) video.pause();
    playing(card, false);
  }

  // Load only when a card is close to the viewport.
  if ("IntersectionObserver" in window) {
    var loader = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        loadVideo(e.target);
        loader.unobserve(e.target);
      });
    }, { rootMargin: "360px 0px" });
    cards.forEach(function (c) { loader.observe(c); });
  } else {
    cards.forEach(loadVideo);
  }

  // Desktop: play while the pointer is over the card, pause when it leaves.
  if (fine && !calm) {
    cards.forEach(function (card) {
      card.addEventListener("pointerenter", function () { play(card, true); });
      card.addEventListener("pointerleave", function () {
        if (!card.dataset.pinned) pause(card);
      });
    });
  }

  // Touch / small screens: play the card that is mostly on screen, pause the rest.
  if (!fine && !calm && "IntersectionObserver" in window) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio >= 0.65) play(e.target, true);
        else if (!e.target.dataset.pinned) pause(e.target);
      });
    }, { threshold: [0, 0.65, 1] });
    cards.forEach(function (c) { watcher.observe(c); });
  }

  // Play / pause button on each card.
  cards.forEach(function (card) {
    var toggle = card.querySelector(".res-play");
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var video = card.querySelector("video");
        var isPlaying = video && !video.paused;
        if (isPlaying) { card.dataset.pinned = ""; pause(card); }
        else { card.dataset.pinned = "1"; play(card); }
      });
    }
    // The whole poster is a large, obvious target for the modal.
    card.addEventListener("click", function (e) {
      if (e.target.closest(".res-play")) return;
      openDemo(card);
    });
  });

  /* ---------------------------------------------------------------------
     2. MODAL PLAYER
     --------------------------------------------------------------------- */
  var dialog = $("resDialog");
  var dialogVideo = $("resDialogVideo");
  var dialogTitle = $("resDialogTitle");
  var dialogNote = $("resDialogNote");
  var dialogTrack = null;
  var opener = null;

  function setDialogTrack(src) {
    if (dialogTrack) { dialogTrack.remove(); dialogTrack = null; }
    if (!src || !dialogVideo) return;
    dialogTrack = document.createElement("track");
    dialogTrack.kind = "captions";
    dialogTrack.srclang = "en";
    dialogTrack.label = "English";
    dialogTrack.default = true;
    dialogTrack.src = src;
    dialogVideo.appendChild(dialogTrack);
  }

  function openDemo(card) {
    if (!dialog || !dialogVideo) return;
    cards.forEach(pause);                               // one video at a time
    opener = document.activeElement;
    dialogTitle.textContent = card.dataset.title || "Preview";
    if (dialogNote) dialogNote.textContent = card.dataset.note || "";
    dialogVideo.poster = card.dataset.poster || "";
    dialogVideo.src = card.dataset.src;
    setDialogTrack(card.dataset.vtt || "");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    var attempt = dialogVideo.play();
    if (attempt && attempt.catch) attempt.catch(function () {});
    var close = dialog.querySelector(".res-dialog-close");
    if (close) close.focus({ preventScroll: true });
  }

  function closeDemo() {
    if (!dialog || !dialogVideo) return;
    dialogVideo.pause();
    // Release the file: keeping six videos buffered is a waste of memory.
    dialogVideo.removeAttribute("src");
    setDialogTrack("");
    dialogVideo.load();
    if (opener && typeof opener.focus === "function") {
      var target = opener;
      setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
    }
    opener = null;
  }

  if (dialog) {
    dialog.addEventListener("close", closeDemo);
    dialog.addEventListener("cancel", function () { /* native Esc closes it */ });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();           // click on the backdrop
    });
  }
  if (dialogVideo) {
    dialogVideo.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  /* ---------------------------------------------------------------------
     3. BEFORE / AFTER SLIDER
     --------------------------------------------------------------------- */
  var ba = $("baCompare");
  if (ba) {
    var handle = ba.querySelector(".ba-handle");
    var dragging = false;
    var split = 54;

    function setSplit(value, announce) {
      split = Math.max(0, Math.min(100, value));
      ba.style.setProperty("--split", split.toFixed(1) + "%");
      if (handle) {
        handle.setAttribute("aria-valuenow", String(Math.round(split)));
        handle.setAttribute("aria-valuetext", Math.round(split) + "% AI clip");
      }
      if (announce) {
        var live = $("baLive");
        if (live) live.textContent = Math.round(split) + "% AI clip";
      }
    }

    function fromPointer(e) {
      var r = ba.getBoundingClientRect();
      setSplit(((e.clientX - r.left) / r.width) * 100, true);
    }

    ba.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      dragging = true;
      ba.classList.add("drag");
      if (handle && handle.setPointerCapture) {
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      }
      fromPointer(e);
      e.preventDefault();
    });
    ba.addEventListener("pointermove", function (e) {
      if (dragging) fromPointer(e);
    });
    ba.addEventListener("pointerup", function () { dragging = false; ba.classList.remove("drag"); });
    ba.addEventListener("pointercancel", function () { dragging = false; ba.classList.remove("drag"); });
    ba.addEventListener("pointerleave", function () {
      if (!dragging) ba.classList.remove("drag");
    });

    if (handle) {
      handle.addEventListener("keydown", function (e) {
        var step = e.shiftKey ? 10 : 2;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setSplit(split - step, true); e.preventDefault(); }
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") { setSplit(split + step, true); e.preventDefault(); }
        else if (e.key === "Home") { setSplit(0, true); e.preventDefault(); }
        else if (e.key === "End") { setSplit(100, true); e.preventDefault(); }
      });
    }
    setSplit(54, false);
  }

  /* ---------------------------------------------------------------------
     4. NAV THAT STEPS OUT OF THE WAY
     --------------------------------------------------------------------- */
  var nav = $("nav");
  var mobileMenu = $("mobile");
  if (nav) {
    var lastY = window.scrollY || 0;
    var travel = 0;
    var queued = 0;
    var hide = function () { nav.classList.add("hide"); };
    var show = function () { nav.classList.remove("hide"); travel = 0; };

    var onScroll = function () {
      if (queued) return;
      queued = requestAnimationFrame(function () {
        queued = 0;
        var y = window.scrollY || 0;
        var dy = y - lastY;
        lastY = y;
        if (mobileMenu && mobileMenu.classList.contains("open")) { show(); return; }
        if (y < 140) { show(); return; }
        if (dy > 0) {
          travel += dy;
          if (travel > 70) hide();
        } else if (dy < 0) {
          travel = 0;
          show();
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("focusin", show);              // never hide from keyboard users
    window.addEventListener("resize", show);
  }

  /* ---------------------------------------------------------------------
     5. BUTTON RIPPLES
     --------------------------------------------------------------------- */
  if (!calm) {
    document.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest(".lx-btn, .res-play, .res-expand, .ba-handle");
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2;
      var ink = document.createElement("span");
      ink.className = "ripple";
      ink.style.width = ink.style.height = size + "px";
      ink.style.left = (e.clientX - r.left) + "px";
      ink.style.top = (e.clientY - r.top) + "px";
      btn.appendChild(ink);
      ink.addEventListener("animationend", function () { ink.remove(); });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     6. A LITTLE PARALLAX ON THE AMBIENT GRID
     --------------------------------------------------------------------- */
  var grid = document.querySelector(".lx-ambient .lx-grid");
  if (grid && !calm) {
    grid.style.transformOrigin = "50% 0";
    var gridQueued = 0;
    var moveGrid = function () {
      gridQueued = 0;
      var y = Math.min(window.scrollY || 0, 4000);
      grid.style.transform = "scale(1.12) translate3d(0," + (y * -0.03).toFixed(1) + "px,0)";
    };
    window.addEventListener("scroll", function () {
      if (!gridQueued) gridQueued = requestAnimationFrame(moveGrid);
    }, { passive: true });
    moveGrid();
  }
})();
