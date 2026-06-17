/* =================================================================
   KRAFT PÁDEL CENTER — main.js
   Vanilla JS · IIFE · GSAP + ScrollTrigger + Lenis
   ================================================================= */
(function () {
  "use strict";

  var lenis = null;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  var prefersReduced = false; // intentionally NOT gating micro-interactions (Windows often ON)

  /* ---------------- LENIS SMOOTH SCROLL ---------------- */
  function initLenis() {
    if (typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5
    });

    if (typeof gsap !== "undefined") {
      lenis.on("scroll", function () {
        if (window.ScrollTrigger) ScrollTrigger.update();
      });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }

  /* ---------------- CUSTOM CURSOR ---------------- */
  function initCursor() {
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var mx = 0, my = 0, rx = 0, ry = 0, shown = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      if (!shown) {
        shown = true;
        dot.style.opacity = "1"; ring.style.opacity = "1";
      }
    });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    }
    loop();

    document.querySelectorAll('a, button, [data-cursor="hover"], .slot, .cal-day').forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-hover"); });
    });
  }

  /* ---------------- NAV ---------------- */
  function initNav() {
    var nav = document.getElementById("nav");
    var burger = document.getElementById("navBurger");
    var overlay = document.getElementById("navOverlay");

    function onScroll() {
      var y = (lenis && lenis.scroll) || window.scrollY || window.pageYOffset;
      if (y > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    if (lenis) lenis.on("scroll", onScroll);
    onScroll();

    if (burger && overlay) {
      function close() {
        burger.classList.remove("is-open");
        overlay.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        if (lenis) lenis.start();
      }
      burger.addEventListener("click", function () {
        var open = overlay.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        if (lenis) { open ? lenis.stop() : lenis.start(); }
      });
      overlay.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", close);
      });
    }
  }

  /* ---------------- SPONSORS LOOP ---------------- */
  function initSponsorsLoop() {
    var track = document.getElementById("sponsorsTrack");
    if (!track) return;
    var group = track.querySelector(".sponsors-group");
    if (!group) return;

    var width = group.offsetWidth;
    var speed = 50; // px/sec
    var x = 0, last = null;

    function measure() {
      var w = group.offsetWidth;
      if (w > 0) width = w;
    }
    // los logos son <img>: recalcular cuando carguen y al terminar de cargar la página
    group.querySelectorAll("img").forEach(function (img) {
      if (img.complete) return;
      img.addEventListener("load", measure);
    });
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);

    function step(ts) {
      if (last === null) last = ts;
      var dt = (ts - last) / 1000;
      last = ts;
      x -= speed * dt;
      if (width > 0 && -x >= width) x += width;
      track.style.transform = "translate3d(" + x + "px,0,0)";
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function initMagnetic() {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.22;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform .5s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "translate(0,0)";
        setTimeout(function () { el.style.transition = ""; }, 500);
      });
    });
  }

  /* ---------------- SCROLL PROGRESS ---------------- */
  function initScrollProgress() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var y = (lenis && lenis.scroll) || window.scrollY || window.pageYOffset;
      var p = h > 0 ? (y / h) : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
    }
    window.addEventListener("scroll", update, { passive: true });
    if (lenis) lenis.on("scroll", update);
    update();
  }

  /* ---------------- SMOOTH ANCHORS ---------------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id === "#" || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.3 });
        else target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------------- BOOKING CALENDAR ---------------- */
  function initBooking() {
    var calDays = document.getElementById("calDays");
    var calMonth = document.getElementById("calMonth");
    var slotsGrid = document.getElementById("slotsGrid");
    var summary = document.getElementById("bookingSummary");
    var confirm = document.getElementById("bookingConfirm");
    if (!calDays || !calMonth) return;

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var todayDate = now.getDate();

    var monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    calMonth.textContent = monthNames[month] + " " + year;

    var firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    var offset = (firstDay + 6) % 7; // make Monday=0
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var selectedDay = null, selectedSlot = null;

    for (var i = 0; i < offset; i++) {
      var empty = document.createElement("div");
      empty.className = "cal-day is-empty";
      calDays.appendChild(empty);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal-day";
      cell.textContent = d;
      if (d === todayDate) cell.classList.add("is-today");
      if (d < todayDate) cell.classList.add("is-past");
      (function (day, node) {
        node.addEventListener("click", function () {
          if (node.classList.contains("is-past")) return;
          calDays.querySelectorAll(".cal-day").forEach(function (n) { n.classList.remove("is-selected"); });
          node.classList.add("is-selected");
          selectedDay = day;
          updateSummary();
        });
      })(d, cell);
      calDays.appendChild(cell);
    }

    if (slotsGrid) {
      slotsGrid.querySelectorAll(".slot").forEach(function (s) {
        s.addEventListener("click", function () {
          slotsGrid.querySelectorAll(".slot").forEach(function (n) { n.classList.remove("is-selected"); });
          s.classList.add("is-selected");
          selectedSlot = s.textContent.trim();
          updateSummary();
        });
      });
    }

    var ready = false;

    function updateSummary() {
      ready = !!(selectedDay && selectedSlot);
      if (ready) {
        summary.innerHTML = "Cancha el <strong>" + selectedDay + " de " + monthNames[month] +
          "</strong> a las <strong>" + selectedSlot + "</strong>.";
      } else if (selectedDay) {
        summary.innerHTML = "Día " + selectedDay + " seleccionado. Elegí un horario.";
      } else {
        summary.textContent = "Seleccioná día y horario.";
      }
      if (!confirm) return;
      if (ready) {
        var msg = "Hola, quiero reservar la cancha para el " + selectedDay + " de " +
          monthNames[month] + " en el horario de " + selectedSlot + ". ¿Está disponible?";
        confirm.href = "https://wa.me/59891486190?text=" + encodeURIComponent(msg);
        confirm.classList.remove("is-disabled");
        confirm.removeAttribute("aria-disabled");
      } else {
        // sin día y hora: deshabilitado hasta que se complete
        confirm.href = "#reserva";
        confirm.classList.add("is-disabled");
        confirm.setAttribute("aria-disabled", "true");
      }
    }

    // estado inicial: botón deshabilitado
    if (confirm) {
      confirm.classList.add("is-disabled");
      confirm.setAttribute("aria-disabled", "true");
      confirm.addEventListener("click", function (e) {
        if (!ready) {
          e.preventDefault();
          summary.classList.remove("shake"); void summary.offsetWidth; // reinicia animación
          summary.classList.add("shake");
          summary.textContent = "Elegí un día y un horario para confirmar.";
        }
      });
    }
  }

  /* ---------------- REVEAL FALLBACK (IO) ---------------- */
  function initRevealFallback() {
    // Used only if GSAP is unavailable. Otherwise GSAP handles reveals.
    if (typeof gsap !== "undefined" && window.ScrollTrigger) return;
    var els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-revealed"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- GSAP (reveals, split, hero, parallax, count) ---------------- */
  function initGSAP() {
    if (typeof gsap === "undefined" || !window.ScrollTrigger) {
      // ensure everything is visible
      document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    /* --- Split text into words --- */
    document.querySelectorAll(".split-words").forEach(function (el) {
      if (el.dataset.split === "done") return;
      el.dataset.split = "done";
      var html = el.innerHTML;
      // wrap text nodes' words, preserve inline tags like <span class="lime">
      var temp = document.createElement("div");
      temp.innerHTML = html;
      var out = "";
      function wrapText(text) {
        return text.split(/(\s+)/).map(function (chunk) {
          if (/^\s+$/.test(chunk) || chunk === "") return chunk;
          return '<span class="word"><span>' + chunk + "</span></span>";
        }).join("");
      }
      Array.prototype.forEach.call(temp.childNodes, function (node) {
        if (node.nodeType === 3) {
          out += wrapText(node.textContent);
        } else {
          // element (e.g. <span class="lime">Dominá.</span>)
          var cls = node.getAttribute("class") || "";
          out += '<span class="' + cls + '">' + wrapText(node.textContent) + "</span>";
        }
      });
      el.innerHTML = out;
    });

    document.querySelectorAll(".split-words").forEach(function (el) {
      var words = el.querySelectorAll(".word > span");
      if (!words.length) return;
      gsap.set(words, { yPercent: 110 });
      gsap.to(words, {
        yPercent: 0, duration: 0.9, stagger: 0.05, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    /* --- Reveals with stagger per section --- */
    var groups = {};
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      var parent = el.closest("section") || document.body;
      var key = parent.id || parent.className || "doc";
      (groups[key] = groups[key] || []).push(el);
    });
    Object.keys(groups).forEach(function (key) {
      var els = groups[key];
      els.forEach(function (el, i) {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          delay: (i % 6) * 0.08,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onStart: function () { el.classList.add("is-revealed"); }
        });
      });
    });

    /* --- Hero entrance (curtain lines) --- */
    var heroLines = document.querySelectorAll(".hero-title .line-inner");
    if (heroLines.length) {
      gsap.set(heroLines, { yPercent: 110 });
      gsap.to(heroLines, {
        yPercent: 0, duration: 1.1, stagger: 0.12, ease: "expo.out", delay: 0.15
      });
    }

    /* --- Hero parallax + fade on scroll --- */
    var heroBg = document.getElementById("heroBg");
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 18, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    gsap.to(".hero-content", {
      y: -60, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "60% top", scrub: true }
    });

    /* --- Count-up stats --- */
    document.querySelectorAll(".stat-num").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.8, ease: "power2.out",
            onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
          });
        }
      });
    });

    ScrollTrigger.refresh();
  }

  /* ---------------- SAFETY NET ---------------- */
  function initSafetyNet() {
    setTimeout(function () {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        if (!el.classList.contains("is-revealed")) {
          el.classList.add("is-revealed");
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      document.querySelectorAll(".split-words .word > span").forEach(function (s) {
        s.style.transform = "none";
      });
      var hl = document.querySelectorAll(".hero-title .line-inner");
      hl.forEach(function (s) { s.style.transform = "none"; });
    }, 6000);
  }

  /* ---------------- MISC ---------------- */
  function initMisc() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- BOOT ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    safe(initLenis, "lenis");
    safe(initCursor, "cursor");
    safe(initNav, "nav");
    safe(initSponsorsLoop, "sponsors");
    safe(initMagnetic, "magnetic");
    safe(initScrollProgress, "scrollProgress");
    safe(initAnchors, "anchors");
    safe(initBooking, "booking");
    safe(initMisc, "misc");
    safe(initRevealFallback, "revealFallback");
    safe(initSafetyNet, "safetyNet");
  });

  window.addEventListener("load", function () {
    safe(initGSAP, "gsap");
  });
})();
