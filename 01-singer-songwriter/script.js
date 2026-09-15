/* Bryn Hollis — demo site (ThinkFirst Studios). Fictional artist.
   No framework. Every third-party player is click-to-load. Nothing autoplays. */
(function () {
  "use strict";

  var doc = document;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  function store(key, val) {
    try {
      if (val === undefined) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- condensing header (70px) ---------- */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-condensed", window.scrollY > 70); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile sheet ---------- */
  var sheet = $("#mobile-sheet");
  var openBtn = $(".menu-toggle");
  if (sheet && openBtn) {
    var closeBtn = $(".mobile-sheet__close", sheet);
    $$("li", sheet).forEach(function (li, i) { li.style.setProperty("--i", i); });
    var openSheet = function () {
      sheet.classList.add("is-open");
      sheet.removeAttribute("inert");
      openBtn.setAttribute("aria-expanded", "true");
      doc.body.style.overflow = "hidden";
      setTimeout(function () { closeBtn.focus(); }, 30);
    };
    var closeSheet = function (returnFocus) {
      sheet.classList.remove("is-open");
      sheet.setAttribute("inert", "");
      openBtn.setAttribute("aria-expanded", "false");
      doc.body.style.overflow = "";
      if (returnFocus !== false) openBtn.focus();
    };
    openBtn.addEventListener("click", openSheet);
    closeBtn.addEventListener("click", closeSheet);
    $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { closeSheet(false); }); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("is-open")) closeSheet();
    });
  }

  /* ---------- scroll reveals with stagger ---------- */
  $$("[data-stagger]").forEach(function (group) {
    var step = parseInt(group.getAttribute("data-stagger"), 10) || 100;
    $$(".reveal", group).forEach(function (el, i) { el.style.setProperty("--d", (i * step) + "ms"); });
  });
  var revealables = $$(".reveal, .section-label");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -30% 0px", threshold: 0 });   // fires around 70% viewport
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- player platform toggle (real radio group) ---------- */
  $$(".player-toggle").forEach(function (group) {
    var radios = $$("[role=radio]", group);
    var player = group.closest(".player");
    function select(radio, focus) {
      radios.forEach(function (r) {
        var on = r === radio;
        r.setAttribute("aria-checked", on ? "true" : "false");
        r.tabIndex = on ? 0 : -1;
      });
      if (focus) radio.focus();
      $$(".embed-slot", player).forEach(function (slot) {
        slot.hidden = slot.getAttribute("data-platform") !== radio.getAttribute("data-value");
      });
    }
    radios.forEach(function (radio, i) {
      radio.addEventListener("click", function () { select(radio, false); });
      radio.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = radios[(i + 1) % radios.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = radios[(i - 1 + radios.length) % radios.length];
        if (e.key === "Home") next = radios[0];
        if (e.key === "End") next = radios[radios.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- click-to-load embeds ----------
     data-embed-src empty  -> demo: show the labelled non-functional placeholder.
     data-embed-src set    -> inject the official iframe; if it errors or is blocked,
                              degrade to the readable link list (never a grey box). */
  function showFallback(slot) {
    var tpl = $("template.fallback", slot);
    $$("iframe, .placeholder-player", slot).forEach(function (n) { n.remove(); });
    if (tpl && !$(".embed-fallback", slot)) slot.appendChild(tpl.content.cloneNode(true));
  }

  $$("[data-facade]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var slot = btn.closest(".embed-slot");
      var src = slot.getAttribute("data-embed-src");
      var facade = btn.closest(".facade") || btn;
      if (!src) {
        var tpl = $("template.placeholder", slot);
        facade.remove();
        if (tpl) slot.appendChild(tpl.content.cloneNode(true));
        var ph = $(".placeholder-player", slot);
        if (ph) { ph.setAttribute("tabindex", "-1"); ph.focus(); }
        return;
      }
      var frame = doc.createElement("iframe");
      frame.src = src;
      frame.title = slot.getAttribute("data-title") || "Embedded player";
      frame.loading = "lazy";
      frame.allow = "encrypted-media; fullscreen; clipboard-write";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      var settled = false;
      frame.addEventListener("load", function () { settled = true; });
      frame.addEventListener("error", function () { showFallback(slot); });
      setTimeout(function () { if (!settled) showFallback(slot); }, 8000);
      facade.remove();
      slot.appendChild(frame);
    });
  });

  /* ---------- "Remind me" / waiting list → the letter, pre-filtered to that city ---------- */
  $$("[data-city]").forEach(function (link) {
    link.addEventListener("click", function () {
      var select = $("#letter-city");
      if (!select) return;
      var city = link.getAttribute("data-city");
      $$("option", select).forEach(function (o) { if (o.value === city) select.value = city; });
      setTimeout(function () { var email = $("#letter-email"); if (email) email.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
    });
  });

  /* ---------- forms (demo: nothing is sent or stored) ---------- */
  $$("form[data-demo-form]").forEach(function (form) {
    var status = $(".form-status", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("input[type=email]", form);
      var consent = $("input[type=checkbox][required]", form);
      var msg = "";
      if (email && !email.value.trim()) msg = "Please add an email address.";
      else if (email && !email.checkValidity()) msg = "That email address does not look complete.";
      else if (consent && !consent.checked) msg = "Tick the box if you would like the letter. It is never ticked for you.";
      else if (!form.checkValidity()) msg = "Please fill in the required fields.";
      if (msg) {
        status.textContent = msg;
        status.classList.add("is-error");
        return;
      }
      status.classList.remove("is-error");
      status.textContent = form.getAttribute("data-success") || "Thank you. Demo form, nothing was sent or stored.";
      form.reset();
    });
  });

  /* ---------- contact routing ---------- */
  var route = $("#route-topic");
  if (route) {
    var routeTo = $("#route-to");
    var update = function () {
      var opt = route.options[route.selectedIndex];
      routeTo.textContent = opt && opt.getAttribute("data-to") ? "This will go to " + opt.getAttribute("data-to") + "." : "";
    };
    route.addEventListener("change", update);
  }

  /* ---------- sticky CTA: after 40% scroll, hidden while the ledger is on screen ---------- */
  var sticky = $(".sticky-cta");
  if (sticky) {
    var ledger = $("#road-ledger");
    var ledgerVisible = false;
    var dismissed = store("bh-cta-dismissed") === "1";
    var evaluate = function () {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var past = max > 0 && window.scrollY / max > 0.4;
      var show = past && !ledgerVisible && !dismissed;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
      if (show) sticky.removeAttribute("inert"); else sticky.setAttribute("inert", "");
    };
    if (ledger && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        ledgerVisible = entries[0].isIntersecting;
        evaluate();
      }).observe(ledger);
    }
    window.addEventListener("scroll", evaluate, { passive: true });
    evaluate();
    $(".sticky-cta__close", sticky).addEventListener("click", function () {
      dismissed = true;
      store("bh-cta-dismissed", "1");
      evaluate();
    });
  }

  /* ---------- lightbox for the plates ---------- */
  var box = $("#lightbox");
  if (box && typeof box.showModal === "function") {
    var lbImg = $("img", box), lbCap = $(".lightbox__caption", box), lbCred = $(".lightbox__credit", box);
    var trigger = null;
    $$(".plate-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fig = btn.closest("figure");
        var img = $("img", btn);
        trigger = btn;
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = $(".plate__caption", fig).textContent;
        lbCred.innerHTML = $(".credit", fig).innerHTML;
        box.showModal();
      });
    });
    $(".lightbox__close", box).addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("close", function () { if (trigger) trigger.focus(); });
  }

  /* ---------- songbook: columns on desktop, accordion on mobile ---------- */
  var albums = $$(".album");
  if (albums.length) {
    var mq = window.matchMedia("(min-width: 900px)");
    var sync = function () { albums.forEach(function (d, i) { d.open = mq.matches || i === 0; }); };
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
  }

  /* ---------- copy to clipboard (press kit) ---------- */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = doc.getElementById(btn.getAttribute("data-copy"));
      if (!target) return;
      var text = target.innerText.trim();
      var done = function () {
        var old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = old; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var range = doc.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { doc.execCommand("copy"); done(); } catch (e) {}
      }
    });
  });
})();
