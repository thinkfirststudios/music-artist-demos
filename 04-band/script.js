/* Nine Mile Static — demo site (ThinkFirst Studios). Fictional band.
   No third-party iframe is in the DOM until a visitor presses play. Nothing autoplays. */
(function () {
  "use strict";
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- condensing header (140px) ---------- */
  var condenseOn = 160, condenseOff = 120, condensed = false;
  function setCondensed() {
    var y = window.scrollY;
    if (!condensed && y > condenseOn) condensed = true;
    else if (condensed && y < condenseOff) condensed = false;
    if (header) header.classList.toggle("is-condensed", condensed);
  }
  var header = $(".site-header");
  var onScroll = function () { if (header) setCondensed(); };
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile panel ---------- */
  var panel = $("#panel"), burger = $(".burger");
  if (panel && burger) {
    var closeB = $(".close-btn", panel);
    $$("li", panel).forEach(function (li, i) { li.style.setProperty("--i", i); });
    var open = function () { panel.classList.add("is-open"); panel.removeAttribute("inert"); burger.setAttribute("aria-expanded", "true"); d.body.style.overflow = "hidden"; setTimeout(function () { closeB.focus(); }, 30); };
    var close = function (ret) { panel.classList.remove("is-open"); panel.setAttribute("inert", ""); burger.setAttribute("aria-expanded", "false"); d.body.style.overflow = ""; if (ret !== false) burger.focus(); };
    burger.addEventListener("click", open); closeB.addEventListener("click", close);
    $$("a", panel).forEach(function (a) { a.addEventListener("click", function () { close(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("is-open")) close(); });
  }

  /* ---------- reveals: 20% visible, 80ms stagger, once ---------- */
  $$("[data-stagger]").forEach(function (g) { $$(".reveal", g).forEach(function (el, i) { el.style.setProperty("--d", Math.min(i * 80, 640) + "ms"); }); });
  var reveals = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) reveals.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.2 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- ticker: duplicate for a seamless loop ---------- */
  $$(".ticker__track").forEach(function (t) { var g = $(".ticker__group", t); if (g) { var c = g.cloneNode(true); c.setAttribute("aria-hidden", "true"); $$("a", c).forEach(function (a) { a.tabIndex = -1; }); t.appendChild(c); } });

  /* ---------- facades: only inject on click/Enter; demo reveals a labelled placeholder ---------- */
  function activate(btn) {
    var wrap = btn.closest(".facade-wrap");
    var svc = wrap.getAttribute("data-service");
    var src = wrap.getAttribute("data-src");
    if (!src) {
      var ph = d.createElement("div");
      ph.className = "ph-panel"; ph.setAttribute("role", "status"); ph.tabIndex = -1;
      ph.innerHTML = "<strong>DEMO — no audio loaded. In a live build this is the official " + svc + " embed.</strong><span>" + wrap.getAttribute("data-label") + "</span>";
      btn.replaceWith(ph); ph.focus({ preventScroll: true });
      return;
    }
    var f = d.createElement("iframe"), ok = false;
    f.src = src; f.title = wrap.getAttribute("data-label") + " — " + svc + " player";
    f.height = wrap.getAttribute("data-h") === "169" ? "" : wrap.getAttribute("data-h");
    if (wrap.getAttribute("data-h") === "169") f.style.aspectRatio = "16 / 9";
    f.allow = "encrypted-media; clipboard-write; picture-in-picture; fullscreen"; f.loading = "lazy";
    f.addEventListener("load", function () { ok = true; });
    var fail = function () {
      if (ok) return;
      f.remove();
      wrap.appendChild(btn);
      var note = $(".facade__note", btn);
      note.innerHTML = 'Player unavailable — <a href="' + wrap.getAttribute("data-out") + '" target="_blank" rel="noopener noreferrer">open on ' + svc + " ↗</a>";
    };
    f.addEventListener("error", fail); setTimeout(fail, 8000);
    btn.replaceWith(f);
  }
  d.addEventListener("click", function (e) { var b = e.target.closest(".facade"); if (b) activate(b); });

  /* ---------- listen tabs: ALBUM · SINGLES · LIVE ---------- */
  var tabs = $$(".tabs [role=tab]"), bar = $(".tabs__bar");
  function moveBar(t) { if (bar && t) { bar.style.width = t.offsetWidth + "px"; bar.style.transform = "translateX(" + t.offsetLeft + "px)"; } }
  function selectTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
      var p = d.getElementById(x.getAttribute("aria-controls"));
      p.hidden = !on;
      if (!on) $$("iframe", p).forEach(function (fr) { var w = fr.closest(".facade-wrap"); fr.remove(); w.innerHTML = w.getAttribute("data-facade"); });   // only the active tab's iframe stays in the DOM
    });
    moveBar(t); if (focus) t.focus();
  }
  $$(".facade-wrap").forEach(function (w) { w.setAttribute("data-facade", w.innerHTML); });
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length] : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });
  if (tabs.length) { moveBar($(".tabs [aria-selected=true]")); addEventListener("resize", function () { moveBar($(".tabs [aria-selected=true]")); }); }
  /* service picker inside the album tab */
  $$(".svc-pick").forEach(function (pick) {
    $$("button", pick).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", pick).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        $$("[data-svc-panel]", pick.parentNode).forEach(function (p) { var on = p.getAttribute("data-svc-panel") === b.getAttribute("data-svc"); p.hidden = !on; if (!on) $$("iframe", p).forEach(function (fr) { var w = fr.closest(".facade-wrap"); fr.remove(); w.innerHTML = w.getAttribute("data-facade"); }); });
      });
    });
  });
  /* tracklist triangles → the singles tab */
  $$("[data-go-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = d.getElementById(b.getAttribute("data-go-tab"));
      if (t) { selectTab(t); d.getElementById("listen").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
    });
  });

  /* ---------- band bios: "more" expands in place ---------- */
  $$("[data-more]").forEach(function (b) {
    b.addEventListener("click", function () {
      var bio = d.getElementById(b.getAttribute("aria-controls"));
      var open = bio.classList.toggle("is-open");
      b.setAttribute("aria-expanded", open); b.textContent = open ? "less" : "more";
    });
  });

  /* ---------- gallery lightbox: credit stays under the image, Esc closes, arrows move ---------- */
  var lb = $("#lightbox");
  if (lb && lb.showModal) {
    var tiles = $$(".tile button"), idx = 0, trigger = null;
    var show = function (i) {
      idx = (i + tiles.length) % tiles.length;
      var t = tiles[idx], img = $("img", t);
      $("img", lb).src = img.src; $("img", lb).alt = img.alt;
      $("figcaption", lb).innerHTML = t.getAttribute("data-caption");
      $(".lb-count", lb).textContent = (idx + 1) + " / " + tiles.length;
    };
    tiles.forEach(function (t, i) { t.addEventListener("click", function () { trigger = t; show(i); lb.showModal(); $(".lb-close", lb).focus(); }); });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1); });
    lb.addEventListener("close", function () { if (trigger) trigger.focus(); });
  }

  /* ---------- copy helpers ---------- */
  function copyText(text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = "COPIED"; setTimeout(function () { btn.textContent = t; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var ta = d.createElement("textarea"); ta.value = text; d.body.appendChild(ta); ta.select(); try { d.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
  }
  $$("[data-copy-link]").forEach(function (b) { b.addEventListener("click", function () { copyText(new URL(b.getAttribute("data-copy-link"), location.href).href, b); }); });
  $$("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { var el = d.getElementById(b.getAttribute("data-copy")); if (el) copyText(el.innerText.trim(), b); }); });
  $$("[data-copy-text]").forEach(function (b) { b.addEventListener("click", function () { copyText(b.getAttribute("data-copy-text"), b); }); });

  /* ---------- calendar files (.ics) built in the browser ---------- */
  function ics(o) {
    var z = function (s) { return s.replace(/[-:]/g, ""); };
    var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nine Mile Static (fictional demo)//EN", "BEGIN:VEVENT",
      "UID:" + o.uid + "@ninemilestatic.demo", "DTSTAMP:" + z(new Date().toISOString().slice(0, 19)) + "Z",
      "DTSTART:" + z(o.start), "DTEND:" + z(o.end), "SUMMARY:" + o.summary, "LOCATION:" + o.location,
      "DESCRIPTION:" + o.desc + "\\nFictional demonstration content. Nine Mile Static is not a real band.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = d.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    a.download = o.file; d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  $$("[data-ics]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = JSON.parse(b.getAttribute("data-ics"));
      ics(r);
    });
  });

  /* ---------- tour filters, announced ---------- */
  var filters = $$(".filters button"), live = $("#filter-status");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.setAttribute("aria-pressed", x === f); });
      var k = f.getAttribute("data-filter"), n = 0;
      $$(".dates--full .date").forEach(function (row) {
        var show = k === "all" || row.getAttribute("data-state") === k || (k === "canada" && row.getAttribute("data-country") === "CA");
        row.hidden = !show; if (show) n++;
      });
      if (live) live.textContent = n + (n === 1 ? " date shown" : " dates shown");
    });
  });

  /* ---------- mailing-list dialog for Remind me / waitlist / back-in-stock ---------- */
  var modal = $("#list-modal");
  $$("[data-list-open]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (!modal || !modal.showModal) return;
      e.preventDefault();
      var tag = b.getAttribute("data-list-open"), city = b.getAttribute("data-city") || "";
      $("#m-tag", modal).value = tag;
      $("#m-city", modal).value = city;
      $("#m-title", modal).textContent = b.getAttribute("data-title") || "Get told first";
      var remind = $("#m-ics", modal);
      if (b.getAttribute("data-ics-onsale")) { remind.hidden = false; remind.setAttribute("data-ics-json", b.getAttribute("data-ics-onsale")); } else remind.hidden = true;
      modal.showModal(); $("#m-email", modal).focus();
      modal._trigger = b;
    });
  });
  if (modal) {
    $(".m-close", modal).addEventListener("click", function () { modal.close(); });
    modal.addEventListener("close", function () { if (modal._trigger) modal._trigger.focus(); });
    $("#m-ics", modal).addEventListener("click", function () { ics(JSON.parse(this.getAttribute("data-ics-json"))); });
  }

  /* ---------- forms: native validation, inline field errors, live status ---------- */
  $$("form[data-demo]").forEach(function (form) {
    $$("input, select, textarea", form).forEach(function (el) {
      var err = el.id ? d.getElementById(el.id + "-err") : null;
      if (!err) return;
      el.addEventListener("invalid", function (e) {
        e.preventDefault();
        err.textContent = el.type === "checkbox" ? "Tick the box to join. It's never ticked for you." : el.validity.valueMissing ? "This one's required." : "That doesn't look right.";
        if (form.querySelector(":invalid") === el) el.focus();
      });
      el.addEventListener("input", function () { if (el.checkValidity()) err.textContent = ""; });
      el.addEventListener("change", function () { if (el.checkValidity()) err.textContent = ""; });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $(".status", form);
      st.textContent = form.getAttribute("data-success");
      form.reset();
      if (form.closest("dialog")) setTimeout(function () { /* leave it open so the message is read */ }, 0);
    });
  });

  /* ---------- contact routing select ---------- */
  var topic = $("#what");
  if (topic) {
    var upd = function () {
      var o = topic.options[topic.selectedIndex];
      $("#what-help").textContent = o.getAttribute("data-help") || "Pick one and we'll route it.";
      $("#what-to").textContent = o.getAttribute("data-to") ? "Goes to: " + o.getAttribute("data-to") : "";
    };
    topic.addEventListener("change", upd); upd();
  }

  /* ---------- EPK sticky index: flare marker on the active block ---------- */
  var idxLinks = $$(".epk-index a");
  if (idxLinks.length && "IntersectionObserver" in window) {
    var map = {}; idxLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var eio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          idxLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
          var a = map[e.target.id]; if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); if (a.scrollIntoView && innerWidth < 1024) a.scrollIntoView({ block: "nearest", inline: "center" }); }
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    $$(".epk-block[id]").forEach(function (s) { eio.observe(s); });
  }

  /* ---------- sticky mobile bar: after the hero, away when the footer arrives ---------- */
  var ab = $(".actionbar");
  if (ab) {
    var heroGone = !$(".hero"), footerIn = false;
    var set = function () { var on = heroGone && !footerIn; ab.classList.toggle("is-on", on); if (on) ab.removeAttribute("inert"); else ab.setAttribute("inert", ""); };
    if ("IntersectionObserver" in window) {
      if ($(".hero")) new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; set(); }).observe($(".hero"));
      new IntersectionObserver(function (es) { footerIn = es[0].isIntersecting; set(); }).observe($(".site-footer"));
    } else { heroGone = true; }
    set();
  }
})();
