gsap.registerPlugin(ScrollTrigger);

/* ===========================
        NAVBAR
=========================== */

window.addEventListener("scroll",()=>{

    const nav=document.getElementById("mainNavbar");

    nav.classList.toggle("scrolled",window.scrollY>40);

});

/* ===========================
        HERO
=========================== */

window.addEventListener("load",()=>{

    const heroTimeline = gsap.timeline({
        defaults:{ ease:"power3.out" }
    });

    heroTimeline
        .from(".hero-row .eyebrow",{
            y:20,
            opacity:0,
            duration:.7
        })
        .from(".hero-row .display-2",{
            y:36,
            opacity:0,
            duration:.9
        },"-=.45")
        .from(".hero-row .lead",{
            y:24,
            opacity:0,
            duration:.8
        },"-=.55")
        .from(".hero-buttons",{
            y:20,
            opacity:0,
            duration:.8
        },"-=.5")
        .from(".hero-stat-strip",{
            y:24,
            opacity:0,
            duration:.9
        },"-=.4");

});