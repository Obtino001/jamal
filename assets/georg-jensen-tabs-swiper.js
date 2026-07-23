/**
 * Reusable Georg Jensen Tabs + Swiper controller
 * Works with any [data-gj-tabs-swiper] root on the page.
 */
(function () {
  var SWIPER_CSS = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
  var SWIPER_JS = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  var loadingPromise = null;

  function loadAsset(tag, attrs) {
    return new Promise(function (resolve, reject) {
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

    if (!document.querySelector('link[data-gj-swiper-css]')) {
      loadAsset('link', {
        rel: 'stylesheet',
        href: SWIPER_CSS,
        'data-gj-swiper-css': 'true',
      });
    }

    loadingPromise = loadAsset('script', {
      src: SWIPER_JS,
      'data-gj-swiper-js': 'true',
    }).then(function () {
      return window.Swiper;
    });

    return loadingPromise;
  }

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem('gj-wishlist') || '[]');
    } catch (e) {
      return [];
    }
  }

  function setWishlist(ids) {
    localStorage.setItem('gj-wishlist', JSON.stringify(ids));
  }

  function syncWishlistButtons(root) {
    var ids = getWishlist();
    root.querySelectorAll('[data-gj-wishlist-toggle]').forEach(function (btn) {
      var id = String(btn.getAttribute('data-product-id') || '');
      var active = ids.indexOf(id) !== -1;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function bindWishlist(root) {
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gj-wishlist-toggle]');
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();
      var id = String(btn.getAttribute('data-product-id') || '');
      if (!id) return;
      var ids = getWishlist();
      var idx = ids.indexOf(id);
      if (idx === -1) ids.push(id);
      else ids.splice(idx, 1);
      setWishlist(ids);
      syncWishlistButtons(root);
    });
    syncWishlistButtons(root);
  }

  function buildSwiper(Swiper, root, panelId) {
    var el = root.querySelector('[data-gj-swiper="' + panelId + '"]');
    if (!el || el.swiper) return el && el.swiper;

    var columns = parseInt(root.getAttribute('data-columns') || '4', 10);
    var space = parseInt(root.getAttribute('data-space') || '24', 10);
    var nextEl = root.querySelector('[data-gj-swiper-next]');
    var prevEl = root.querySelector('[data-gj-swiper-prev]');

    return new Swiper(el, {
      slidesPerView: 1.15,
      spaceBetween: 16,
      grabCursor: true,
      watchOverflow: true,
      navigation: {
        nextEl: nextEl,
        prevEl: prevEl,
      },
      breakpoints: {
        550: { slidesPerView: 2, spaceBetween: 18 },
        750: { slidesPerView: 3, spaceBetween: space },
        1100: { slidesPerView: columns, spaceBetween: space },
      },
    });
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

    var swiper = buildSwiper(Swiper, root, tabId);
    if (swiper) {
      swiper.update();
      swiper.slideTo(0, 0);
      // Rebind nav to shared arrows for active instance
      if (swiper.params.navigation) {
        swiper.navigation.destroy();
        swiper.params.navigation.nextEl = root.querySelector('[data-gj-swiper-next]');
        swiper.params.navigation.prevEl = root.querySelector('[data-gj-swiper-prev]');
        swiper.navigation.init();
        swiper.navigation.update();
      }
    }
  }

  function initRoot(root) {
    if (!root || root.dataset.gjTabsInit === 'true') return;
    root.dataset.gjTabsInit = 'true';

    ensureSwiper().then(function (Swiper) {
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

      bindWishlist(root);
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
    var root = e.target.querySelector('[data-gj-tabs-swiper]') || (e.target.matches('[data-gj-tabs-swiper]') ? e.target : null);
    if (root) {
      root.dataset.gjTabsInit = '';
      initRoot(root);
    }
  });

  // Expose for reuse from other sections
  window.GeorgJensenTabsSwiper = {
    init: initRoot,
    ensureSwiper: ensureSwiper,
  };
})();
