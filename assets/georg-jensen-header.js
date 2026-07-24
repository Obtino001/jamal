/**
 * Georg Jensen header — search overlay, mobile menu, wishlist badge
 */
(function () {
  function initHeader(root) {
    if (!root || root.dataset.gjHeaderInit === 'true') return;
    root.dataset.gjHeaderInit = 'true';

    var search = root.querySelector('[data-gj-search]');
    var searchToggle = root.querySelector('[data-gj-search-toggle]');
    var searchClose = root.querySelector('[data-gj-search-close]');
    var searchBackdrop = root.querySelector('[data-gj-search-backdrop]');
    var searchPanel = root.querySelector('[data-gj-search-panel]');
    var menuToggle = root.querySelector('[data-gj-menu-toggle]');
    var wishlistBadge = root.querySelector('[data-gj-wishlist-count]');

    function setSearchOpen(open) {
      if (!search) return;

      if (open) {
        if (searchPanel) {
          searchPanel.removeAttribute('hidden');
          searchPanel.setAttribute('aria-hidden', 'false');
        }
        if (searchBackdrop) searchBackdrop.removeAttribute('hidden');
        // next frame so max-height can animate from 0
        requestAnimationFrame(function () {
          search.classList.add('is-open');
        });
        if (searchToggle) searchToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('gj-search-open');
        var input = search.querySelector('[data-gj-search-input], input[type="search"], input[name="q"]');
        if (input) {
          setTimeout(function () {
            input.focus();
          }, 120);
        }
        return;
      }

      search.classList.remove('is-open');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('gj-search-open');
      if (searchPanel) searchPanel.setAttribute('aria-hidden', 'true');
      setTimeout(function () {
        if (search.classList.contains('is-open')) return;
        if (searchPanel) searchPanel.setAttribute('hidden', '');
        if (searchBackdrop) searchBackdrop.setAttribute('hidden', '');
      }, 380);
    }

    function closeSearch() {
      setSearchOpen(false);
    }

    function closeMenu() {
      root.classList.remove('is-menu-open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }

    if (searchToggle && search) {
      searchToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        setSearchOpen(!search.classList.contains('is-open'));
      });
    }

    if (searchClose) {
      searchClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeSearch();
      });
    }

    if (searchBackdrop) {
      searchBackdrop.addEventListener('click', function () {
        closeSearch();
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
      if (!search || !search.classList.contains('is-open')) return;
      if (search.contains(e.target)) return;
      if (searchBackdrop && e.target === searchBackdrop) return;
      // On mobile, panel/backdrop are outside normal flow; still close on outside
      if (window.matchMedia('(max-width: 989px)').matches) return;
      closeSearch();
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
