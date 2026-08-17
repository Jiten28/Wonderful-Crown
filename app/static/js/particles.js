/* =====================================================
   PARTICLE BACKGROUND (adapted from the supplied reference
   main.js/style.css — vanilla Canvas2D, no build step).

   Adaptation notes vs. the reference:
   - The reference canvas is position:fixed and sized to the
     viewport. Here .particle-zone is defined once in base.html,
     wrapping navbar + content + footer on every page, and the
     canvas is absolutely positioned to that wrapper's full
     rendered height instead — so it's genuinely site-wide with
     no per-template duplication and no seam, while still not
     requiring position:fixed.
   - Mouse coordinates are converted from viewport-relative
     (event.clientX/Y) to canvas-local via the canvas's own
     getBoundingClientRect(), recomputed on every move so it
     stays correct across scroll and resize.
   - Colors are read live from the active theme's CSS custom
     properties instead of a hardcoded hex array, so particles
     match light/dark mode automatically.
   - Sizing waits for document.fonts.ready before the first
     createParticles() call, and a ResizeObserver on .particle-zone
     supplements window.resize — fixes particles spawning clustered
     top-left on load (was measuring the zone before web fonts
     finished loading and the layout settled).
   - A page can opt into a lower-density variant for content-heavy
     screens (dashboard, prediction results, analytics tables) by
     adding data-particle-density="low" to <body>, so the effect
     doesn't compete with reading data. This is a judgment call,
     not explicitly specified — flagging it as such.
   - Everything else (drift, edge bounce, ~130px repulsion with
     proximity-scaled force, smooth easing back, no connecting
     lines) is unchanged from the reference behavior.
===================================================== */

