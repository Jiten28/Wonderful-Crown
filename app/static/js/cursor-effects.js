/* =====================================================
   CURSOR-REACTIVE BACKGROUND (Vanta.js "Dots")
   Scoped to pages with a #vanta-bg element (landing, auth).
   Two-layer structure:
     - background: this canvas, fixed/behind, pointer-events tracked
     - foreground: normal page content, untouched in layout terms
   Respects prefers-reduced-motion (skips entirely) and disables
   the continuous WebGL effect on mobile via scaleMobile.
===================================================== */

(function () {
  var target = document.getElementById("vanta-bg");
  if (!target) return;

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Leave a static, subtle themed backdrop instead of the animated effect.
    target.style.background =
      "radial-gradient(circle at 75% 20%, var(--glow-primary), transparent 45%)";
    return;
  }

  function readPaletteColors() {
    var styles = getComputedStyle(document.documentElement);
    // Vanta needs numeric hex ints, not CSS var strings — resolve via a probe element.
    function hexToInt(hex) {
      hex = hex.trim().replace("#", "");
      if (hex.length === 3) {
        hex = hex
          .split("")
          .map(function (c) {
            return c + c;
          })
          .join("");
      }
      return parseInt(hex, 16);
    }

    var probe = document.createElement("div");
    probe.style.display = "none";
    document.body.appendChild(probe);

    probe.style.color = styles.getPropertyValue("--primary").trim();
    var primaryRgb = getComputedStyle(probe).color;

    probe.style.color = styles.getPropertyValue("--bg").trim();
    var bgRgb = getComputedStyle(probe).color;

    document.body.removeChild(probe);

    function rgbToInt(rgb) {
      var m = rgb.match(/\d+/g);
      if (!m) return 0x12b3a8;
      return (parseInt(m[0]) << 16) + (parseInt(m[1]) << 8) + parseInt(m[2]);
    }

    return {
      dotColor: rgbToInt(primaryRgb),
      bgColor: rgbToInt(bgRgb),
    };
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  loadScript("https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js")
    .then(function () {
      return loadScript(
        "https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.dots.min.js"
      );
    })
    .then(function () {
      if (!window.VANTA) return;

      var colors = readPaletteColors();

      window.__vantaEffect = window.VANTA.DOTS({
        el: target,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: isMobile ? 0.6 : 1.0,
        color: colors.dotColor,
        color2: colors.dotColor,
        backgroundColor: colors.bgColor,
        size: isMobile ? 2.2 : 3.2,
        spacing: isMobile ? 30.0 : 24.0,
        showLines: true,
      });

      // Keep colors correct if the user flips light/dark mode after init.
      var toggle = document.getElementById("themeToggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          setTimeout(function () {
            if (window.__vantaEffect) {
              var updated = readPaletteColors();
              window.__vantaEffect.setOptions({
                color: updated.dotColor,
                color2: updated.dotColor,
                backgroundColor: updated.bgColor,
              });
            }
          }, 50);
        });
      }
    })
    .catch(function () {
      // CDN failed to load — fall back to the static themed gradient.
      target.style.background =
        "radial-gradient(circle at 75% 20%, var(--glow-primary), transparent 45%)";
    });
})();

/* =====================================================
   HOVER PARALLAX (foreground layer, independent of #5)
   Small, heavily-damped translate on elements marked
   .parallax-el as the cursor moves. Off on touch devices
   and when prefers-reduced-motion is set.
===================================================== */

(function () {
  var els = document.querySelectorAll(".parallax-el");
  if (!els.length) return;

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;

  if (prefersReducedMotion || isTouch) return;

  var state = [];
  els.forEach(function (el) {
    state.push({ el: el, tx: 0, ty: 0, cx: 0, cy: 0 });
  });

  var pointerX = window.innerWidth / 2;
  var pointerY = window.innerHeight / 2;

  window.addEventListener("mousemove", function (e) {
    pointerX = e.clientX;
    pointerY = e.clientY;
  });

  var MAX_OFFSET = 8; // px — quiet depth, not a gimmick
  var EASE = 0.06; // heavily damped

  function tick() {
    state.forEach(function (item) {
      var rect = item.el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;

      var dx = (pointerX - cx) / (window.innerWidth / 2);
      var dy = (pointerY - cy) / (window.innerHeight / 2);

      item.tx = Math.max(-1, Math.min(1, dx)) * MAX_OFFSET;
      item.ty = Math.max(-1, Math.min(1, dy)) * MAX_OFFSET;

      item.cx += (item.tx - item.cx) * EASE;
      item.cy += (item.ty - item.cy) * EASE;

      item.el.style.transform =
        "translate(" + item.cx.toFixed(2) + "px," + item.cy.toFixed(2) + "px)";
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
