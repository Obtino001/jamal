/**
 * WOC animations — Lovable-style scroll reveals.
 *
 * Strategy: Animate WHOLE containers/cards as a unit — not individual
 * headings/paragraphs inside them. Cards stagger one-by-one bottom→top.
 * Fast, clean, smooth.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SKIP = [
    '.section-header',
    '#shopify-section-header',
    'header',
    '.header-wrapper',
    'cart-drawer',
    '.cart-drawer',
    '.announcement-bar',
    'footer',
    '.footer',
    '[data-woc-no-reveal]',
  ].join(',');

  function skipped(el) {
    return !el || el.closest(SKIP);
  }

  function show(el) {
    el.classList.add('woc-anim--in');
  }

  function unlockNoReveal(root) {
    root = root || document;
    root.querySelectorAll('[data-woc-no-reveal]').forEach(function (el) {
      el.classList.add('woc-anim--in');
      el.querySelectorAll('.woc-anim').forEach(show);
      if (el.style && el.style.opacity === '0') {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
  }

  function applyRevealAttrs(el) {
    var type = (el.getAttribute('data-woc-reveal') || 'up').toLowerCase();
    el.classList.add('woc-anim', type === 'fade' ? 'woc-anim--fade' : 'woc-anim--up');

    var delay = el.getAttribute('data-woc-delay');
    var duration = el.getAttribute('data-woc-duration');
    var y = el.getAttribute('data-woc-y');
    var stagger = el.getAttribute('data-woc-stagger');
    var index = el.getAttribute('data-woc-index');

    if (duration) el.style.setProperty('--woc-duration', duration.includes('s') ? duration : duration + 's');
    if (y) el.style.setProperty('--woc-y', y.includes('px') ? y : y + 'px');

    var delaySec = delay ? parseFloat(delay) : 0;
    if (stagger != null && index != null) {
      delaySec = parseFloat(stagger) * parseFloat(index);
    }
    if (delaySec) el.style.setProperty('--woc-delay', delaySec + 's');
    el.dataset.wocAnimReady = '1';
  }

  /* ── Hero / first paint ────────────────────────────────────────── */
  function initPageLoad() {
    document.documentElement.classList.add('woc-anim-ready');

    var loadEls = Array.from(document.querySelectorAll('.woc-anim--load')).filter(function (el) {
      return !skipped(el);
    });

    if (REDUCED) {
      document.documentElement.classList.add('woc-loaded');
      document.querySelectorAll('.woc-anim').forEach(show);
      return;
    }

    if (!loadEls.length) {
      var first = document.querySelector('#MainContent > .shopify-section');
      if (first) {
        var picks = [];
        var line = first.querySelector('.luxury-line');
        var h1 = first.querySelector('h1');
        var sub = h1 && h1.parentElement ? h1.parentElement.querySelector(':scope > p') : null;
        var ctas = first.querySelector('.flex.flex-col.sm\\:flex-row, .flex.flex-col.gap-4');
        var usp = first.querySelector('.border-t.border-gold\\/15, [data-woc-hero-usp]');

        if (line) picks.push({ el: line, fade: true, delay: 0.2, dur: 1.0, y: 0 });
        if (h1) picks.push({ el: h1, fade: false, delay: 0.3, dur: 0.8, y: 30 });
        if (sub) picks.push({ el: sub, fade: true, delay: 0.5, dur: 0.7, y: 0 });
        if (ctas) picks.push({ el: ctas, fade: false, delay: 0.6, dur: 0.6, y: 16 });
        if (usp) picks.push({ el: usp, fade: false, delay: 0.8, dur: 0.6, y: 16 });

        picks.forEach(function (p) {
          if (skipped(p.el) || p.el.dataset.wocAnimReady === '1') return;
          p.el.classList.add('woc-anim', p.fade ? 'woc-anim--fade' : 'woc-anim--up', 'woc-anim--load');
          p.el.style.setProperty('--woc-delay', p.delay + 's');
          p.el.style.setProperty('--woc-duration', p.dur + 's');
          if (p.y) p.el.style.setProperty('--woc-y', p.y + 'px');
          p.el.dataset.wocAnimReady = '1';
          loadEls.push(p.el);
        });
      }
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add('woc-loaded');
        loadEls.forEach(show);
      });
    });
  }

  /* ── IntersectionObserver ──────────────────────────────────────── */
  function observeTargets(targets) {
    if (!targets.length) return;

    if (REDUCED) {
      targets.forEach(show);
      return;
    }

    var obs = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.01 }
    );

    targets.forEach(function (el) {
      obs.observe(el);
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        requestAnimationFrame(function () {
          show(el);
          obs.unobserve(el);
        });
      }
    });
  }

  /* ── Declarative reveals ───────────────────────────────────────── */
  function initDeclarativeReveals(root) {
    root = root || document;
    var els = Array.from(root.querySelectorAll('[data-woc-reveal]')).filter(function (el) {
      if (skipped(el)) return false;
      if (el.classList.contains('woc-anim--load')) return false;
      if (el.dataset.wocAnimReady === '1' && el.classList.contains('woc-anim')) return false;
      return true;
    });

    els.forEach(applyRevealAttrs);
    observeTargets(els);
    return els.length;
  }

  /* ── Auto-reveal: animate WHOLE blocks, not individual parts ──── */

  // Top-level "card" containers to animate as a unit
  var CARD_SEL = [
    // Dawn / Shopify cards
    '.card-wrapper',
    '.product-card-wrapper',
    '.collection-card-wrapper',
    '.article-card-wrapper',
    '.multicolumn-list__item',
    '.collage__item',
    '.blog__post',
    '.grid__item',
    'li.grid__item',
    '[data-woc-card]',
    // WOC custom cards
    '.woc-product-card',
    '.product-card',
  ].join(',');

  // Top-level content blocks to animate as a whole (NOT their children)
  var BLOCK_SEL = [
    '.banner__box',
    '.rich-text__blocks',
    '.image-with-text__content',
    '.image-with-text__media-item',
    '.newsletter__wrapper',
    '.video-section__media',
    '.collection-hero__inner',
  ].join(',');

  function markEl(el, delay, y) {
    if (el.dataset.wocAnimReady === '1') return false;
    el.classList.add('woc-anim', 'woc-anim--up');
    if (delay) el.style.setProperty('--woc-delay', delay + 's');
    el.style.setProperty('--woc-y', (y || 24) + 'px');
    el.style.setProperty('--woc-duration', '0.6s');
    el.dataset.wocAnimReady = '1';
    return true;
  }

  function initAutoReveals(root) {
    root = root || document;
    var sections = root.querySelectorAll('#MainContent > .shopify-section');

    sections.forEach(function (section, sectionIndex) {
      if (sectionIndex === 0) return;
      if (section.id && section.id.includes('header')) return;
      if (section.querySelector('[data-woc-reveal]')) return;

      var targets = [];

      /* ── Strategy: find the natural "chunks" of the section ── */

      // 1. Look for a grid/flex container with multiple children (card grid)
      var grids = Array.from(section.querySelectorAll(
        '.grid, [class*="grid-cols"], [class*="flex-wrap"], ul.list-unstyled, .multicolumn-list, .collection-list'
      )).filter(function (g) {
        return !skipped(g) && g.children.length >= 2;
      });

      grids.forEach(function (grid) {
        // Check if this grid has card-like children
        var children = Array.from(grid.children).filter(function (child) {
          return !skipped(child) && child.dataset.wocAnimReady !== '1';
        });

        if (children.length >= 2) {
          // Animate each child as a card with stagger
          children.forEach(function (child, i) {
            markEl(child, i * 0.08, 28);
            targets.push(child);
          });
        }
      });

      // 2. Also find standalone cards not inside a detected grid
      var cards = Array.from(section.querySelectorAll(CARD_SEL)).filter(function (el) {
        return !skipped(el) && el.dataset.wocAnimReady !== '1';
      });

      // Group by parent to stagger siblings together
      var cardParents = new Map();
      cards.forEach(function (card) {
        var parent = card.parentElement;
        if (!cardParents.has(parent)) cardParents.set(parent, []);
        cardParents.get(parent).push(card);
      });

      cardParents.forEach(function (siblings) {
        siblings.forEach(function (card, i) {
          markEl(card, i * 0.08, 28);
          targets.push(card);
        });
      });

      // 3. Find standalone content blocks
      var blocks = Array.from(section.querySelectorAll(BLOCK_SEL)).filter(function (el) {
        return !skipped(el) && el.dataset.wocAnimReady !== '1' && !el.closest(CARD_SEL);
      });

      blocks.forEach(function (el) {
        markEl(el, 0, 24);
        targets.push(el);
      });

      // 4. Section heading area — animate as ONE block
      //    Find the text-center or heading container and animate it whole
      var headingArea = section.querySelector(
        '.text-center, [class*="text-center"], .section-heading, .title-wrapper'
      );
      if (headingArea && !skipped(headingArea) && headingArea.dataset.wocAnimReady !== '1') {
        // Only if it's not inside a card
        if (!headingArea.closest(CARD_SEL)) {
          markEl(headingArea, 0, 20);
          targets.push(headingArea);
        }
      }

      // 5. Fallback: if nothing was found, just animate the section inner
      if (!targets.length) {
        var inner = section.querySelector(
          '.page-width, .container, .section, [class*="-section"], .gradient, [class*="mx-auto"]'
        ) || section;
        if (!skipped(inner) && inner.dataset.wocAnimReady !== '1') {
          markEl(inner, 0, 20);
          targets.push(inner);
        }
      }

      observeTargets(targets.filter(function (el) { return el.classList.contains('woc-anim'); }));
    });
  }

  function initScrollReveals(root) {
    initDeclarativeReveals(root);
    initAutoReveals(root);
  }

  function initCardHover() {
    document
      .querySelectorAll(
        '.card__media img, .product-card-wrapper .card__media img, .card-wrapper img, [data-woc-card] img'
      )
      .forEach(function (img) {
        img.classList.add('woc-card-media');
      });
  }

  function boot(root) {
    initPageLoad();
    initScrollReveals(root);
    unlockNoReveal(root);
    initCardHover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(document); });
  } else {
    boot(document);
  }

  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    var handleDesignModeUpdate = function (e) {
      if (e.target && typeof e.target.querySelectorAll === 'function') {
        initScrollReveals(e.target);
        initCardHover();
        e.target.querySelectorAll('.woc-anim').forEach(show);
        if (e.target.classList && e.target.classList.contains('woc-anim')) {
          show(e.target);
        }
      }
      document.querySelectorAll('.woc-anim:not(.woc-anim--in)').forEach(show);
      unlockNoReveal(document);
    };

    ['shopify:section:load', 'shopify:section:select', 'shopify:block:select', 'shopify:block:deselect'].forEach(
      function (evt) {
        document.addEventListener(evt, handleDesignModeUpdate);
      }
    );
  }
})();
