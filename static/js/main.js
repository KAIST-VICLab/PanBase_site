/* PanBase project page: gallery (configuration picker, tile strips in carousels, image / error-map view,
 * compare dialog with a choice of both sides) with deferred tile loading. Vanilla JS, no dependencies.
 * Runs after family.js (nav, hero, tabs, tables, lightbox, BibTeX), whose helpers it takes from
 * window.Family. Every module is opt-in through markup and silently does nothing when its markup is absent.
 * Built on the GeoCR page's gallery script. */
(function () {
  'use strict';

  var F = window.Family;
  var $ = F.$, $$ = F.$$;
  var revealInRow = F.revealInRow, openDialog = F.openDialog, wireDialog = F.wireDialog, closeDialog = F.closeDialog;

  var ICON = {
    close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
    next: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>',
    split: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>'
  };

  /* ------------------------------------------------------------------
   * Gallery view: "image" or "error" (absolute error maps, where the
   *     paper figure has them).  One switch for the whole gallery.
   * ------------------------------------------------------------------ */
  var view = 'image';
  function tileSrc(img) {
    return (view === 'error' && img.getAttribute('data-err')) || img.getAttribute('data-img');
  }

  /* ------------------------------------------------------------------
   * Deferred media.  <img data-src> inside [data-defer-media] is only
   *     requested once it is really shown: its tab panel is visible, its
   *     carousel slide is the active one, and the block is near the
   *     viewport.  Hidden tabs / slides never download their tiles.
   * ------------------------------------------------------------------ */
  var deferRoots = [];
  function isShown(el, root) {
    for (var node = el; node && node !== root; node = node.parentElement) {
      if (node.hidden) return false;
      if (node.classList.contains('carousel-slide') && !node.classList.contains('is-active')) return false;
    }
    return true;
  }
  function loadDeferred(root) {
    if (!root._near) return;
    $$('img[data-src]', root).forEach(function (img) {
      if (!isShown(img, root)) return;
      img.removeAttribute('data-src');
      img.src = tileSrc(img);
    });
  }
  function refreshDeferred(from) {
    deferRoots.forEach(function (r) {
      if (!from || r.contains(from) || from.contains(r)) loadDeferred(r);
    });
  }
  function initDeferred() {
    deferRoots = $$('[data-defer-media]');
    deferRoots.forEach(function (root) {
      if (!('IntersectionObserver' in window)) { root._near = true; return; }
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !root._near) { root._near = true; loadDeferred(root); }
        });
      }, { rootMargin: '300px 0px' }).observe(root);
    });
  }

  // a tab switch (family.js) may reveal a panel whose tiles are still deferred
  document.addEventListener('family:tabselect', function (e) { refreshDeferred(e.target); });

  function syncViewSwitch() {
    $$('.gallery').forEach(function (g) {
      var panel = $$('.tabpanel', g).filter(function (x) { return !x.hidden; })[0];
      var has = !!(panel && $('[data-has-err]', panel));
      $$('[data-gallery-view]', g).forEach(function (group) {
        group.classList.toggle('is-off', !has);
        var err = $('button[data-view="error"]', group);
        err.disabled = !has;
        err.title = has ? '' : 'The base comparison has no error maps';
      });
    });
  }
  document.addEventListener('family:tabselect', function () { setTimeout(syncViewSwitch, 0); });

  function initViewSwitch() {
    syncViewSwitch();
    $$('[data-gallery-view]').forEach(function (group) {
      var btns = $$('button[data-view]', group);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          view = b.getAttribute('data-view');
          btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          $$('.gallery').forEach(function (g) { g.classList.toggle('is-error-view', view === 'error'); });
          // tiles already loaded switch now; deferred ones pick the view when they load
          $$('.strip img[data-img]').forEach(function (img) {
            if (!img.hasAttribute('data-src')) img.src = tileSrc(img);
          });
        });
      });
    });
  }

  /* ------------------------------------------------------------------
   * Carousel  [data-carousel] > .carousel-viewport > .carousel-track
   *    > .carousel-slide.  Controls are generated: counter "Scene k / N",
   *    dots, prev/next.  Keyboard arrows when focus is inside; swipe.
   * ------------------------------------------------------------------ */
  function initCarousels() {
    $$('[data-carousel]').forEach(function (root) {
      var viewport = $('.carousel-viewport', root);
      var track = $('.carousel-track', root);
      var slides = track ? $$('.carousel-slide', track) : [];
      var n = slides.length;
      if (!n) return;
      var label = root.getAttribute('data-label') || 'Slide';
      var index = 0;

      root.setAttribute('role', 'region');
      root.setAttribute('aria-roledescription', 'carousel');
      if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
      slides.forEach(function (s, i) {
        s.setAttribute('role', 'group');
        s.setAttribute('aria-roledescription', 'slide');
        if (!s.hasAttribute('aria-label')) s.setAttribute('aria-label', label + ' ' + (i + 1) + ' of ' + n);
      });

      var controls = $('.carousel-controls', root);
      if (!controls) {
        controls = document.createElement('div');
        controls.className = 'carousel-controls';
        root.insertBefore(controls, root.firstChild);
      }
      var dotsHtml = '';
      for (var i = 0; i < n; i++) {
        dotsHtml += '<button type="button" class="carousel-dot" aria-label="' + label + ' ' + (i + 1) + '"></button>';
      }
      controls.innerHTML =
        '<p class="carousel-status" aria-live="polite"><span class="carousel-counter"></span><span class="carousel-title"></span></p>' +
        '<div class="carousel-nav">' +
          '<div class="carousel-dots">' + dotsHtml + '</div>' +
          '<button type="button" class="carousel-btn carousel-prev" aria-label="Previous ' + label.toLowerCase() + '">' + ICON.prev + '</button>' +
          '<button type="button" class="carousel-btn carousel-next" aria-label="Next ' + label.toLowerCase() + '">' + ICON.next + '</button>' +
        '</div>';
      var counter = $('.carousel-counter', controls), titleEl = $('.carousel-title', controls);
      var dots = $$('.carousel-dot', controls);
      if (n < 2) { $('.carousel-nav', controls).hidden = true; }

      function offset(i) { return 'translateX(calc(' + (-100 * i) + '% - ' + (12 * i) + 'px))'; }
      function go(i) {
        var prev = slides[index];
        var active = document.activeElement;
        var hadFocus = !!(prev && active && prev.contains(active));
        var k0 = hadFocus ? $$('.tile-btn', prev).indexOf(active) : -1;
        index = (i + n) % n;
        track.style.transform = offset(index);
        slides.forEach(function (s, k) {
          var on = k === index;
          s.classList.toggle('is-active', on);
          s.setAttribute('aria-hidden', String(!on));
          if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
        });
        // keyboard users keep their place: the same tile on the new slide (or the carousel itself)
        if (hadFocus && slides[index] !== prev) {
          var target = (k0 >= 0 && $$('.tile-btn', slides[index])[k0]) || root;
          target.focus({ preventScroll: true });
        }
        dots.forEach(function (d, k) {
          if (k === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
        });
        counter.textContent = label + ' ' + (index + 1) + ' / ' + n;
        titleEl.textContent = slides[index].getAttribute('data-title') || '';
        refreshDeferred(root);
      }
      root.carouselGo = go;

      $('.carousel-prev', controls).addEventListener('click', function () { go(index - 1); });
      $('.carousel-next', controls).addEventListener('click', function () { go(index + 1); });
      dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });

      root.addEventListener('keydown', function (e) {
        if (e.target.closest('input, textarea, select, [role="tablist"], [contenteditable]')) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      });

      // touch / pen swipe (mouse users have the buttons)
      var sw = null, suppressClick = false;
      viewport.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' || n < 2) return;
        sw = { x: e.clientX, y: e.clientY, id: e.pointerId, active: false };
      });
      viewport.addEventListener('pointermove', function (e) {
        if (!sw || e.pointerId !== sw.id) return;
        var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (!sw.active) {
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            sw.active = true;
            root.classList.add('is-dragging');
            try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          } else if (Math.abs(dy) > 10) { sw = null; return; }
        }
        if (sw && sw.active) track.style.transform = 'translateX(calc(' + (-100 * index) + '% - ' + (12 * index) + 'px + ' + dx + 'px))';
      });
      function endSwipe(e) {
        if (!sw) return;
        var s = sw; sw = null;
        root.classList.remove('is-dragging');
        if (!s.active) return;
        var dx = e.clientX - s.x;
        suppressClick = true;
        setTimeout(function () { suppressClick = false; }, 60);
        if (e.type !== 'pointercancel' && Math.abs(dx) > Math.min(80, viewport.clientWidth * 0.15)) go(index + (dx < 0 ? 1 : -1));
        else go(index);
      }
      viewport.addEventListener('pointerup', endSwipe);
      viewport.addEventListener('pointercancel', endSwipe);
      viewport.addEventListener('click', function (e) {
        if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
      }, true);

      go(0);
    });
  }

  /* ------------------------------------------------------------------
   * Compare dialog: two images of a scene with a drag divider.
   *    Left and right are picked from the scene's tiles (default: the
   *    clicked tile against the ground truth).  "Crop" shows the crop of
   *    the figure, "Whole image" the full test image; "Error map" swaps
   *    both sides to their absolute error maps where they exist.
   * ------------------------------------------------------------------ */
  var cmp = null;
  function tileInfo(tile) {
    var img = $('img', tile);
    var m = $('.tile-m', tile), v = $('.tile-v', tile);
    return {
      tile: tile,
      name: m ? m.textContent.replace(/\s+/g, ' ').trim() : '',
      sub: v ? v.textContent.trim() : '',
      key: tile.getAttribute('data-key') || '',
      crop: img.getAttribute('data-img'),
      full: img.getAttribute('data-full'),
      err: img.getAttribute('data-err'),
      errFull: img.getAttribute('data-err-full'),
      w: +img.getAttribute('width') || 96,
      ours: tile.classList.contains('tile--ours'),
      gt: tile.classList.contains('tile--gt')
    };
  }
  // the other arm of a backbone pair ("PINO" <-> "PINO+PanBase"), or standalone PanBase for a classical method
  function counterpart(items, it) {
    var key = it.key, want = /\+PanBase$/.test(key) ? key.replace(/\+PanBase$/, '') : key + '+PanBase';
    var hit = items.filter(function (x) { return x.key === want; })[0];
    if (!hit && !it.ours) hit = items.filter(function (x) { return x.ours && x.err; })[0];
    if (!hit && it.ours) hit = items.filter(function (x) { return x !== it && x.err && !x.ours; }).slice(-1)[0];
    return hit || null;
  }

  function buildCompare() {
    var d = document.createElement('dialog');
    d.className = 'cmp';
    d.setAttribute('aria-labelledby', 'cmp-title');
    d.innerHTML =
      '<div class="cmp-head">' +
        '<div><p class="cmp-kicker"></p><h2 class="cmp-title" id="cmp-title"></h2></div>' +
        '<button type="button" class="icon-btn cmp-close" aria-label="Close">' + ICON.close + '</button>' +
      '</div>' +
      '<div class="cmp-body">' +
        '<div class="cmp-views">' +
          '<div class="seg" role="group" aria-label="Area"><button type="button" data-area="crop" aria-pressed="true">Crop</button><button type="button" data-area="full" aria-pressed="false">Whole image</button></div>' +
          '<div class="seg cmp-mode" role="group" aria-label="Content"><button type="button" data-mode="image" aria-pressed="true">Image</button><button type="button" data-mode="error" aria-pressed="false">Error map</button></div>' +
        '</div>' +
        '<input class="cmp-range visually-hidden" type="range" min="0" max="100" step="1" value="50" aria-label="Divider position (percent of the image showing the left side)">' +
        '<div class="cmp-stage">' +
          '<img class="cmp-img cmp-img--b" alt="" draggable="false">' +
          '<img class="cmp-img cmp-img--a" alt="" draggable="false">' +
          '<span class="cmp-label cmp-label--a"></span><span class="cmp-label cmp-label--b"></span>' +
          '<span class="cmp-handle" aria-hidden="true"><span class="cmp-knob">' + ICON.split + '</span></span>' +
        '</div>' +
        '<p class="cmp-note"></p>' +
        '<div class="cmp-pickers">' +
          '<label class="cmp-pick"><span class="cmp-pick-label">Left</span><select class="cmp-select" data-side="a"></select></label>' +
          '<button type="button" class="icon-btn cmp-swap" aria-label="Swap left and right">' + ICON.split + '</button>' +
          '<label class="cmp-pick"><span class="cmp-pick-label">Right</span><select class="cmp-select" data-side="b"></select></label>' +
        '</div>' +
        '<p class="cmp-hint"><span class="hint-pointer">Drag across the image or use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> &middot; <kbd>Esc</kbd> closes</span>' +
          '<span class="hint-touch">Drag across the image to move the divider</span></p>' +
      '</div>';
    document.body.appendChild(d);
    var c = {
      dlg: d, stage: $('.cmp-stage', d), range: $('.cmp-range', d), a: $('.cmp-img--a', d), b: $('.cmp-img--b', d),
      la: $('.cmp-label--a', d), lb: $('.cmp-label--b', d), selA: $('.cmp-select[data-side="a"]', d),
      selB: $('.cmp-select[data-side="b"]', d), note: $('.cmp-note', d), modeSeg: $('.cmp-mode', d),
      kicker: $('.cmp-kicker', d), title: $('.cmp-title', d), items: [], ia: 0, ib: 0, area: 'crop', mode: 'image'
    };
    function setPos(p) {
      p = Math.max(0, Math.min(100, p));
      c.stage.style.setProperty('--pos', p + '%');
      c.range.value = String(Math.round(p));
    }
    c.setPos = setPos;
    c.range.addEventListener('input', function () { setPos(+c.range.value); });
    var dragging = false;
    function fromEvent(e) {
      var r = c.stage.getBoundingClientRect();
      setPos(((e.clientX - r.left) / r.width) * 100);
    }
    c.stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      try { c.stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      fromEvent(e);
    });
    c.stage.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      c.stage.addEventListener(t, function () { dragging = false; });
    });
    d.addEventListener('keydown', function (e) {
      if (e.target === c.range) return;                       // native range handles its keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.target.closest('select, .seg')) return;          // let the menus and switches keep their keys
        e.preventDefault();
        setPos(+c.range.value + (e.key === 'ArrowLeft' ? -5 : 5));
      }
    });
    [c.selA, c.selB].forEach(function (sel) {
      sel.addEventListener('change', function () {
        if (sel === c.selA) c.ia = +sel.value; else c.ib = +sel.value;
        show();
      });
    });
    $('.cmp-swap', d).addEventListener('click', function () {
      var t = c.ia; c.ia = c.ib; c.ib = t;
      show();
    });
    $$('.seg button', d).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.hasAttribute('data-area')) c.area = b.getAttribute('data-area');
        else setMode(b.getAttribute('data-mode'));
        show();
      });
    });
    $('.cmp-close', d).addEventListener('click', function () { closeDialog(d); });
    d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); });   // backdrop
    wireDialog(d);

    function usable(it) { return c.mode === 'image' || !!it.err; }
    function setMode(mode) {
      c.mode = mode;
      if (mode === 'error') {
        var A = c.items[c.ia];
        if (!usable(A)) { c.ia = c.items.indexOf(c.items.filter(function (x) { return x.err; })[0]); A = c.items[c.ia]; }
        var B = c.items[c.ib];
        if (!usable(B) || B === A) { var cp = counterpart(c.items, A); c.ib = cp ? c.items.indexOf(cp) : c.ia; }
      } else if (c.items[c.ib] && !c.items[c.ib].gt) {
        var gt = c.items.filter(function (x) { return x.gt; })[0];
        if (gt) c.ib = c.items.indexOf(gt);
      }
    }
    c.setMode = setMode;

    function src(it) {
      if (c.mode === 'error') return c.area === 'full' ? it.errFull : it.err;
      return c.area === 'full' ? it.full : it.crop;
    }
    function show() {
      var A = c.items[c.ia], B = c.items[c.ib];
      if (!A || !B) return;
      var full = c.area === 'full';
      var scale = full ? c.fullScale : c.cropScale;
      var w = Math.round((full ? c.fullW : A.w) * scale) + 'px';
      c.dlg.style.setProperty('--cmp-w', w);
      c.stage.style.setProperty('--cmp-w', w);
      c.stage.classList.toggle('is-pixelated', !full && c.pixelated);
      c.a.src = src(A); c.a.alt = A.name;
      c.b.src = src(B); c.b.alt = B.name;
      var suffix = c.mode === 'error' ? ' · error' : '';
      c.la.textContent = A.name + suffix; c.la.classList.toggle('is-ours', A.ours);
      c.lb.textContent = B.name + suffix; c.lb.classList.toggle('is-ours', B.ours);
      c.title.innerHTML = '';
      c.title.appendChild(document.createTextNode(A.name + ' '));
      var vs = document.createElement('span'); vs.className = 'vs'; vs.textContent = 'vs';
      c.title.appendChild(vs);
      c.title.appendChild(document.createTextNode(' ' + B.name));
      c.note.textContent = (full ? c.noteFull : c.noteCrop) +
        (c.mode === 'error' ? ' Error maps: absolute error to the GT, averaged over all bands, on the scale of the paper figure.' : '');
      [[c.selA, c.ia, c.ib], [c.selB, c.ib, c.ia]].forEach(function (r) {
        $$('option', r[0]).forEach(function (o) {
          var i = +o.value;
          o.disabled = !usable(c.items[i]) || i === r[2];
        });
        r[0].value = String(r[1]);
      });
      $$('.seg button', c.dlg).forEach(function (b) {
        var on = b.getAttribute('data-area') === c.area || b.getAttribute('data-mode') === c.mode;
        b.setAttribute('aria-pressed', String(on));
      });
    }
    c.show = show;
    return c;
  }

  function openCompare(strip, tile) {
    var tiles = $$('.tile', strip.closest('.carousel-slide') || strip);
    if (!cmp) cmp = buildCompare();
    var c = cmp;
    c.items = tiles.map(tileInfo);
    var gt = c.items.filter(function (x) { return x.gt; })[0];
    var clicked = c.items.filter(function (x) { return x.tile === tile; })[0] || c.items[0];
    if (clicked === gt) clicked = c.items.filter(function (x) { return x.ours; })[0] || c.items[0];
    c.ia = c.items.indexOf(clicked);
    c.ib = gt ? c.items.indexOf(gt) : (c.ia === 0 ? 1 : 0);
    c.cropScale = parseFloat(strip.getAttribute('data-compare-scale')) || 2;
    c.fullScale = parseFloat(strip.getAttribute('data-full-scale')) || 2;
    c.fullW = +strip.getAttribute('data-full-w') || 256;
    c.pixelated = strip.hasAttribute('data-pixelated');
    c.noteCrop = strip.getAttribute('data-note-crop') || '';
    c.noteFull = strip.getAttribute('data-note-full') || '';
    var hasErr = c.items.some(function (x) { return x.err; });
    c.modeSeg.hidden = !hasErr;
    c.area = 'crop';
    c.setMode(hasErr && view === 'error' && clicked.err ? 'error' : 'image');

    var slide = strip.closest('.carousel-slide');
    c.kicker.textContent = strip.getAttribute('data-title') ||
      (slide && (slide.getAttribute('data-title') || slide.getAttribute('aria-label'))) || 'Comparison';
    [c.selA, c.selB].forEach(function (sel) {
      sel.innerHTML = '';
      var isRef = function (x) { return x.gt || x.tile.classList.contains('tile--input'); };
      [['Inputs and reference', true], ['Methods', false]].forEach(function (g) {
        var og = document.createElement('optgroup');
        og.label = g[0];
        c.items.forEach(function (it, i) {
          if (isRef(it) !== g[1]) return;
          var o = document.createElement('option');
          o.value = String(i);
          var db = /(\d+(?:\.\d+)?) dB$/.exec(it.sub);
          o.textContent = it.name + (db ? ' (' + db[1] + ' dB)' : '');
          og.appendChild(o);
        });
        if (og.children.length) sel.appendChild(og);
      });
    });
    c.setPos(50);
    openDialog(c.dlg);
    c.show();
    c.range.focus({ preventScroll: true });
  }

  /* Balanced rows: pick the column count auto-fill would use, then spread
   * the tiles evenly over the resulting rows (23 tiles at 8 per row -> 8,8,7
   * instead of 8,8,7 ... or 12,11).  Never upscales a tile beyond data-max-scale. */
  function balanceStrip(strip) {
    if (strip.hasAttribute('data-no-balance')) return;
    var tiles = $$('.tile', strip), N = tiles.length;
    var W = strip.clientWidth;
    if (!N || !W) return;
    var cs = getComputedStyle(strip);
    var min = parseFloat(cs.getPropertyValue('--tile-min')) || 140;
    min = Math.min(min, W / 3 - 7);
    var gap = parseFloat(cs.columnGap) || 10;
    var fit = Math.max(1, Math.floor((W + gap) / (min + gap)));
    var nat = parseFloat(strip.getAttribute('data-tile-px')) || 0;
    var maxScale = parseFloat(strip.getAttribute('data-max-scale')) || 1.6;
    var cols;
    if (strip.hasAttribute('data-pairs') && fit >= 2) {     // "X" and "X + PanBase" side by side, whole pairs per row
      var P = Math.ceil(N / 2), per = Math.floor(fit / 2);
      var prow = Math.ceil(P / per);
      per = Math.ceil(P / prow);
      while (nat && 2 * per < fit - 1 && (W - gap * (2 * per - 1)) / (2 * per) > nat * maxScale + 12) per++;
      cols = 2 * per;
    } else {
      var rows = Math.ceil(N / fit);
      cols = Math.min(fit, Math.ceil(N / rows));
      while (nat && cols < fit && (W - gap * (cols - 1)) / cols > nat * maxScale + 12) cols++;
    }
    strip.style.setProperty('--cols', String(cols));
    strip.setAttribute('data-cols', String(cols));
  }

  function initStrips() {
    var strips = $$('.strip');
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function (entries) {
        entries.forEach(function (en) { balanceStrip(en.target); });
      });
      strips.forEach(function (s) { ro.observe(s); });
    } else {
      strips.forEach(balanceStrip);
      window.addEventListener('resize', function () { strips.forEach(balanceStrip); });
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.tile-btn');
      if (!btn) return;
      var strip = btn.closest('.strip');
      if (strip) openCompare(strip, btn.closest('.tile'));
    });
  }

  F.onReady(function () {
    initDeferred();
    initViewSwitch();
    initCarousels();
    initStrips();
  });
})();
