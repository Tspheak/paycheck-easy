(function () {
  var KEY = "pp-price-region";

  function tagIsAU(tag) {
    return /(^|-)AU$/i.test(String(tag || "").replace(/_/g, "-"));
  }

  function isAustralianLocale() {
    var list = navigator.languages && navigator.languages.length
      ? Array.prototype.slice.call(navigator.languages)
      : [navigator.language || ""];
    try { list.push(Intl.DateTimeFormat().resolvedOptions().locale || ""); } catch (e) {}
    for (var i = 0; i < list.length; i++) {
      if (tagIsAU(list[i])) return true;
    }
    return false;
  }

  function isAustralianTimezone() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return tz.indexOf("Australia/") === 0 || tz === "Antarctica/Macquarie";
    } catch (e) {
      return false;
    }
  }

  function savedRegion() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "us" || saved === "au") return saved;
    } catch (e) {}
    return null;
  }

  function defaultRegion() {
    return isAustralianLocale() || isAustralianTimezone() ? "au" : "us";
  }

  function apply(region) {
    document.documentElement.setAttribute("data-region", region);
    var buttons = document.querySelectorAll("[data-region-choice]");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-region-choice") === region;
      buttons[i].setAttribute("aria-checked", on ? "true" : "false");
      buttons[i].tabIndex = on ? 0 : -1;
    }
  }

  function choose(region) {
    try { localStorage.setItem(KEY, region); } catch (e) {}
    apply(region);
  }

  apply(savedRegion() || defaultRegion());

  function bind() {
    var group = document.querySelector(".region-switch");
    if (!group || group.getAttribute("data-bound") === "true") return;
    group.setAttribute("data-bound", "true");
    var buttons = group.querySelectorAll("[data-region-choice]");
    apply(document.documentElement.getAttribute("data-region") || "us");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        choose(this.getAttribute("data-region-choice"));
      });
    }
    group.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      var current = document.documentElement.getAttribute("data-region") === "au" ? "au" : "us";
      choose(current === "us" ? "au" : "us");
      var next = group.querySelector('[data-region-choice="' + (current === "us" ? "au" : "us") + '"]');
      if (next) next.focus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
