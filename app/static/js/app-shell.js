/* =====================================================
   APP-SHELL — mobile off-canvas drawer.
   On desktop the rail is always visible (pure CSS); this
   only wires the hamburger, backdrop, close button, nav
   taps, and the Escape key for the <=992px drawer.
===================================================== */

(function () {
  var shell = document.getElementById("appShell");
  if (!shell) return;

  var openBtn = document.getElementById("appHamburger");
  var closeBtn = document.getElementById("appDrawerClose");
  var backdrop = document.getElementById("appDrawerBackdrop");

  function openDrawer() {
    shell.classList.add("drawer-open");
  }

  function closeDrawer() {
    shell.classList.remove("drawer-open");
  }

  if (openBtn) openBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // Navigating (or opening the profile card) closes the drawer on mobile.
  var links = document.querySelectorAll(".app-nav__link, .app-usercard");
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("click", closeDrawer);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });
})();
