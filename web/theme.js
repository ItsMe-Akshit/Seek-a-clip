/* Seek-a-clip theme controller — Obsidian Violet */
(function () {
  var KEY = "sac-theme";
  var choices = ["light", "system", "dark"];
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  var icons = {
    light: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,136H24a8,8,0,0,0,0,16H48a8,8,0,0,0,0-16Zm80-88a8,8,0,0,0,8-8V16a8,8,0,0,0-16,0V40A8,8,0,0,0,128,48Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V136A8,8,0,0,0,208,128ZM128,208a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Z"/></svg>',
    system: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M208,40H48A24,24,0,0,0,24,64V176a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Zm-16,48a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,224Z"/></svg>',
    dark: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M236.37,139.4a12,12,0,0,0-12-3A84.07,84.07,0,0,1,119.6,31.59a12,12,0,0,0-15.54-15.53A100.16,100.16,0,0,0,68.49,187.51,100.16,100.16,0,0,0,239.4,151.36,12,12,0,0,0,236.37,139.4ZM128,216a88,88,0,0,1-62.24-150.24,8,8,0,0,1,13.3,2.9,100.09,100.09,0,0,0,126,126,8,8,0,0,1,2.9,13.3A87.61,87.61,0,0,1,128,216Z"/></svg>'
  };
  var names = { light: "Light mode", system: "System mode", dark: "Dark mode" };

  function saved() {
    try {
      var fromUrl = new URLSearchParams(location.search).get("theme");
      if (choices.indexOf(fromUrl) >= 0) { localStorage.setItem(KEY, fromUrl); return fromUrl; }
      var v = localStorage.getItem(KEY); return choices.indexOf(v) >= 0 ? v : "dark";
    }
    catch (e) { return "dark"; }
  }
  function resolved(choice) {
    if (choice === "system") return media && media.matches ? "dark" : "light";
    return choice;
  }
  function apply(choice, animate) {
    var theme = resolved(choice);
    var root = document.documentElement;
    if (animate) {
      root.classList.add("theme-anim");
      clearTimeout(root._sacThemeTimer);
      root._sacThemeTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 340);
    }
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#08070D" : "#FAF9FF");
    document.querySelectorAll("[data-theme-switch] button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.choice === choice));
      b.title = names[b.dataset.choice] + (b.dataset.choice === choice ? " (selected)" : "");
    });
    try { window.dispatchEvent(new CustomEvent("sacthemechange", { detail: { choice: choice, theme: theme } })); } catch (e) {}
  }
  function set(choice) {
    var c = choices.indexOf(choice) >= 0 ? choice : "dark";
    try { localStorage.setItem(KEY, c); } catch (e) {}
    apply(c, true);
  }
  function build(el) {
    el.classList.add("theme-switch");
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "Colour theme");
    el.innerHTML = choices.map(function (c) {
      return '<button type="button" data-choice="' + c + '" aria-label="' + names[c] + '" aria-pressed="false">' + icons[c] + "</button>";
    }).join("");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-choice]");
      if (b) set(b.dataset.choice);
    });
  }

  function boot() {
    var choice = saved();
    apply(choice, false);
    document.querySelectorAll("[data-theme-switch]").forEach(build);
    apply(choice, false);
    document.querySelectorAll("[data-theme-switch]").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        var next = choices[(choices.indexOf(saved()) + (e.key === "ArrowRight" ? 1 : choices.length - 1)) % choices.length];
        set(next);
        var b = el.querySelector('button[data-choice="' + next + '"]'); if (b) b.focus();
      });
    });
    if (media) {
      var onSystem = function () { if (saved() === "system") apply("system", true); };
      if (media.addEventListener) media.addEventListener("change", onSystem);
      else if (media.addListener) media.addListener(onSystem);
    }
  }

  window.SacTheme = { set: set, get: saved, resolved: function () { return resolved(saved()); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
