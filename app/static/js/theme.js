document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", function () {
    var root = document.documentElement;
    var current = root.getAttribute("data-theme") || "light";
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("wc-theme", next);
    } catch (e) {}
  });
});
