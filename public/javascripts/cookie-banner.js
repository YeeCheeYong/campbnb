// public/javascripts/cookie-banner.js
(function () {
  var BANNER_KEY = "cookie-banner-dismissed";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var banner = document.getElementById("cookie-banner");
    var okBtn = document.getElementById("cookie-banner-ok");

    if (!banner || !okBtn) return;

    try {
      var dismissed = window.localStorage.getItem(BANNER_KEY);
      if (!dismissed) {
        banner.style.display = "flex";
      }
    } catch (e) {
      // localStorage might be blocked; in that case just show the banner
      banner.style.display = "flex";
    }

    okBtn.addEventListener("click", function () {
      try {
        window.localStorage.setItem(BANNER_KEY, "true");
      } catch (e) { /* ignore */ }

      banner.style.display = "none";
    });
  });
})();
