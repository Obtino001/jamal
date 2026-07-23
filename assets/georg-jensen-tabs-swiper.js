/**
 * Reusable Georg Jensen Tabs + Swiper controller
 * Root: [data-gj-tabs-swiper]
 */
(function () {
  var SWIPER_CSS = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
  var SWIPER_JS = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  var loadingPromise = null;

  function loadAsset(tag, attrs) {
    return new Promise(function (resolve, reject) {
      if (tag === 'link' && document.querySelector('link[data-gj-swiper-css]')) {
        resolve();
        return;
      }
      if (tag === 'script' && window.Swiper) {
        resolve();
        return;
      }
      var el = document.createElement(tag);
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, attrs[key]);
      });
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function ensureSwiper() {
    if (window.Swiper) return Promise.resolve(window.Swiper);
    if (loadingPromise) return loadingPromise;

    loadAsset('link', {
      rel: 'stylesheet',
      href: SWIPER_CSS,
      'data-gj-swiper-css': 'true',
    });

    loadingPromise = loadAsset('script', {
      src: SWIPER_JS,
      'data-gj-swiper-js': 'true',
    }).then(function () {
      return window.Swiper;
    });

    return loadingPromise;
  }

  function syncWishlistButtons(root) {
    root.querySelectorAll('[data-gj-wishlist-toggle]').forEach(function (btn) {
      var handle = btn.getAttribute('data-product-handle') || '';
      var active = window.Wishlist ? Wishlist.has(handle) : false;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function bindWishlist(root) {
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gj-wishlist-toggle]');
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      var handle = btn.getAttribute('data-product-handle') || '';
      if (!handle || !window.Wishlist) return;
      Wishlist.toggle(handle);
      syncWishlistButtons(root);
    });
    syncWishlistButtons(root);
    document.addEventListener('wishlist:updated', function () {
      syncWishlistButtons(root);
    });
  }

  function updateArrowState(root, swiper) {
    var nextEl = root.querySelector('[data-gj-swiper-next]');
    var prevEl = root.querySelector('[data-gj-swiper-prev]');
    if (!swiper || !nextEl || !prevEl) return;
    prevEl.classList.toggle('swiper-button-disabled', swiper.isBeginning);
    nextEl.classList.toggle('swiper-button-disabled', swiper.isEnd);
    prevEl.disabled = swiper.isBeginning;
    nextEl.disabled = swiper.isEnd;
  }

  function createSwiper(Swiper, root, panelId) {
    var el = root.querySelector('[data-gj-swiper="' + panelId + '"]');
    if (!el) return null;
    if (el.swiper) {
      el.swiper.update();
      updateArrowState(root, el.swiper);
      return el.swiper;
    }

    var columns = parseInt(root.getAttribute('data-columns') || '4', 10);
    var space = parseInt(root.getAttribute('data-space') || '24', 10);

    var swiper = new Swiper(el, {
      slidesPerView: 1.15,
      spaceBetween: 16,
      grabCursor: true,
      watchOverflow: true,
      breakpoints: {
        550: { slidesPerView: 2, spaceBetween: 18 },
        750: { slidesPerView: 3, spaceBetween: space },
        1100: { slidesPerView: columns, spaceBetween: space },
      },
      on: {
        init: function () {
          updateArrowState(root, this);
        },
        slideChange: function () {
          updateArrowState(root, this);
        },
        resize: function () {
          updateArrowState(root, this);
        },
      },
    });

    return swiper;
  }

  function activateTab(root, tabId, Swiper) {
    var tabs = root.querySelectorAll('[data-gj-tab]');
    var panels = root.querySelectorAll('[data-gj-tab-panel]');

    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-gj-tab') === tabId;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-gj-tab-panel') === tabId;
      panel.classList.toggle('is-active', active);
      if (active) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });

    root.dataset.activeTab = tabId;
    var swiper = createSwiper(Swiper, root, tabId);
    if (swiper) {
      requestAnimationFrame(function () {
        swiper.update();
        swiper.slideTo(0, 0);
        updateArrowState(root, swiper);
      });
    }
  }

  function bindArrows(root) {
    var nextEl = root.querySelector('[data-gj-swiper-next]');
    var prevEl = root.querySelector('[data-gj-swiper-prev]');

    function activeSwiper() {
      var tabId = root.dataset.activeTab;
      var el = root.querySelector('[data-gj-swiper="' + tabId + '"]');
      return el && el.swiper;
    }

    if (nextEl) {
      nextEl.addEventListener('click', function () {
        var swiper = activeSwiper();
        if (swiper) swiper.slideNext();
      });
    }
    if (prevEl) {
      prevEl.addEventListener('click', function () {
        var swiper = activeSwiper();
        if (swiper) swiper.slidePrev();
      });
    }
  }

  function initRoot(root) {
    if (!root || root.dataset.gjTabsInit === 'true') return;
    root.dataset.gjTabsInit = 'true';

    ensureSwiper().then(function (Swiper) {
      bindArrows(root);
      bindWishlist(root);

      var firstTab = root.querySelector('[data-gj-tab].is-active') || root.querySelector('[data-gj-tab]');
      if (!firstTab) return;

      activateTab(root, firstTab.getAttribute('data-gj-tab'), Swiper);

      root.querySelectorAll('[data-gj-tab]').forEach(function (tab) {
        tab.addEventListener('click', function () {
          activateTab(root, tab.getAttribute('data-gj-tab'), Swiper);
        });
        tab.addEventListener('keydown', function (e) {
          var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-gj-tab]'));
          var index = tabs.indexOf(tab);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            var next = tabs[(index + 1) % tabs.length];
            next.focus();
            activateTab(root, next.getAttribute('data-gj-tab'), Swiper);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            var prev = tabs[(index - 1 + tabs.length) % tabs.length];
            prev.focus();
            activateTab(root, prev.getAttribute('data-gj-tab'), Swiper);
          }
        });
      });
    });
  }

  function boot() {
    document.querySelectorAll('[data-gj-tabs-swiper]').forEach(initRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (e) {
    if (!e.target) return;
    var root =
      e.target.querySelector('[data-gj-tabs-swiper]') ||
      (e.target.matches('[data-gj-tabs-swiper]') ? e.target : null);
    if (root) {
      root.dataset.gjTabsInit = '';
      initRoot(root);
    }
  });

  window.GeorgJensenTabsSwiper = {
    init: initRoot,
    ensureSwiper: ensureSwiper,
  };
})();
