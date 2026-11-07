/* ============================================================
   Poster Lab Store — desktop experience enhancements
   Works alongside script.min.js without needing a rebuild.
   - makes “N products” act like a View all button
   - adds desktop previous/next arrows to every category row
   - fixes native image dragging so mouse-drag scrolling works
   - adds scroll reveal + subtle 3D tilt
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('enh');

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* older browser */ }

  var finePointer = false;
  try {
    finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) { /* older browser */ }

  function isArabic() {
    return (root.lang || '').toLowerCase().indexOf('ar') === 0 || root.dir === 'rtl';
  }

  function label(en, ar) {
    return isArabic() ? ar : en;
  }

  /* ----------------------------------------------------------
     0. Price migration safety net.
        Products edited through the admin panel (or pulled from
        Firestore) can override the built-in prices with the old
        50 / 70 / 90 / 110 values. Bump them once to the current
        60 / 80 / 100 / 120 set so the +10 update always shows.
        The match is exact, so already-updated products are left
        alone and repeat runs cannot add another 10.
     ---------------------------------------------------------- */
  var PRODUCTS_KEY = 'pls-products';
  var LEGACY_SIZES = { '20x30': 50, '30x40': 70, '40x50': 90, '50x70': 110 };
  var CURRENT_SIZES = { '20x30': 60, '30x40': 80, '40x50': 100, '50x70': 120 };

  function migrateProductPrices(product) {
    if (!product || typeof product !== 'object') return false;
    var changed = false;
    var sizes = product.sizes;

    if (sizes && typeof sizes === 'object') {
      var isLegacy = true;
      for (var key in LEGACY_SIZES) {
        if (Object.prototype.hasOwnProperty.call(LEGACY_SIZES, key) &&
            sizes[key] !== LEGACY_SIZES[key]) {
          isLegacy = false;
          break;
        }
      }
      if (isLegacy) {
        for (var size in CURRENT_SIZES) {
          if (Object.prototype.hasOwnProperty.call(CURRENT_SIZES, size)) {
            sizes[size] = CURRENT_SIZES[size];
          }
        }
        changed = true;
      }
    }

    if (product.basePrice === 50) {
      product.basePrice = 60;
      changed = true;
    }
    return changed;
  }

  function migrateProductList(list) {
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      if (migrateProductPrices(list[i])) changed = true;
    }
    return changed;
  }

  var nativeSetItem = null;
  try {
    nativeSetItem = window.Storage && window.Storage.prototype.setItem;
    if (nativeSetItem) {
      window.Storage.prototype.setItem = function (key, value) {
        if (key === PRODUCTS_KEY && typeof value === 'string') {
          try {
            var parsed = JSON.parse(value);
            if (Array.isArray(parsed) && migrateProductList(parsed)) {
              value = JSON.stringify(parsed);
            }
          } catch (err) { /* not product data, store as-is */ }
        }
        return nativeSetItem.call(this, key, value);
      };
    }
  } catch (err) { nativeSetItem = null; }

  try {
    var storedProducts = window.localStorage.getItem(PRODUCTS_KEY);
    if (storedProducts) {
      var storedList = JSON.parse(storedProducts);
      if (Array.isArray(storedList) && migrateProductList(storedList)) {
        if (nativeSetItem) {
          nativeSetItem.call(window.localStorage, PRODUCTS_KEY, JSON.stringify(storedList));
        } else {
          window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(storedList));
        }
      }
    }
  } catch (err) { /* private mode / blocked storage */ }

  /* ----------------------------------------------------------
     1. Stop the browser from starting a native image/link drag.
        The old listener was registered as passive, so its
        preventDefault() was ignored and desktop drag-scroll died.
     ---------------------------------------------------------- */
  doc.addEventListener('dragstart', function (e) {
    var target = e.target;
    if (target && target.closest && target.closest('.category-scroll')) {
      e.preventDefault();
    }
  }, true);

  /* ----------------------------------------------------------
     2. Decorate category rows
     ---------------------------------------------------------- */
  var revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }

  function makeArrow(dir) {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-rail-btn cat-rail-' + (dir < 0 ? 'prev' : 'next');
    btn.setAttribute('aria-label', dir < 0
      ? label('Scroll posters left', 'مرر البوسترات لليسار')
      : label('Scroll posters right', 'مرر البوسترات لليمين'));
    btn.innerHTML = dir < 0
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    return btn;
  }

  function scrollRail(scroller, dir) {
    var rtl = false;
    try { rtl = getComputedStyle(scroller).direction === 'rtl'; } catch (e) { /* ignore */ }
    var amount = Math.max(240, Math.round(scroller.clientWidth * 0.82));
    var delta = dir * amount * (rtl ? -1 : 1);
    try {
      scroller.scrollBy({ left: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch (e) {
      scroller.scrollLeft += delta;
    }
  }

  function wireRail(rail, scroller) {
    var prev = rail.querySelector('.cat-rail-prev');
    var next = rail.querySelector('.cat-rail-next');
    if (!prev || !next) return;

    function update() {
      var max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      var overflow = max > 4;
      rail.classList.toggle('is-scrollable', overflow);
      var pos = Math.abs(scroller.scrollLeft);
      prev.disabled = !overflow || pos <= 2;
      next.disabled = !overflow || pos >= max - 2;
    }

    var ticking = false;
    function queueUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    prev.addEventListener('click', function () { scrollRail(scroller, -1); });
    next.addEventListener('click', function () { scrollRail(scroller, 1); });
    scroller.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    if ('ResizeObserver' in window) {
      try { new ResizeObserver(queueUpdate).observe(scroller); } catch (e) { /* ignore */ }
    }

    // Arrows are added before content images settle, so update twice.
    update();
    window.requestAnimationFrame(update);
    window.setTimeout(update, 350);
  }

  function wireTilt(card) {
    if (!finePointer || reduceMotion || card.dataset.tiltWired) return;
    card.dataset.tiltWired = 'true';

    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      card.style.setProperty('--tilt-y', ((px - 0.5) * 9).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-x', ((0.5 - py) * 7).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    }, { passive: true });

    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    }, { passive: true });
  }

  function decorateSection(section) {
    var scroller = section.querySelector('.category-scroll');
    if (!scroller) return;

    var cat = section.getAttribute('data-cat') || scroller.getAttribute('data-scroll') || '';
    if (!cat) {
      var viewAll = section.querySelector('.view-all-tile a[href*="cat="]');
      if (viewAll) {
        var match = /[?&]cat=([^&]+)/.exec(viewAll.getAttribute('href') || '');
        if (match) cat = decodeURIComponent(match[1]);
      }
    }
    var heading = section.querySelector('.section-heading');

    /* “N products” → working View-all link */
    if (heading && cat) {
      var count = heading.querySelector('.result-count');
      if (count && !count.classList.contains('result-count-link')) {
        var link = doc.createElement('a');
        link.className = 'result-count result-count-link';
        link.href = '?cat=' + encodeURIComponent(cat);
        link.setAttribute('aria-label', label(
          'View all ' + count.textContent.trim() + ' in this category',
          'عرض كل المنتجات في هذا القسم'
        ));
        link.textContent = count.textContent.trim();
        count.replaceWith(link);
      }
    }

    /* Wrap the row and add desktop arrows */
    if (!scroller.parentElement || !scroller.parentElement.classList.contains('category-rail')) {
      var rail = doc.createElement('div');
      rail.className = 'category-rail';
      scroller.parentNode.insertBefore(rail, scroller);
      rail.appendChild(scroller);

      var prev = makeArrow(-1);
      var next = makeArrow(1);
      rail.insertBefore(prev, scroller);
      rail.appendChild(next);

      wireRail(rail, scroller);
    }

    /* Images should never hijack a drag */
    var imgs = scroller.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) imgs[i].draggable = false;

    /* Subtle 3D tilt on desktop */
    var cards = scroller.querySelectorAll('.product-card');
    for (var j = 0; j < cards.length; j++) wireTilt(cards[j]);

    /* Reveal animation once the row is on screen */
    if (revealObserver) {
      if (!section.dataset.revealWired) {
        section.dataset.revealWired = 'true';
        revealObserver.observe(section);
      }
    } else {
      section.classList.add('in-view');
    }
  }

  function decorate() {
    var sections = doc.querySelectorAll('#categorySections .category-section');
    for (var i = 0; i < sections.length; i++) decorateSection(sections[i]);
  }

  var scheduled = false;
  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      decorate();
    });
  }

  /* Re-run whenever script.min.js re-renders the shop. */
  function watchShop() {
    var shop = doc.getElementById('categorySections');
    if (!shop) return;
    if ('MutationObserver' in window) {
      new MutationObserver(scheduleDecorate).observe(shop, { childList: true, subtree: true });
    }
    scheduleDecorate();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', watchShop, { once: true });
  } else {
    watchShop();
  }

  /* Language changes re-render the DOM; keep decorations in sync. */
  doc.addEventListener('click', function (e) {
    var target = e.target;
    if (target && target.closest && target.closest('[data-lang-toggle]')) {
      window.setTimeout(scheduleDecorate, 120);
    }
  }, true);
})();
