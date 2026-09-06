gsap.registerPlugin(ScrollTrigger);

const wcReduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

/* ===========================
        NAVBAR
=========================== */

const wcNav = document.getElementById("mainNavbar");

if (wcNav) {
    window.addEventListener("scroll", () => {
        wcNav.classList.toggle("scrolled", window.scrollY > 40);
    });
}

/* ===========================
        DIAGNOSTIC CONSOLE — ring fill
   Default (no-JS / reduced-motion) state is already the final
   filled state via the inline --pct, so this only adds the
   0 -> target sweep when motion is allowed.
=========================== */

function wcFillConsoleRing() {
    const ring = document.querySelector("#diagnosticConsole .wc-ring");

    if (!ring) return;

    const target = ring.style.getPropertyValue("--pct") || "0";

    ring.style.setProperty("--pct", "0");

    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            ring.style.setProperty("--pct", target);
        })
    );
}

/* ===========================
        MOTION
   Everything below is intro polish. When the user prefers
   reduced motion we skip it entirely — elements keep their
   natural, fully-visible CSS state.
=========================== */

if (!wcReduceMotion) {
    /* ---- Hero + console load orchestration ---- */

    window.addEventListener("load", () => {
        const dc = document.getElementById("diagnosticConsole");

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".hero-copy .eyebrow", { y: 20, opacity: 0, duration: 0.6 })
            .from(".hero-title", { y: 34, opacity: 0, duration: 0.85 }, "-=.35")
            .from(".hero-lead", { y: 22, opacity: 0, duration: 0.7 }, "-=.5")
            .from(".hero-buttons", { y: 18, opacity: 0, duration: 0.7 }, "-=.45")
            .from(".hero-trust", { y: 16, opacity: 0, duration: 0.6 }, "-=.45");

        if (dc) {
            tl.from(dc, { y: 30, opacity: 0, duration: 0.9 }, "-=.7")
                .from(
                    "#diagnosticConsole .dc-chip",
                    { y: 10, opacity: 0, stagger: 0.08, duration: 0.4 },
                    "-=.4"
                )
                .add(() => {
                    const pulse = dc.querySelector(".wc-pulse");
                    if (pulse) pulse.classList.add("wc-pulse--draw");
                })
                .from(
                    "#diagnosticConsole .dc-result",
                    { y: 14, opacity: 0, duration: 0.5 },
                    "+=.15"
                )
                .add(() => wcFillConsoleRing());
        }
    });

    /* ---- Subtle scroll parallax on the console ---- */

    const visual = document.querySelector(".hero-visual");

    if (visual) {
        gsap.to(visual, {
            yPercent: -8,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom top",
                scrub: true,
            },
        });
    }

    /* ---- Scroll-triggered reveals for lower sections ---- */

    const revealTargets = [
        ".features-section .text-center",
        ".features-section .row",
        ".workflow-section .text-center",
        ".flow",
        ".modules-section .text-center",
        ".module-card",
        ".cta-card",
    ];

    revealTargets.forEach((selector) => {
        gsap.utils.toArray(selector).forEach((el) => {
            gsap.from(el, {
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 85%" },
            });
        });
    });
}
