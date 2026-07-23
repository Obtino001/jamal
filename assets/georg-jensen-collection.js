/**
 * Georg Jensen collection — wishlist toggles on cards (handles)
 */
(function () {
  function sync(root) {
    if (!window.Wishlist) return;
    root.querySelectorAll('[data-gj-wishlist-toggle]').forEach(function (btn) {
      var handle = btn.getAttribute('data-product-handle') || '';
      btn.classList.toggle('is-active', Wishlist.has(handle));
    });
  }

  function init(root) {
    if (!root || root.dataset.gjCollInit === 'true') return;
    root.dataset.gjCollInit = 'true';

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gj-wishlist-toggle]');
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      var handle = btn.getAttribute('data-product-handle') || '';
      if (!handle || !window.Wishlist) return;
      Wishlist.toggle(handle);
      sync(root);
    });

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
