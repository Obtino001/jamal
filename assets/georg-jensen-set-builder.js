/**
 * Fund-sæt builder — select remaining rings to complete a 3-set with cart.
 * 1 in cart + 2 selected = ready. 3 already in cart = complete.
 */
(function () {
  var MAX = 3;
  var SET_PRICE_LABEL = '1.200 DKK';
  var DUMMY_VARIANT_ID = 58234190725503;

  function rootRoutes() {
    return (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
  }

  function isQualifyingRing(item) {
    if (!item) return false;
    if (String(item.variant_id) === String(DUMMY_VARIANT_ID)) return false;
    var type = String(item.product_type || '').toLowerCase();
    var options = item.options || [];
    var hasSize =
      (Array.isArray(item.options_with_values) &&
        item.options_with_values.some(function (opt) {
          var name = String((opt && opt.name) || '').toLowerCase();
          return name.indexOf('size') !== -1 || name.indexOf('størrelse') !== -1 || name.indexOf('storrelse') !== -1;
        })) ||
      (Array.isArray(options) && options.length && String(options[0]).match(/^\d/));
    return (
      type.indexOf('ring') !== -1 ||
      type.indexOf('fund') !== -1 ||
      type.indexOf('smykke') !== -1 ||
      type.indexOf('ringe') !== -1 ||
      hasSize
    );
  }

  function countCartTowardSet(cart) {
    var rings = 0;
    var dummyQty = 0;
    (cart.items || []).forEach(function (item) {
      var qty = Number(item.quantity) || 0;
      if (String(item.variant_id) === String(DUMMY_VARIANT_ID)) {
        dummyQty += qty;
        return;
      }
      if (isQualifyingRing(item)) rings += qty;
    });
    if (dummyQty > 0 && rings === 0) return MAX;
    if (rings >= MAX) return MAX;
    return rings;
  }

  function initPanel(panel) {
    if (!panel || panel.dataset.setBuilderReady === 'true') return;
    panel.dataset.setBuilderReady = 'true';

    var selection = new Map();
    var cartRings = 0;

    function cards() {
      return panel.querySelectorAll('[data-gj-set-card]');
    }

    function neededFromPage() {
      return Math.max(0, MAX - Math.min(MAX, cartRings));
    }

    function selectedCount() {
      return selection.size;
    }

    function sizedCount() {
      var n = 0;
      selection.forEach(function (item) {
        if (item.variantId) n += 1;
      });
      return n;
    }

    function combinedCount() {
      return Math.min(MAX, cartRings + selectedCount());
    }

    function isCompleteInCart() {
      return neededFromPage() === 0;
    }

    function isReady() {
      var need = neededFromPage();
      if (need === 0) return false;
      return selectedCount() === need && sizedCount() === need;
    }

    function updateSummary() {
      var summary = panel.querySelector('[data-gj-set-count]');
      var total = panel.querySelector('[data-gj-set-total]');
      var btn = panel.querySelector('[data-gj-set-atc]');
      var count = combinedCount();
      var need = neededFromPage();

      if (summary) {
        if (isCompleteInCart()) {
          summary.textContent = 'Valgt: 3 af 3 — sættet er i kurven';
        } else if (cartRings > 0) {
          summary.textContent =
            'Valgt: ' + count + ' af ' + MAX + ' (' + cartRings + ' i kurv, vælg ' + need + ' mere)';
        } else {
          summary.textContent = 'Valgt: ' + count + ' af ' + MAX;
        }
      }

      if (total) {
        if (isReady() || isCompleteInCart()) total.removeAttribute('hidden');
        else total.setAttribute('hidden', '');
        total.textContent = SET_PRICE_LABEL;
      }

      if (btn) {
        var ready = isReady();
        btn.disabled = !ready;
        btn.setAttribute('aria-disabled', ready ? 'false' : 'true');
        if (isCompleteInCart()) {
          btn.textContent = 'SÆT ER I KURVEN';
        } else if (need === 1) {
          btn.textContent = 'LÆG SÆT I KURV';
        } else {
          btn.textContent = 'LÆG SÆT I KURV';
        }
      }
    }

    function setCardSelected(card, selected) {
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', selected ? 'true' : 'false');
      var sizeWrap = card.querySelector('[data-gj-set-size]');
      if (sizeWrap) {
        if (selected) sizeWrap.removeAttribute('hidden');
        else {
          sizeWrap.setAttribute('hidden', '');
          var sel = sizeWrap.querySelector('[data-gj-set-size-select]');
          if (sel) sel.selectedIndex = 0;
        }
      }
    }

    function toggleCard(card) {
      var id = card.getAttribute('data-product-id');
      if (!id) return;
      if (isCompleteInCart()) return;

      if (selection.has(id)) {
        selection.delete(id);
        setCardSelected(card, false);
        updateSummary();
        return;
      }

      if (selection.size >= neededFromPage()) return;

      selection.set(id, {
        productId: id,
        title: card.getAttribute('data-product-title') || '',
        variantId: null,
        variantTitle: '',
      });
      setCardSelected(card, true);
      updateSummary();
    }

    function onSizeChange(card, select) {
      var id = card.getAttribute('data-product-id');
      if (!id || !selection.has(id)) return;
      var option = select.options[select.selectedIndex];
      var item = selection.get(id);
      item.variantId = select.value ? Number(select.value) : null;
      item.variantTitle = option ? option.getAttribute('data-variant-title') || option.textContent : '';
      selection.set(id, item);
      updateSummary();
    }

    function refreshCartState() {
      return fetch(rootRoutes() + 'cart.js')
        .then(function (r) {
          return r.json();
        })
        .then(function (cart) {
          cartRings = countCartTowardSet(cart);
          if (selection.size > neededFromPage()) {
            var keep = neededFromPage();
            var keys = [];
            selection.forEach(function (_item, key) {
              keys.push(key);
            });
            keys.slice(keep).forEach(function (key) {
              selection.delete(key);
              var card = panel.querySelector('[data-gj-set-card][data-product-id="' + key + '"]');
              if (card) setCardSelected(card, false);
            });
          }
          updateSummary();
        })
        .catch(function () {
          updateSummary();
        });
    }

    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-gj-wishlist-toggle]')) return;
      if (e.target.closest('[data-gj-set-size]')) return;
      if (e.target.closest('.gj-reco-card__title')) return;
      var toggle = e.target.closest('[data-gj-set-toggle]');
      if (!toggle) return;
      e.preventDefault();
      var card = toggle.closest('[data-gj-set-card]');
      if (card) toggleCard(card);
    });

    panel.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-gj-set-size]')) e.stopPropagation();
    });

    panel.addEventListener('change', function (e) {
      var select = e.target.closest('[data-gj-set-size-select]');
      if (!select) return;
      var card = select.closest('[data-gj-set-card]');
      if (card) onSizeChange(card, select);
    });

    var btn = panel.querySelector('[data-gj-set-atc]');
    if (btn) {
      btn.addEventListener('click', function () {
        if (!isReady() || btn.classList.contains('is-loading')) return;
        var picks = [];
        selection.forEach(function (item) {
          picks.push(item);
        });
        var need = neededFromPage();
        if (picks.length !== need) return;

        btn.classList.add('is-loading');
        btn.disabled = true;

        function openAndRefresh(skipBundle) {
          document.dispatchEvent(new CustomEvent('opencart'));
          if (typeof window.refreshedCartDrawer === 'function') {
            return window.refreshedCartDrawer({ mode: 'add', skipBundle: !!skipBundle });
          }
        }

        function addPickedRings() {
          return fetch(rootRoutes() + 'cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              items: picks.map(function (item) {
                return { id: item.variantId, quantity: 1 };
              }),
            }),
          }).then(function (r) {
            if (!r.ok) throw new Error('Add failed');
            return r.json();
          });
        }

        var request;
        if (need === MAX) {
          var properties = {};
          picks.forEach(function (item, index) {
            var label = item.title || '';
            if (item.variantTitle && item.variantTitle !== 'Default Title') {
              label += ' - ' + item.variantTitle;
            }
            properties['Valg ' + (index + 1)] = label;
          });
          request = fetch(rootRoutes() + 'cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              items: [{
                id: DUMMY_VARIANT_ID,
                quantity: 1,
                properties: properties,
              }],
            }),
          }).then(function (r) {
            if (r.ok) return r.json().then(function () { return true; });
            return addPickedRings().then(function () { return false; });
          });
        } else {
          request = addPickedRings().then(function () { return false; });
        }

        request
          .then(function (usedDummy) {
            selection.clear();
            cards().forEach(function (card) {
              setCardSelected(card, false);
            });
            return openAndRefresh(usedDummy).then(function () {
              return refreshCartState();
            });
          })
          .catch(function (err) {
            console.error('Set builder ATC error:', err);
            alert('Kunne ikke tilføje sættet. Prøv igen.');
          })
          .finally(function () {
            btn.classList.remove('is-loading');
            updateSummary();
          });
      });
    }

    refreshCartState();
    document.addEventListener('gj:cart-updated', refreshCartState);
    document.addEventListener('opencart', function () {
      setTimeout(refreshCartState, 400);
    });
  }

  function initAll() {
    document.querySelectorAll('[data-gj-set-builder]').forEach(initPanel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
