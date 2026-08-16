/* =====================================================
   PARTICLE BACKGROUND (adapted from the supplied reference
   main.js/style.css — vanilla Canvas2D, no build step).

   Adaptation notes vs. the reference:
   - The reference canvas is position:fixed and sized to the
     viewport (window.innerWidth/innerHeight), because its demo
     page is a single full-screen surface. Here the effect needs
     to span exactly "the hero + the section below it" and stop
     there (per the seam-fix requirement), not bleed behind every
     section down to the footer. So the canvas is instead scoped
     to its nearest .particle-zone ancestor: sized to that
     wrapper's rendered box (not the viewport), and positioned
     absolute (not fixed) so it scrolls with that wrapper.
   - Mouse coordinates are converted from viewport-relative
     (event.clientX/Y) to canvas-local via the canvas's own
     getBoundingClientRect(), recomputed on every move so it
     stays correct across scroll and resize.
   - Colors are read live from the active theme's CSS custom
     properties instead of a hardcoded hex array, so particles
     match light/dark mode automatically.
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

  window.addEventListener("resize", resizeCanvas);

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
    var divisor = isMobile ? 32000 : 22000;
    var cap = isMobile ? 28 : 65;

    var count = Math.min(
      cap,
      Math.floor((canvas.width * canvas.height) / divisor)
    );

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: 0,
        baseY: 0,
        size: Math.random() * 2.5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.35 + 0.45,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        offsetX: 0,
        offsetY: 0,
      });

      var p = particles[particles.length - 1];
      p.baseX = p.x;
      p.baseY = p.y;
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
        particles.forEach(function (p) {
          p.color = colors[Math.floor(Math.random() * colors.length)];
        });
      }, 50);
    });
  }

  resizeCanvas();
  animate();
})();
