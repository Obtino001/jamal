/**
 * Georg Jensen header — search dropdown, mobile menu, wishlist badge
 */
(function () {
  function initHeader(root) {
    if (!root || root.dataset.gjHeaderInit === 'true') return;
    root.dataset.gjHeaderInit = 'true';

    var search = root.querySelector('[data-gj-search]');
    var searchToggle = root.querySelector('[data-gj-search-toggle]');
    var menuToggle = root.querySelector('[data-gj-menu-toggle]');
    var wishlistBadge = root.querySelector('[data-gj-wishlist-count]');

    function closeSearch() {
      if (search) search.classList.remove('is-open');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
    }

    function closeMenu() {
      root.classList.remove('is-menu-open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }

    if (searchToggle && search) {
      searchToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = search.classList.toggle('is-open');
        searchToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          var input = search.querySelector('input[type="search"], input[name="q"]');
          if (input) input.focus();
        }
      });
    }

    if (menuToggle) {
      menuToggle.addEventListener('click', function () {
        var open = root.classList.toggle('is-menu-open');
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        closeSearch();
      });
    }

    document.addEventListener('click', function (e) {
      if (search && !search.contains(e.target)) closeSearch();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSearch();
        closeMenu();
      }
    });

    function syncWishlist() {
      if (!wishlistBadge) return;
      var count = 0;
      if (window.Wishlist && typeof window.Wishlist.count === 'function') {
        count = window.Wishlist.count();
      } else {
        try {
          count = JSON.parse(localStorage.getItem('gj-wishlist') || '[]').length;
        } catch (err) {
          count = 0;
        }
      }
      wishlistBadge.textContent = String(count);
      wishlistBadge.hidden = count === 0;
    }

    syncWishlist();
    window.addEventListener('storage', syncWishlist);
    document.addEventListener('gj:wishlist-updated', syncWishlist);
    document.addEventListener('wishlist:updated', syncWishlist);
  }

  function boot() {
    document.querySelectorAll('[data-gj-header]').forEach(initHeader);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (e) {
    if (!e.target) return;
    var root =
      e.target.querySelector('[data-gj-header]') ||
      (e.target.matches('[data-gj-header]') ? e.target : null);
    if (root) {
      root.dataset.gjHeaderInit = '';
      initHeader(root);
    }
  });
})();
