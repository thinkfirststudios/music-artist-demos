/* SEVEROV — demo site (ThinkFirst Studios). Fictional artist.
   Every third-party player is click-to-load. The only self-hosted media is the SILENT hero loop.
   The canvas ribbon is decoration from a sine seed. It is NOT audio-reactive: platform embeds
   do not expose audio data to the host page, and nothing here pretends otherwise. */
(function () {
  "use strict";
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ss = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };

  /* ---------- header: hard cut at 50px ---------- */
  var condenseOn = 70, condenseOff = 30, condensed = false;
  function setCondensed() {
    var y = window.scrollY;
    if (!condensed && y > condenseOn) condensed = true;
    else if (condensed && y < condenseOff) condensed = false;
    if (header) header.classList.toggle("is-cut", condensed);
  }
  var header = $(".site-header");
  var cut = function () { if (header) setCondensed(); };
  cut();
  window.addEventListener("scroll", cut, { passive: true });

  /* ---------- demo banner height → CSS, so the hero fills exactly the space under it ---------- */
  var banner = $(".demo-banner");
  if (banner) {
    var setBanner = function () { d.documentElement.style.setProperty("--banner-h", banner.offsetHeight + "px"); };
    setBanner();
    if ("ResizeObserver" in window) new ResizeObserver(setBanner).observe(banner);
    else window.addEventListener("resize", setBanner);
  }

  /* ---------- mobile takeover ---------- */
  var menu = $("#takeover"), menuBtn = $(".menu-btn");
  if (menu && menuBtn) {
    var closeBtn = $(".takeover__close", menu);
    $$("li", menu).forEach(function (li, i) { li.style.setProperty("--i", i); });
    var open = function () { menu.classList.add("is-open"); menu.removeAttribute("inert"); menuBtn.setAttribute("aria-expanded", "true"); d.body.style.overflow = "hidden"; setTimeout(function () { closeBtn.focus(); }, 20); };
    var close = function (ret) { menu.classList.remove("is-open"); menu.setAttribute("inert", ""); menuBtn.setAttribute("aria-expanded", "false"); d.body.style.overflow = ""; if (ret !== false) menuBtn.focus(); };
    menuBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { close(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) close(); });
  }

  /* ---------- hard-cut reveals with stagger ---------- */
  $$("[data-stagger]").forEach(function (g) {
    var step = parseInt(g.getAttribute("data-stagger"), 10) || 50;
    $$(".cut", g).forEach(function (el, i) { el.style.setProperty("--d", Math.min(i * step, 900) + "ms"); });
  });
  var cuts = $$(".cut");
  if (reduce || !("IntersectionObserver" in window)) {
    cuts.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    cuts.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero: silent loop, persistent pause control, scroll-linked split ---------- */
  var hero = $(".hero");
  if (hero) {
    var video = $("video", hero);
    var pauseBtn = $(".hero__pause", hero);
    if (video && !reduce) {
      var src = video.getAttribute("data-src");
      if (src) { video.src = src; video.muted = true; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      pauseBtn.addEventListener("click", function () {
        if (video.paused) { video.play(); pauseBtn.textContent = "Pause loop"; pauseBtn.setAttribute("aria-pressed", "false"); }
        else { video.pause(); pauseBtn.textContent = "Play loop"; pauseBtn.setAttribute("aria-pressed", "true"); }
      });
    }

    if (!reduce) {
      var left = $(".hero__word .l", hero), right = $(".hero__word .r", hero), media = $(".hero__media", hero);
      var heroVisible = true, ticking = false, lastY = -1;
      new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(hero);
      var frame = function () {
        ticking = false;
        if (!heroVisible) return;
        var y = window.scrollY;
        if (y === lastY) return;
        lastY = y;
        var t = Math.max(0, Math.min(1, y / (hero.offsetHeight || 1)));   // cached height read, transform-only writes
        left.style.transform = "translate3d(" + (-8 * t) + "vw,0,0)";
        right.style.transform = "translate3d(" + (8 * t) + "vw,0,0)";
        media.style.transform = "scale(" + (1 + 0.06 * t) + ")";
      };
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

      /* decorative ribbon — sine seed, pauses when hidden, absent under reduced motion */
      var canvas = $(".hero__ribbon", hero);
      if (canvas && canvas.getContext) {
        var ctx = canvas.getContext("2d"), w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true, t0 = performance.now();
        var size = function () { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
        size();
        window.addEventListener("resize", size);
        d.addEventListener("visibilitychange", function () { running = !d.hidden; if (running) requestAnimationFrame(draw); });
        var draw = function (now) {
          if (!running || !heroVisible) { if (running) requestAnimationFrame(draw); return; }
          var t = (now - t0) / 1000;
          ctx.clearRect(0, 0, w, h);
          var g = ctx.createLinearGradient(0, 0, w, 0);
          g.addColorStop(0, "rgba(57,225,245,.9)"); g.addColorStop(1, "rgba(107,75,255,.9)");
          ctx.strokeStyle = g; ctx.lineWidth = 1;
          for (var k = 0; k < 3; k++) {
            ctx.beginPath();
            for (var x = 0; x <= w; x += 6) {
              var yy = h / 2 + Math.sin(x * 0.006 + t * 0.35 + k * 0.9) * h * 0.22 * Math.sin(x * 0.0017 + t * 0.12 + k) + Math.sin(x * 0.02 + t * 0.6 + k * 2) * 4;
              if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
            }
            ctx.globalAlpha = 0.9 - k * 0.28;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      }
    }
  }

  /* ---------- marquees: duplicate content aria-hidden; static under reduced motion ---------- */
  $$(".marquee").forEach(function (m) {
    var g = $(".marquee__group", m);
    if (!g) return;
    var copy = g.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    m.appendChild(copy);
  });

  /* ---------- click-to-load embeds ---------- */
  function fallback(slot) {
    var tpl = $("template.fb", slot);
    $$("iframe, .slot__placeholder", slot).forEach(function (n) { n.remove(); });
    if (tpl && !$(".fallback", slot)) slot.appendChild(tpl.content.cloneNode(true));
  }
  function load(slot) {
    if (!slot || slot.getAttribute("data-loaded")) return;
    slot.setAttribute("data-loaded", "1");
    var facade = $(".slot__facade", slot);
    if (facade) facade.remove();
    var src = slot.getAttribute("data-src");
    if (!src) {   // demo: labelled, non-functional placeholder
      var ph = $("template.ph", slot);
      if (ph) slot.appendChild(ph.content.cloneNode(true));
      var el = $(".slot__placeholder", slot);
      if (el) { el.tabIndex = -1; el.focus({ preventScroll: true }); }
      return;
    }
    var f = d.createElement("iframe");
    f.src = src; f.title = slot.getAttribute("data-title") || "Embedded player"; f.loading = "lazy";
    f.allow = "encrypted-media; fullscreen"; var ok = false;
    f.addEventListener("load", function () { ok = true; });
    f.addEventListener("error", function () { fallback(slot); });
    setTimeout(function () { if (!ok) fallback(slot); }, 8000);
    slot.appendChild(f);
  }
  $$(".slot__play").forEach(function (b) { b.addEventListener("click", function () { load(b.closest(".slot")); }); });

  /* tracklist table: small play affordance loads that track's embed in place */
  $$(".play-mini").forEach(function (b) {
    b.addEventListener("click", function () {
      var row = b.closest("tr");
      var target = d.getElementById(b.getAttribute("aria-controls"));
      $$(".track-embed").forEach(function (r) { if (r !== target) r.hidden = true; });
      target.hidden = false;
      b.setAttribute("aria-expanded", "true");
      load($(".slot", target));
    });
  });

  /* transmissions: PLAY swaps the row into the loaded embed in place */
  $$(".mix__play").forEach(function (b) {
    b.addEventListener("click", function () {
      var mix = b.closest(".mix");
      var slotWrap = $(".mix__slot", mix);
      slotWrap.hidden = false;
      $$(".mix.is-loaded").forEach(function (m) { if (m !== mix) m.classList.remove("is-loaded"); });
      mix.classList.add("is-loaded");
      b.setAttribute("aria-expanded", "true");
      load($(".slot", slotWrap));
    });
  });

  /* ---------- date table: LIVE NOW state for a set in progress ---------- */
  var now = Date.now();
  $$("tr[data-start]").forEach(function (tr) {
    var s = Date.parse(tr.getAttribute("data-start")), e = Date.parse(tr.getAttribute("data-end"));
    if (s && e && now >= s && now <= e) {
      var cell = $("td.st", tr);
      cell.innerHTML = '<span class="chip chip--live">Live now</span>';
    }
  });

  /* "REMIND ME" / returns → list anchor; sets the country field only. No box is ever ticked for the visitor */
  $$("[data-remind]").forEach(function (a) {
    a.addEventListener("click", function () {
      var city = $("#list-city");
      if (city && a.getAttribute("data-remind")) city.value = a.getAttribute("data-remind");
      setTimeout(function () { var em = $("#list-email"); if (em) em.focus({ preventScroll: true }); }, 50);
    });
  });

  /* ---------- booking form: honeypot + time-to-submit instead of a CAPTCHA ---------- */
  $$("input[type=date]").forEach(function (i) {
    var t = new Date(); var iso = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    i.min = iso;
  });
  $$("form[data-demo]").forEach(function (form) {
    var started = Date.now();
    var status = $(".form-status", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = $(".hp input", form);
      if (hp && hp.value) return;                       // bot filled the hidden field
      if (Date.now() - started < 3000) { status.textContent = "That was fast. Please check the form and send again."; status.classList.add("is-error"); started = 0; return; }
      var bad = $$("[required]", form).filter(function (f) { return f.type === "checkbox" ? !f.checked : !f.checkValidity(); });
      var segs = $$("input[data-segment]", form);
      if (segs.length && !segs.some(function (s) { return s.checked; })) {
        status.textContent = "Pick at least one list: fans, promoters, or both.";
        status.classList.add("is-error"); segs[0].focus(); return;
      }
      if (bad.length) {
        var lbl = bad[0].id ? $('label[for="' + bad[0].id + '"]', form) : null;
        status.textContent = "Missing or invalid: " + (lbl ? lbl.textContent.replace("*", "").trim() : "a required field") + ".";
        status.classList.add("is-error");
        bad[0].focus();
        return;
      }
      status.classList.remove("is-error");
      var tpl = $("template.done", form.parentNode);
      if (tpl) {
        var node = tpl.content.cloneNode(true);
        form.replaceWith(node);
        var c = $(".confirm", d.getElementById(tpl.getAttribute("data-host")) || d);
        if (c) { c.tabIndex = -1; c.focus(); }
      } else {
        status.textContent = form.getAttribute("data-success") || "Done. Demo form, nothing was sent or stored.";
        form.reset();
      }
    });
  });

  /* ---------- sticky CTA: after 30% scroll, hidden while a booking form is on screen ---------- */
  var sticky = $(".sticky");
  if (sticky) {
    var formOn = false, dismissed = ss("sv-sticky") === "1";
    var upd = function () {
      var max = d.documentElement.scrollHeight - innerHeight;
      var show = !dismissed && !formOn && max > 0 && scrollY / max > 0.3;
      sticky.classList.toggle("is-on", show);
      if (show) sticky.removeAttribute("inert"); else sticky.setAttribute("inert", "");
    };
    var forms = $$(".enquiry");
    if (forms.length && "IntersectionObserver" in window) {
      var vis = new Map();
      var fio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { vis.set(e.target, e.isIntersecting); });
        formOn = Array.from(vis.values()).some(Boolean); upd();
      });
      forms.forEach(function (f) { fio.observe(f); });
    }
    addEventListener("scroll", upd, { passive: true });
    upd();
    $(".sticky__x", sticky).addEventListener("click", function () { dismissed = true; ss("sv-sticky", "1"); upd(); });
  }

  /* ---------- copy to clipboard ---------- */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = d.getElementById(b.getAttribute("data-copy"));
      if (!el || !navigator.clipboard) return;
      navigator.clipboard.writeText(el.innerText.trim()).then(function () {
        var t = b.textContent; b.textContent = "COPIED"; setTimeout(function () { b.textContent = t; }, 1600);
      }, function () {});
    });
  });
})();
