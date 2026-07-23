/**
 * Georg Jensen collection — wishlist toggles on cards
 */
(function () {
  function sync(root) {
    var ids = [];
    try {
      ids = JSON.parse(localStorage.getItem('gj-wishlist') || '[]');
    } catch (e) {}
    root.querySelectorAll('[data-gj-wishlist-toggle]').forEach(function (btn) {
      var id = String(btn.getAttribute('data-product-id') || '');
      btn.classList.toggle('is-active', ids.indexOf(id) !== -1);
    });
  }

  function init(root) {
    if (!root || root.dataset.gjCollInit === 'true') return;
    root.dataset.gjCollInit = 'true';

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gj-wishlist-toggle]');
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();
      var id = String(btn.getAttribute('data-product-id') || '');
      if (!id) return;
      var ids = [];
      try {
        ids = JSON.parse(localStorage.getItem('gj-wishlist') || '[]');
      } catch (err) {}
      var idx = ids.indexOf(id);
      if (idx === -1) ids.push(id);
      else ids.splice(idx, 1);
      localStorage.setItem('gj-wishlist', JSON.stringify(ids));
      sync(root);
      document.dispatchEvent(new CustomEvent('gj:wishlist-updated'));
    });

    sync(root);

    var grid = root.querySelector('#ProductGridContainer');
    if (grid && window.MutationObserver) {
      new MutationObserver(function () {
        sync(root);
      }).observe(grid, { childList: true, subtree: false });
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
