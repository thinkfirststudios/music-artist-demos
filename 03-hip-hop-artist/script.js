/* CASS EMORY — demo site (ThinkFirst Studios). Fictional artist.
   The drop page is a template: every /drops/<slug>/ folder has the same index.html and one drop.json.
   This file renders a drop from that JSON. Every player is click-to-load; nothing autoplays. */
(function () {
  "use strict";
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var slugify = function (s) { return String(s).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1 0l9 5-9 5z" fill="currentColor"/></svg>';
  var ss = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };

  /* =====================================================================
     DROP RENDERER
     ===================================================================== */
  var root = $("[data-drop-src]");

  function titleLines(t) {
    return t.map(function (p) { return '<span class="' + (p[1] || "w") + '">' + esc(p[0]) + "</span>"; }).join(" ");
  }

  var EMBEDS = {};   // optional real player URLs from drop.json "embeds": { "youtube": ..., "spotify": ... }
  function slotHTML(kind, label, title, meta, comment, links, still) {
    var src = kind.indexOf("youtube") === 0 ? (EMBEDS.youtube || "") : kind.indexOf("spotify") === 0 ? (EMBEDS.spotify || "") : "";
    var fb = '<div class="fallback"><b>' + esc(title) + "</b>" + esc(meta) + "<ul>" + links.map(function (l) { return '<li><a href="' + esc(l[1]) + '" rel="noopener">' + esc(l[0]) + "</a></li>"; }).join("") + "</ul></div>";
    var facade = still
      ? '<div class="duo duo--scrim"><img src="' + esc(still.src) + '" alt="' + esc(still.alt) + '" width="1920" height="1080" loading="lazy"></div><button class="facade-btn" type="button" data-load><span class="sq">' + PLAY + '</span><span class="lbl">' + esc(label) + "</span></button>"
      : '<div class="slot-bar"><button type="button" data-load>' + PLAY + "<span>" + esc(label) + "</span></button><span>Loads only when you press play.</span></div>";
    return '<div class="embed-slot" data-kind="' + kind + '" data-src="' + esc(src) + '" data-title="' + esc(label) + '">' +
      "<!-- REAL EMBED (paste the ID, then copy src into data-src): " + comment + " -->" + facade +
      '<template class="ph"><div class="placeholder" role="status"><strong>PLAYER PLACEHOLDER — DEMO SITE, NO AUDIO</strong><span>' + esc(title) + "</span></div></template>" +
      '<template class="fb">' + fb + "</template><noscript>" + fb + "</noscript></div>";
  }

  function heroHTML(x, base, home) {
    var v = x.video || {};
    var watch = home ? base + "drops/" + x.slug + "/index.html#video" : "#video";
    var stream = home ? base + "drops/" + x.slug + "/index.html#stream" : "#stream";
    var cap = home ? "#capsule" : "#capsule";
    var still = { src: base + v.still, alt: v.still_alt };
    return '<section class="drop-hero" aria-labelledby="drop-title" data-hero>' +
      '<div class="wrap">' +
      '<p class="drop-hero__artist">CASS EMORY</p>' +
      '<p class="drop-hero__kicker">' + esc(x.kicker) + "</p>" +
      '<h1 id="drop-title" class="drop-hero__title">' + titleLines(x.title_lines) + "</h1>" +
      '<div class="drop-hero__grid">' +
      '<div class="cover" data-tilt><div class="frame" role="img" aria-label="Cover art placeholder, ' + esc(x.title) + '">COVER ART — PLACEHOLDER<b>' + esc(x.title) + "</b></div></div>" +
      '<div><figure class="embed still"><figcaption class="visually-hidden">' + esc(x.title) + " — official video</figcaption>" +
      slotHTML("youtube", "Play the " + x.title + " video on YouTube", x.title + " (official video)", "Dir. " + v.director + " · " + x.runtime,
        '<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID?rel=0&amp;cc_load_policy=1" title="' + esc(x.title) + ' — CASS EMORY (official video)" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe>',
        [["YouTube", "https://youtube.com/@cassemory.demo"], ["Spotify", "https://open.spotify.demo/cassemory"], ["Apple Music", "https://music.apple.demo/cassemory"], ["Bandcamp", "https://cassemory.bandcamp.demo"]], still) +
      '<p class="still-strip">DIR. ' + esc(v.director).toUpperCase() + " · " + esc(x.runtime) + " · SHOT IN " + esc(x.city) + "</p>" +
      '<span class="credit">' + esc(v.still_credit) + '<span class="stock">' + esc(v.stock_credit) + "</span></span></figure>" +
      '<div class="ctas"><a class="btn btn--drop" href="' + watch + '">Watch the video</a><a class="btn btn--bone" href="' + stream + '">Stream it</a><a class="btn btn--bone" href="' + cap + '">The capsule</a></div>' +
      "</div></div></div>" +
      '<div class="drop-hero__wipe" aria-hidden="true"></div></section>';
  }

  function lyricsHTML(parts) {
    return '<div class="lyrics">' + parts.map(function (p) {
      return '<p class="part">' + (p.tag ? '<span class="tag">[' + esc(p.tag) + "]</span>" : "") + p.lines.map(function (l) { return '<span class="l">' + esc(l) + "</span>"; }).join("") + "</p>";
    }).join("") + "</div>";
  }

  function transcriptHTML(x) {
    var v = x.video || {};
    var out = (v.spoken || []).map(function (s) { return '<span class="who">' + esc(s.who) + "</span><p>" + esc(s.text) + "</p>"; }).join("");
    if (x.lyrics) out += '<span class="who">Lyrics</span>' + x.lyrics.map(function (p) { return "<p>" + (p.tag ? "[" + esc(p.tag) + "]<br>" : "") + p.lines.map(esc).join("<br>") + "</p>"; }).join("");
    return out;
  }

  function capsuleHTML(c, strip) {
    var items = strip ? c.items.slice(0, 4) : c.items;
    var closed = c.status === "closed";
    return '<div class="capsule-head"><h2 class="block block--sm fit mask" id="capsule-title">' + c.heading.map(function (l) { return '<span class="ln ' + l[1] + '">' + esc(l[0]) + "</span>"; }).join("") + '</h2><p class="meta" style="color:var(--ink)">' + esc(c.sub) + "</p></div>" +
      '<div class="products' + (strip ? "" : " products--6") + '" data-stagger="90">' + items.map(function (it) {
        var sizes = it.sizes ? '<ul class="sizes" aria-label="Sizes">' + it.sizes.map(function (s) { return '<li class="' + (s[1] ? "" : "out") + '">' + esc(s[0]) + (s[1] ? "" : '<span class="visually-hidden"> sold out</span>') + "</li>"; }).join("") + "</ul>" : "";
        var so = closed || it.soldout;
        return '<article class="product mask"><div class="frame" role="img" aria-label="Product placeholder: ' + esc(it.name) + '">PRODUCT — PLACEHOLDER<b>' + esc(it.short || it.name) + '</b><span class="alt" aria-hidden="true">ALT COLOURWAY — PLACEHOLDER<b>' + esc(it.short || it.name) + "</b></span></div>" +
          (so ? '<span class="soldout">SOLD OUT</span>' : "") + "<h3>" + esc(it.name) + '</h3><p class="price">' + esc(it.price) + "</p>" + sizes +
          '<p class="ship">Ships from Houston, 5 to 7 business days</p>' +
          '<a class="btn btn--flare-o btn--sm" href="' + esc(c.store + it.slug) + '" target="_blank" rel="noopener">' + (so ? "View" : "Add") + '<span class="visually-hidden"> ' + esc(it.name) + " (opens the store)</span></a></article>";
      }).join("") + "</div>" +
      '<p class="tiny" style="margin-top:20px">No countdown timers, no low-stock counters. ' + (closed ? "This capsule sold through and is closed; sold-out items stay listed." : "The capsule closes when it sells through.") + ' <a href="' + esc(c.links_base) + 'shop.html#sizing">Sizing</a> · <a href="' + esc(c.links_base) + 'shop.html#shipping">Shipping</a> · <a href="' + esc(c.links_base) + 'shop.html#returns">Returns</a></p>' +
      '<p class="tiny">Orders, payment and shipping are handled by the store platform. This site never collects card details.</p>';
  }

  function dropPageHTML(x, base) {
    var v = x.video;
    var s = x.stream;
    var html = heroHTML(x, base, false) + '<div class="wrap">';
    html += '<section id="video" class="drop-sec" aria-labelledby="h-video"><h2 id="h-video" class="block block--sm"><span class="ln w">THE</span><span class="ln c">VIDEO</span></h2>' +
      '<figure class="embed"><figcaption>' + esc(v.title) + " — dir. " + esc(v.director) + " — " + esc(x.runtime) + "</figcaption>" +
      slotHTML("youtube", "Play the " + v.title + " video on YouTube", v.title, "Dir. " + v.director + " · " + x.runtime,
        '<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID?rel=0&amp;cc_load_policy=1" title="' + esc(v.title) + ' — CASS EMORY" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe>',
        [["YouTube", "https://youtube.com/@cassemory.demo"], ["Spotify", "https://open.spotify.demo/cassemory"], ["Apple Music", "https://music.apple.demo/cassemory"], ["Bandcamp", "https://cassemory.bandcamp.demo"]], { src: base + v.still, alt: v.still_alt }) +
      '<span class="credit">' + esc(v.still_credit) + '<span class="stock">' + esc(v.stock_credit) + "</span></span></figure>" +
      '<dl class="crew" style="margin-top:18px">' + v.crew.map(function (c) { return "<dt>" + esc(c[0]) + "</dt><dd>" + esc(c[1]) + "</dd>"; }).join("") + "</dl>" +
      '<details class="tr" style="margin-top:12px"><summary>Transcript and lyrics</summary><div class="transcript">' + transcriptHTML(x) + "</div></details></section>";

    html += '<section id="stream" class="drop-sec" aria-labelledby="h-stream"><h2 id="h-stream" class="block block--sm"><span class="ln c">STREAM</span><span class="ln w">IT</span></h2>' +
      '<figure class="embed" style="max-width:720px"><figcaption>' + esc(x.title) + " — CASS EMORY" + (x.explicit ? ' <span class="explicit">EXPLICIT</span>' : "") + "</figcaption>" +
      slotHTML(x.tracks ? "spotify-album" : "spotify-track", "Play " + x.title + " on Spotify", x.title, x.runtime || "",
        '<iframe title="' + esc(x.title) + ' on Spotify" src="https://open.spotify.com/embed/' + (x.tracks ? "album" : "track") + '/SPOTIFY_ID" width="100%" height="' + (x.tracks ? 352 : 152) + '" frameborder="0" allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>',
        s.links.slice(0, 4)) + "</figure>" +
      '<ul class="platforms" aria-label="' + esc(x.title) + ' on every platform">' + s.links.map(function (l) { return '<li><a href="' + esc(l[1]) + '" rel="noopener">' + esc(l[0]) + "</a></li>"; }).join("") + "</ul>" +
      '<p class="tiny" style="margin-top:10px">If you want to own it rather than rent it, it is on Bandcamp.</p></section>';

    html += '<section id="lyrics" class="drop-sec" aria-labelledby="h-lyrics"><h2 id="h-lyrics" class="block block--sm"><span class="ln w">THE</span><span class="ln c">LYRICS</span></h2>';
    if (x.tracks) {
      html += x.tracks.map(function (t) {
        return '<div id="lyrics-' + slugify(t.title) + '" style="margin-bottom:34px"><h3 class="block" style="font-size:1.8rem;margin-bottom:10px"><span class="ln c">' + String(t.n).padStart(2, "0") + " · " + esc(t.title) + "</span></h3>" +
          '<p class="meta">' + esc(t.runtime) + (t.explicit ? ' <span class="explicit">EXPLICIT</span>' : "") + (t.drop ? ' · <a href="' + base + "drops/" + t.drop + '/index.html#lyrics">Also its own drop page →</a>' : "") + "</p>" +
          (t.lyrics ? lyricsHTML(t.lyrics) : '<p class="lyric-ph">LYRICS — PLACEHOLDER. In the live build every track carries its full lyric here, set exactly like the others.</p>') + "</div>";
      }).join("");
    } else if (x.lyrics) {
      html += lyricsHTML(x.lyrics);
    }
    html += '<p class="tiny">' + esc(x.publishing) + "</p></section>";

    html += '<section id="credits" class="drop-sec" aria-labelledby="h-credits"><h2 id="h-credits" class="block block--sm"><span class="ln c">CREDITS</span></h2><dl class="rec-credits">' +
      x.credits.map(function (c) { return "<dt>" + esc(c[0]) + "</dt><dd>" + esc(c[1]) + "</dd>"; }).join("") + "</dl></section>";

    html += '<section id="capsule" class="drop-sec" aria-labelledby="capsule-title">' + capsuleHTML(x.capsule, false) +
      '<p style="margin-top:22px"><a class="btn btn--drop" href="' + esc(x.capsule.store) + '" target="_blank" rel="noopener">Shop the ' + esc(x.title) + " capsule</a></p></section>";
    html += "</div>";
    return html;
  }

  function moreHTML(x, base) {
    return '<div class="wrap"><section class="drop-sec" aria-labelledby="h-more"><h2 id="h-more" class="block block--sm"><span class="ln w">MORE</span><span class="ln c">DROPS</span></h2><div class="more">' +
      x.more.map(function (m) { return '<a href="' + base + "drops/" + esc(m.slug) + '/index.html"><div class="frame" role="img" aria-label="Cover art placeholder, ' + esc(m.title) + '">COVER ART — PLACEHOLDER<b>' + esc(m.title) + "</b></div><h3>" + esc(m.title) + '</h3><span class="meta" style="color:var(--ink)">' + esc(m.type) + " · " + esc(m.year) + "</span></a>"; }).join("") +
      "</div></section></div>";
  }

  function injectLD(x, base) {
    var FIC = "Fictional demonstration content.";
    var graph = [];
    var rec = { "@type": x.tracks ? "MusicAlbum" : "MusicRecording", "name": x.title, "byArtist": { "@type": ["Person", "MusicGroup"], "name": "CASS EMORY", "disambiguatingDescription": "Fictional demonstration artist." }, "datePublished": x.date_iso, "disambiguatingDescription": FIC };
    if (x.duration_iso) rec.duration = x.duration_iso;
    if (x.tracks) { rec.numTracks = x.tracks.length; rec.track = x.tracks.map(function (t) { return { "@type": "MusicRecording", "position": t.n, "name": t.title, "disambiguatingDescription": FIC }; }); }
    else rec.recordingOf = { "@type": "MusicComposition", "name": x.title, "lyricist": { "@type": "Person", "name": "CASS EMORY" }, "publisher": { "@type": "Organization", "name": x.publisher_name }, "disambiguatingDescription": FIC };
    graph.push(rec);
    graph.push({ "@type": "VideoObject", "name": x.video.title, "description": x.title + " by CASS EMORY. Directed by " + x.video.director + ".", "thumbnailUrl": x.og_image, "uploadDate": x.date_iso, "duration": x.video.duration_iso, "director": { "@type": "Person", "name": x.video.director }, "transcript": ((x.video.spoken || []).map(function (s) { return s.text; }).join(" ") + " " + (x.lyrics || []).map(function (p) { return p.lines.join(" "); }).join(" ")).trim(), "disambiguatingDescription": FIC });
    x.capsule.items.forEach(function (it) {
      var avail = x.capsule.status === "closed" || it.soldout ? "https://schema.org/SoldOut" : "https://schema.org/InStock";
      graph.push({ "@type": "Product", "name": it.name, "size": it.sizes ? it.sizes.map(function (s) { return s[0]; }) : undefined, "offers": { "@type": "Offer", "price": it.price.replace(/[^0-9.]/g, ""), "priceCurrency": "USD", "availability": avail, "url": x.capsule.store + it.slug }, "disambiguatingDescription": FIC });
    });
    var s = d.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    d.head.appendChild(s);
  }

  function renderDrop(x) {
    EMBEDS = x.embeds || {};
    var base = root.getAttribute("data-root") || "";
    var mode = root.getAttribute("data-mode");
    if (mode === "home") {
      $("#drop-hero-slot").innerHTML = heroHTML(x, base, true);
      x.capsule.links_base = base;
      $("#capsule-slot").innerHTML = capsuleHTML(x.capsule, true);
    } else {
      x.capsule.links_base = base;
      d.title = x.title + " — CASS EMORY | Video, lyrics, streaming and the capsule [DEMO]";
      var md = $('meta[name="description"]');
      if (md) md.setAttribute("content", x.meta_description);
      $("#drop-main").innerHTML = dropPageHTML(x, base);
      $("#drop-more").innerHTML = moreHTML(x, base);
      injectLD(x, base);
    }
    boot();
  }

  function loadDrop() {
    var src = root.getAttribute("data-drop-src");
    var mirror = function () {
      var m = $("#drop-mirror");
      if (m) { try { return JSON.parse(m.textContent); } catch (e) {} }
      return null;
    };
    // On a web server drop.json is the source of truth. Opened from disk, browsers block the fetch,
    // so the inline mirror (a copy of drop.json) is used instead.
    if (location.protocol === "file:") {
      var mm = mirror();
      if (mm) renderDrop(mm); else root.innerHTML = '<p class="loading">Open this page through a web server to read drop.json.</p>';
      return;
    }
    fetch(src, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(renderDrop)
      .catch(function () { var mm = mirror(); if (mm) renderDrop(mm); });
  }

  /* =====================================================================
     BEHAVIOUR (runs after any drop render)
     ===================================================================== */
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    /* header: hard cut at 60px, inverts while an Ink hero is under it */
    var header = $(".site-header");
    var hero = $("[data-hero]");
    var heroOn = !!hero;
    var setHeader = function () {
      if (!header) return;
      header.classList.toggle("is-cut", scrollY > 60);
      header.classList.toggle("on-ink", heroOn);
    };
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        var r = es[0];
        heroOn = r.isIntersecting && r.boundingClientRect.bottom > 70;
        if (!reduce) hero.classList.toggle("is-leaving", r.intersectionRatio < 0.45 && r.boundingClientRect.top < 0);
        setHeader();
      }, { threshold: [0, 0.05, 0.2, 0.45, 0.6, 1] }).observe(hero);
    }
    setHeader();
    addEventListener("scroll", setHeader, { passive: true });

    /* cover tilt: scroll-linked -3deg → +3deg, single rAF, transform only */
    var cover = $("[data-tilt]");
    if (cover && hero && !reduce) {
      var ticking = false, h = hero.offsetHeight;
      addEventListener("resize", function () { h = hero.offsetHeight; });
      var tilt = function () {
        ticking = false;
        var t = Math.max(0, Math.min(1, scrollY / (h || 1)));
        cover.style.transform = "rotate(" + (-3 + 6 * t).toFixed(2) + "deg)";
      };
      tilt();
      addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(tilt); } }, { passive: true });
    }

    /* mobile takeover */
    var menu = $("#takeover"), btn = $(".menu-btn");
    if (menu && btn) {
      var close = $(".takeover__close", menu);
      $$("li", menu).forEach(function (li, i) { li.style.setProperty("--i", i); });
      var o = function () { menu.classList.add("is-open"); menu.removeAttribute("inert"); btn.setAttribute("aria-expanded", "true"); d.body.style.overflow = "hidden"; setTimeout(function () { close.focus(); }, 20); };
      var c = function (ret) { menu.classList.remove("is-open"); menu.setAttribute("inert", ""); btn.setAttribute("aria-expanded", "false"); d.body.style.overflow = ""; if (ret !== false) btn.focus(); };
      btn.addEventListener("click", o); close.addEventListener("click", c);
      $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { c(false); }); });
      d.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) c(); });
    }

    /* fit headline lines to the measure → solid rectangular blocks of ink */
    var fitAll = function () {
      $$(".fit").forEach(function (b) {
        var W = b.clientWidth;
        if (!W) return;
        $$(".ln", b).forEach(function (ln) {
          ln.style.fontSize = "100px";
          var w = ln.scrollWidth;
          if (w) ln.style.fontSize = Math.min(W / w * 100, 260).toFixed(2) + "px";
        });
      });
    };
    fitAll();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(fitAll);
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fitAll, 120); });

    /* mask-up reveals */
    $$("[data-stagger]").forEach(function (g) {
      var step = parseInt(g.getAttribute("data-stagger"), 10) || 90;
      $$(".mask", g).forEach(function (el, i) { el.style.setProperty("--d", Math.min(i * step, 720) + "ms"); });
    });
    var masks = $$(".mask");
    if (reduce || !("IntersectionObserver" in window)) masks.forEach(function (m) { m.classList.add("is-in"); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -10% 0px" });
      masks.forEach(function (m) { io.observe(m); });
    }

    /* marquee duplicate, aria-hidden */
    $$(".marquee").forEach(function (m) { var g = $(".marquee__group", m); if (g) { var cp = g.cloneNode(true); cp.setAttribute("aria-hidden", "true"); m.appendChild(cp); } });

    /* click-to-load embeds */
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-load]");
      if (!b) return;
      var slot = b.closest(".embed-slot");
      if (!slot || slot.getAttribute("data-loaded")) return;
      slot.setAttribute("data-loaded", "1");
      var src = slot.getAttribute("data-src");
      if (!src) {
        slot.appendChild($("template.ph", slot).content.cloneNode(true));
        var ph = $(".placeholder", slot); ph.tabIndex = -1; ph.focus({ preventScroll: true });
        b.remove();
        return;
      }
      var f = d.createElement("iframe"), ok = false;
      f.src = src; f.title = slot.getAttribute("data-title"); f.allow = "encrypted-media; fullscreen; picture-in-picture";
      f.addEventListener("load", function () { ok = true; });
      f.addEventListener("error", function () { fb(slot); });
      setTimeout(function () { if (!ok) fb(slot); }, 8000);
      slot.appendChild(f);
      b.remove();
    });
    function fb(slot) { $$("iframe", slot).forEach(function (n) { n.remove(); }); slot.appendChild($("template.fb", slot).content.cloneNode(true)); }

    /* remind-me → list anchor */
    $$("[data-remind]").forEach(function (a) { a.addEventListener("click", function () { setTimeout(function () { var em = d.getElementById("list-email"); if (em) em.focus({ preventScroll: true }); }, 60); }); });

    /* forms (demo) */
    $$("form[data-demo]").forEach(function (form) {
      var st = $(".form-status", form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = $("input[type=email]", form), emailOK = $("input[name=consent_email]", form);
        var phone = $("input[type=tel]", form), smsOK = $("input[name=consent_sms]", form);
        var err = "";
        if (form.hasAttribute("data-list")) {
          if (!email.value.trim() || !email.checkValidity()) err = "Add a valid email address.";
          else if (!emailOK.checked) err = "Tick the email box to join. It is never ticked for you.";
          else if (phone.value.trim() && !smsOK.checked) err = "You added a number but did not tick the SMS box, so no texts will be sent. Tick it, or clear the number.";
          else if (smsOK.checked && !phone.value.trim()) err = "Add a mobile number for text alerts, or untick the SMS box.";
        } else {
          var bad = $$("[required]", form).filter(function (f) { return !f.checkValidity(); });
          if (bad.length) { err = "Please fill in the required fields."; bad[0].focus(); }
        }
        if (err) { st.textContent = err; st.classList.add("is-error"); return; }
        st.classList.remove("is-error");
        st.textContent = form.getAttribute("data-success");
        form.reset();
      });
    });

    /* contact routing */
    var topic = d.getElementById("route-topic");
    if (topic) topic.addEventListener("change", function () {
      var o = topic.options[topic.selectedIndex];
      d.getElementById("route-to").textContent = o.getAttribute("data-to") ? "Goes to " + o.getAttribute("data-to") : "";
    });

    /* sticky CTA: after 35%, hidden while the capsule or the list is on screen */
    var sticky = $(".sticky");
    if (sticky) {
      var blockers = $$("#capsule, #list"), vis = new Map(), dismissed = ss("ce-sticky") === "1";
      var upd = function () {
        var max = d.documentElement.scrollHeight - innerHeight;
        var covered = Array.from(vis.values()).some(Boolean);
        var show = !dismissed && !covered && max > 0 && scrollY / max > 0.35;
        sticky.classList.toggle("is-on", show);
        if (show) sticky.removeAttribute("inert"); else sticky.setAttribute("inert", "");
      };
      if ("IntersectionObserver" in window) {
        var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { vis.set(e.target, e.isIntersecting); }); upd(); });
        blockers.forEach(function (b) { sio.observe(b); });
      }
      addEventListener("scroll", upd, { passive: true }); upd();
      $(".sticky__x", sticky).addEventListener("click", function () { dismissed = true; ss("ce-sticky", "1"); upd(); });
    }

    /* copy buttons */
    $$("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var el = d.getElementById(b.getAttribute("data-copy"));
        if (el && navigator.clipboard) navigator.clipboard.writeText(el.innerText.trim()).then(function () { var t = b.textContent; b.textContent = "COPIED"; setTimeout(function () { b.textContent = t; }, 1500); }, function () {});
      });
    });
  }

  if (root) loadDrop(); else boot();
})();