(function () {
  var canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  var zone = canvas.closest(".particle-zone");
  if (!zone) return;

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // No particle motion for users who've asked for reduced motion.
    // The zone's own CSS background (hero navy + glow) still applies.
    return;
  }

  var isMobile = window.matchMedia("(max-width: 768px)").matches;
  var lowDensity = document.body.getAttribute("data-particle-density") === "low";

  var ctx = canvas.getContext("2d");

  var particles = [];
  var mouse = { x: null, y: null, radius: 130 };

  function readPaletteColors() {
    var styles = getComputedStyle(document.documentElement);
    var names = ["--primary", "--secondary", "--primary-light"];
    return names
      .map(function (name) {
        var v = styles.getPropertyValue(name).trim();
        return v || null;
      })
      .filter(Boolean);
  }

  var colors = readPaletteColors();

  // ------------------------------------------------------------
  // CANVAS SIZE — sized to the .particle-zone wrapper, not the
  // viewport (this is the main structural change from the
  // reference; see notes above).
  // ------------------------------------------------------------

  function resizeCanvas() {
    var rect = zone.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    createParticles();
  }

  // --- TEMPORARY DEBUG LOGGING (item 5 — seam investigation) ---
  // Compares the canvas's internal drawing buffer height against the
  // .particle-zone wrapper's actual current rendered height. If these
  // ever diverge, particles are being placed/bounded against a stale
  // size — that's the seam. Remove once the cause is confirmed.
  function logSeamDebug(source) {
    var liveRect = zone.getBoundingClientRect();
    var diff = liveRect.height - canvas.height;
    console.log(
      "[particle-seam-debug] " + source +
      " | canvas.height=" + canvas.height +
      " zone.rect.height=" + liveRect.height.toFixed(1) +
      " diff=" + diff.toFixed(1) +
      (Math.abs(diff) > 1 ? "  <-- MISMATCH" : "")
    );
  }

  window.addEventListener("resize", function () {
    resizeCanvas();
    logSeamDebug("window resize (after resizeCanvas)");
  });

  window.addEventListener(
    "scroll",
    function () {
      logSeamDebug("scroll");
    },
    { passive: true }
  );

  // ResizeObserver catches layout shifts window.resize alone would
  // miss — e.g. content pushing .particle-zone taller after images/
  // fonts settle, or a flash message appearing/dismissing.
  if (typeof ResizeObserver !== "undefined") {
    var resizeObserver = new ResizeObserver(function () {
      resizeCanvas();
      logSeamDebug("ResizeObserver (after resizeCanvas)");
    });
    resizeObserver.observe(zone);
  }

  // ------------------------------------------------------------
  // MOUSE — converted to canvas-local coordinates.
  // ------------------------------------------------------------

  window.addEventListener("mousemove", function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    // Only register the mouse when it's actually over this canvas's
    // rendered area — mobile/no-cursor guard is separate (below),
    // this just avoids phantom repulsion from off-canvas movement.
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      mouse.x = x;
      mouse.y = y;
    } else {
      mouse.x = null;
      mouse.y = null;
    }
  });

  window.addEventListener("mouseleave", function () {
    mouse.x = null;
    mouse.y = null;
  });

  // ------------------------------------------------------------
  // CREATE PARTICLES
  // ------------------------------------------------------------

  function createParticles() {
    particles = [];

    // Fewer particles on mobile — cursor interaction isn't
    // meaningful there anyway (see guard below), so this just
    // keeps ambient motion cheap on small/low-power screens.
    var divisor = isMobile ? 16000 : 11000;
    var cap = isMobile ? 50 : 140;

    // Content-heavy pages (dashboard, prediction results, analytics
    // tables) opt into a lighter variant via
    // <body data-particle-density="low"> so the effect stays
    // ambient rather than competing with data on screen.
    if (lowDensity) {
      divisor *= 3;
      cap = Math.round(cap * 0.3);
    }

    var count = Math.min(
      cap,
      Math.floor((canvas.width * canvas.height) / divisor)
    );

    // Particles read as visually louder in light mode — a saturated
    // dot has more contrast against a light/white glass card than
    // the same dot does against a dark one. Knock opacity down
    // further specifically for light theme, on top of any
    // low-density reduction.
    var isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    var themeOpacityMultiplier = isLight ? 0.55 : 1;

    for (let i = 0; i < count; i++) {
      var startX = Math.random() * canvas.width;
      var startY = Math.random() * canvas.height;

      particles.push({
        x: startX,
        y: startY,
        baseX: startX,
        baseY: startY,
        size: Math.random() * 2.5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity:
          (Math.random() * 0.35 + 0.45) *
          themeOpacityMultiplier *
          (lowDensity ? 0.5 : 1),
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        // These are the easing logic's running target in
        // updateParticles() — a particle "chases" offsetX/offsetY
        // every frame. Initializing them to 0 (the canvas origin)
        // instead of the particle's own starting position was the
        // actual cause of particles visibly traveling in from the
        // top-left on every createParticles() call (page load,
        // resize, theme toggle): each particle spent its first
        // several frames being pulled toward (0,0) before the
        // easing caught up to where it actually belonged. Starting
        // both at the particle's own position means there's nothing
        // to visibly travel from — it's already "at rest" on the
        // very first drawn frame.
        offsetX: startX,
        offsetY: startY,
      });
    }
  }

  // ------------------------------------------------------------
  // UPDATE PARTICLES
  // ------------------------------------------------------------

  function updateParticles() {
    for (const p of particles) {
      p.baseX += p.vx;
      p.baseY += p.vy;

      if (p.baseX < 0 || p.baseX > canvas.width) {
        p.vx *= -1;
      }

      if (p.baseY < 0 || p.baseY > canvas.height) {
        p.vy *= -1;
      }

      let targetX = p.baseX;
      let targetY = p.baseY;

      // No meaningful cursor on mobile — skip repulsion there
      // entirely rather than reacting to touch coordinates.
      if (!isMobile && mouse.x !== null && mouse.y !== null) {
        const dx = p.baseX - mouse.x;
        const dy = p.baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius && distance > 0) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          const push = force * 55;

          targetX = p.baseX + Math.cos(angle) * push;
          targetY = p.baseY + Math.sin(angle) * push;
        }
      }

      p.offsetX += (targetX - p.x) * 0.08;
      p.offsetY += (targetY - p.y) * 0.08;

      p.x += (p.offsetX - p.x) * 0.08;
      p.y += (p.offsetY - p.y) * 0.08;

      p.x += (p.baseX - p.x) * 0.01;
      p.y += (p.baseY - p.y) * 0.01;
    }
  }

  // ------------------------------------------------------------
  // DRAW
  // ------------------------------------------------------------

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  // ANIMATION LOOP
  // ------------------------------------------------------------

  var rafId = null;

  function animate() {
    updateParticles();
    drawParticles();
    rafId = requestAnimationFrame(animate);
  }

  // Re-read colors if the user flips light/dark mode.
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      setTimeout(function () {
        colors = readPaletteColors();
        createParticles();
      }, 50);
    });
  }

  // Wait for web fonts to finish loading before the FIRST sizing
  // pass — otherwise getBoundingClientRect() measures the zone
  // before layout has settled (fonts not yet swapped in can change
  // text height/wrapping), producing a smaller/wrong box: particles
  // spawn clustered in that smaller area, then visibly jump/spread
  // once a later resize corrects it. document.fonts.ready resolves
  // once all fonts are loaded and the current frame is stable.
  var fontsReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

  fontsReady.then(function () {
    resizeCanvas();
    logSeamDebug("initial load (after fonts.ready)");
    animate();
  });
})();
