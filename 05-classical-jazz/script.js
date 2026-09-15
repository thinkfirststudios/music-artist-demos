/* Odile Rannoch, cellist — demo site (ThinkFirst Studios). Fictional artist.
   No third-party frame loads until someone presses play. Nothing autoplays. Nothing bounces. */
(function () {
  "use strict";
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- condensing header (130px) ---------- */
  var condenseOn = 150, condenseOff = 110, condensed = false;
  function setCondensed() {
    var y = window.scrollY;
    if (!condensed && y > condenseOn) condensed = true;
    else if (condensed && y < condenseOff) condensed = false;
    if (header) header.classList.toggle("is-condensed", condensed);
  }
  var header = $(".site-header");
  var cond = function () { if (header) setCondensed(); };
  cond(); addEventListener("scroll", cond, { passive: true });

  /* ---------- mobile panel: links fade in at 50ms, no sliding ---------- */
  var panel = $("#panel"), menuBtn = $(".menu-btn");
  if (panel && menuBtn) {
    var pc = $(".panel-close", panel);
    $$("li", panel).forEach(function (li, i) { li.style.setProperty("--i", i); });
    var open = function () { panel.classList.add("is-open"); panel.removeAttribute("inert"); menuBtn.setAttribute("aria-expanded", "true"); d.body.style.overflow = "hidden"; setTimeout(function () { pc.focus(); }, 30); };
    var close = function (r) { panel.classList.remove("is-open"); panel.setAttribute("inert", ""); menuBtn.setAttribute("aria-expanded", "false"); d.body.style.overflow = ""; if (r !== false) menuBtn.focus(); };
    menuBtn.addEventListener("click", open); pc.addEventListener("click", close);
    $$("a", panel).forEach(function (a) { a.addEventListener("click", function () { close(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("is-open")) close(); });
  }

  /* ---------- three-path chooser (dialog; bottom sheet on phones) ---------- */
  var chooser = $("#chooser"), lastTrigger = null;
  $$("[data-chooser]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (!chooser || !chooser.showModal) return;
      e.preventDefault(); lastTrigger = b;
      if (panel && panel.classList.contains("is-open")) { panel.classList.remove("is-open"); panel.setAttribute("inert", ""); d.body.style.overflow = ""; }
      chooser.showModal();
      var first = $("a", chooser); if (first) first.focus();
    });
  });
  if (chooser) {
    $(".chooser-close", chooser).addEventListener("click", function () { chooser.close(); });
    chooser.addEventListener("click", function (e) { if (e.target === chooser) chooser.close(); });
    chooser.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });
    $$("a", chooser).forEach(function (a) { a.addEventListener("click", function () { chooser.close(); }); });
  }

  /* ---------- reveals: once, at 22% visibility, 110ms stagger ---------- */
  $$("[data-stagger]").forEach(function (g) { $$(".reveal", g).forEach(function (el, i) { el.style.setProperty("--d", Math.min(i * 110, 660) + "ms"); }); });
  var rev = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) rev.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.22 });
    rev.forEach(function (el) { io.observe(el); });
  }

  /* ---------- next engagement: auto-select the next future date ---------- */
  var next = $("#next-engagement");
  var data = $("#season-data");
  if (next && data) {
    try {
      var season = JSON.parse(data.textContent), now = Date.now();
      var up = season.filter(function (s) { return Date.parse(s.start) > now; })[0];
      if (up) {
        $(".next__date", next).textContent = up.label;
        $(".next__hall", next).textContent = up.city + " · " + up.hall;
        $(".next__prog", next).textContent = up.programme;
        $(".next__tix", next).setAttribute("aria-label", "Tickets for " + up.city + ", " + up.label + " (demo: no ticketing connected)");
      } else {
        next.querySelector(".next__row").innerHTML = '<span>Next dates announced shortly — <a href="#list">join the mailing list</a></span>';
      }
    } catch (e) {}
  }

  /* ---------- filters (calendar + repertoire), announced ---------- */
  $$(".filters").forEach(function (group) {
    var target = d.getElementById(group.getAttribute("data-target"));
    var status = d.getElementById(group.getAttribute("data-status"));
    var noun = group.getAttribute("data-noun") || "items";
    $$("button", group).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", group).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        var k = b.getAttribute("data-filter"), n = 0;
        $$("[data-cats]", target).forEach(function (row) {
          var show = k === "all" || row.getAttribute("data-cats").split(" ").indexOf(k) > -1;
          row.hidden = !show; if (show) n++;
        });
        $$("[data-group]", target).forEach(function (grp) { grp.hidden = !$$("[data-cats]", grp).some(function (r) { return !r.hidden; }); });
        if (status) status.textContent = n + " " + noun + " shown";
      });
    });
  });

  /* ---------- .ics calendar files ---------- */
  function ics(o) {
    var z = function (s) { return s.replace(/[-:]/g, ""); };
    var esc = function (s) { return String(s).replace(/,/g, "\\,").replace(/;/g, "\\;"); };
    var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Odile Rannoch (fictional demo)//EN", "BEGIN:VEVENT", "UID:" + o.uid + "@odilerannoch.demo",
      "DTSTAMP:" + z(new Date().toISOString().slice(0, 19)) + "Z", "DTSTART:" + z(o.start), "DTEND:" + z(o.end), "SUMMARY:" + esc(o.summary), "LOCATION:" + esc(o.location),
      "DESCRIPTION:" + esc(o.desc) + "\\nFictional demonstration content. Odile Rannoch is not a real musician.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = d.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" })); a.download = o.file;
    d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  $$("[data-ics]").forEach(function (b) { b.addEventListener("click", function () { ics(JSON.parse(b.getAttribute("data-ics"))); }); });

  /* ---------- REMIND ME / RETURNS → mailing list, tagged ---------- */
  $$("[data-list-tag]").forEach(function (a) {
    a.addEventListener("click", function () {
      var tag = d.getElementById("list-tag"), city = d.getElementById("list-city");
      if (tag) tag.value = a.getAttribute("data-list-tag");
      if (city && a.getAttribute("data-city")) city.value = a.getAttribute("data-city");
    });
  });

  /* ---------- facades: inject on click/Enter; demo shows a labelled placeholder ---------- */
  d.addEventListener("click", function (e) {
    var b = e.target.closest(".facade");
    if (!b) return;
    var w = b.closest(".facade-wrap"), svc = w.getAttribute("data-service"), src = w.getAttribute("data-src");
    if (!src) {
      var ph = d.createElement("div");
      ph.className = "ph-panel"; ph.setAttribute("role", "status"); ph.tabIndex = -1;
      ph.innerHTML = "<strong>DEMO — no audio loaded. In a live build this is the official " + svc + " embed.</strong><span class=\"muted\">" + w.getAttribute("data-work") + "</span>";
      b.replaceWith(ph); ph.focus({ preventScroll: true });
      return;
    }
    var f = d.createElement("iframe"), ok = false;
    f.src = src; f.title = w.getAttribute("data-work") + " — " + svc; f.loading = "lazy"; f.height = w.getAttribute("data-h") || "175";
    f.style.width = "100%"; f.style.border = "0"; f.allow = "encrypted-media; fullscreen";
    f.addEventListener("load", function () { ok = true; });
    var fail = function () { if (ok) return; f.replaceWith(b); $(".facade__note", b).innerHTML = 'Player unavailable — <a href="' + w.getAttribute("data-out") + '" target="_blank" rel="noopener noreferrer">open on ' + svc + " ↗</a>"; };
    f.addEventListener("error", fail); setTimeout(fail, 8000);
    b.replaceWith(f);
  });

  /* ---------- copy buttons ---------- */
  function copy(text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
  }
  $$("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { var el = d.getElementById(b.getAttribute("data-copy")); if (el) copy(el.innerText.trim(), b); }); });
  $$("[data-copy-text]").forEach(function (b) { b.addEventListener("click", function () { copy(b.getAttribute("data-copy-text"), b); }); });
  $$("[data-copy-link]").forEach(function (b) { b.addEventListener("click", function () { copy(location.href.split("#")[0], b); }); });

  /* ---------- prefill forms from links (?programme=, ?type=) ---------- */
  var params = new URLSearchParams(location.search);
  if (params.get("programme")) { var ps = d.getElementById("pf-programme"); if (ps) ps.value = params.get("programme"); }
  if (params.get("type")) {
    $$('input[name="engagement"], input[name="project"]').forEach(function (r) { if (r.value === params.get("type")) r.checked = true; });
  }

  /* ---------- commissions: fields change with the project type ---------- */
  var projectRadios = $$('input[name="project"]');
  var syncProject = function () {
    var v = (projectRadios.filter(function (r) { return r.checked; })[0] || {}).value || "";
    $$(".cond[data-when]").forEach(function (g) {
      var on = g.getAttribute("data-when").split(" ").indexOf(v) > -1;
      g.hidden = !on;
      $$("input, select, textarea", g).forEach(function (f) { f.disabled = !on; });
    });
  };
  projectRadios.forEach(function (r) { r.addEventListener("change", syncProject); });
  if (projectRadios.length) syncProject();

  /* "I'm flexible" disables the date field */
  var flex = d.getElementById("pf-flexible");
  if (flex) flex.addEventListener("change", function () { var dt = d.getElementById("pf-date"); dt.required = !flex.checked; if (flex.checked) { dt.value = ""; d.getElementById("pf-date-err").textContent = ""; } });

  /* ---------- forms: inline errors via aria-describedby, live status, inline success ---------- */
  $$("form[data-demo]").forEach(function (form) {
    $$("input, select, textarea", form).forEach(function (el) {
      el.addEventListener("invalid", function (e) {
        e.preventDefault();
        var id = el.getAttribute("data-err") || (el.id + "-err");
        var err = d.getElementById(id);
        if (err) err.textContent = el.type === "checkbox" ? (el.getAttribute("data-msg") || "Please tick this box.") : el.type === "radio" ? "Please choose one." : el.validity.valueMissing ? "This is needed." : "Please check this.";
      });
      var clear = function () { var id = el.getAttribute("data-err") || (el.id + "-err"); var err = d.getElementById(id); if (err && el.checkValidity()) err.textContent = ""; };
      el.addEventListener("input", clear); el.addEventListener("change", clear);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
      var st = $(".status", form);
      st.innerHTML = '<span class="success" style="display:block">' + form.getAttribute("data-success") + "</span>";
      form.reset(); if (projectRadios.length) syncProject();
    });
  });

  /* "Not sure which?" purpose select re-labels its destination and helper */
  var purpose = d.getElementById("ns-purpose");
  if (purpose) {
    var up2 = function () { var o = purpose.options[purpose.selectedIndex]; d.getElementById("ns-help").textContent = o.getAttribute("data-help") || ""; d.getElementById("ns-to").textContent = o.getAttribute("data-to") ? "Goes to " + o.getAttribute("data-to") + " · " + o.getAttribute("data-time") : ""; };
    purpose.addEventListener("change", up2); up2();
  }

  /* ---------- mobile enquiry bar: after the hero; hidden while a form field has focus ---------- */
  var bar = $(".enq-bar");
  if (bar) {
    var heroGone = !$(".hero, .page-head"), typing = false;
    var set = function () { var on = heroGone && !typing; bar.classList.toggle("is-on", on); if (on) bar.removeAttribute("inert"); else bar.setAttribute("inert", ""); };
    var h = $(".hero, .page-head");
    if (h && "IntersectionObserver" in window) new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; set(); }).observe(h);
    d.addEventListener("focusin", function (e) { if (e.target.matches("input, select, textarea")) { typing = true; set(); } });
    d.addEventListener("focusout", function (e) { if (e.target.matches("input, select, textarea")) { typing = false; set(); } });
    set();
  }
})();
