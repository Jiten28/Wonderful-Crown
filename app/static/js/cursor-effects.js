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
