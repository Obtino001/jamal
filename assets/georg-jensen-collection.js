/**
 * Georg Jensen collection — keep wishlist hearts in sync after facet AJAX
 * Click handling lives in wishlist.js (global [data-gj-wishlist-toggle])
 */
(function () {
  function sync(root) {
    if (window.Wishlist && typeof window.Wishlist.syncToggleButtons === 'function') {
      window.Wishlist.syncToggleButtons(root || document);
      return;
    }
    if (!window.Wishlist) return;
    (root || document).querySelectorAll('[data-gj-wishlist-toggle]').forEach(function (btn) {
      var handle = btn.getAttribute('data-product-handle') || '';
      btn.classList.toggle('is-active', Wishlist.has(handle));
    });
  }

  function init(root) {
    if (!root || root.dataset.gjCollInit === 'true') return;
    root.dataset.gjCollInit = 'true';

    sync(root);
    document.addEventListener('wishlist:updated', function () {
      sync(root);
    });

    var grid = root.querySelector('#ProductGridContainer');
    if (grid && window.MutationObserver) {
      new MutationObserver(function () {
        sync(root);
      }).observe(grid, { childList: true, subtree: true });
    }
  }

  function boot() {
    document.querySelectorAll('[data-gj-collection]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (e) {
    if (!e.target) return;
    var root =
      e.target.querySelector('[data-gj-collection]') ||
      (e.target.matches('[data-gj-collection]') ? e.target : null);
    if (root) {
      root.dataset.gjCollInit = '';
      init(root);
    }
  });
})();
