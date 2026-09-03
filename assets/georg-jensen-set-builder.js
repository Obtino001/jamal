/**
 * Fund-sæt builder — select 3 rings + sizes, add as set (1.200 DKK via cart bundle).
 * Root panel: [data-gj-set-builder]
 */
(function () {
  var MAX = 3;
  var SET_PRICE_LABEL = '1.200 DKK';

  function rootRoutes() {
    return (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
  }

  function initPanel(panel) {
    if (!panel || panel.dataset.setBuilderReady === 'true') return;
    panel.dataset.setBuilderReady = 'true';

    var selection = new Map();

    function cards() {
      return panel.querySelectorAll('[data-gj-set-card]');
    }

    function summaryEl() {
      return panel.querySelector('[data-gj-set-count]');
    }

    function totalEl() {
      return panel.querySelector('[data-gj-set-total]');
    }

    function atcBtn() {
      return panel.querySelector('[data-gj-set-atc]');
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

    function isReady() {
      return selectedCount() === MAX && sizedCount() === MAX;
    }

    function updateSummary() {
      var count = selectedCount();
      var summary = summaryEl();
      var total = totalEl();
      var btn = atcBtn();
      if (summary) summary.textContent = 'Valgt: ' + count + ' af ' + MAX;
      if (total) {
        if (isReady()) total.removeAttribute('hidden');
        else total.setAttribute('hidden', '');
        total.textContent = SET_PRICE_LABEL;
      }
      if (btn) {
        var ready = isReady();
        btn.disabled = !ready;
        btn.setAttribute('aria-disabled', ready ? 'false' : 'true');
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

      if (selection.has(id)) {
        selection.delete(id);
        setCardSelected(card, false);
        updateSummary();
        return;
      }

      if (selection.size >= MAX) return;

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
      var variantId = select.value ? Number(select.value) : null;
      var item = selection.get(id);
      item.variantId = variantId;
      item.variantTitle = option ? option.getAttribute('data-variant-title') || option.textContent : '';
      selection.set(id, item);
      updateSummary();
    }

    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-gj-wishlist-toggle]')) return;
      if (e.target.closest('[data-gj-set-size]')) return;
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

    var btn = atcBtn();
    if (btn) {
      btn.addEventListener('click', function () {
        if (!isReady() || btn.classList.contains('is-loading')) return;
        var items = [];
        selection.forEach(function (item) {
          items.push({ id: item.variantId, quantity: 1 });
        });
        if (items.length !== MAX) return;

        btn.classList.add('is-loading');
        btn.disabled = true;

        fetch(rootRoutes() + 'cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: items }),
        })
          .then(function (r) {
            if (!r.ok) throw new Error('Add failed');
            return r.json();
          })
          .then(function () {
            selection.clear();
            cards().forEach(function (card) {
              setCardSelected(card, false);
            });
            updateSummary();
            if (typeof window.refreshedCartDrawer === 'function') {
              return window.refreshedCartDrawer({ mode: 'add' });
            }
          })
          .then(function () {
            document.dispatchEvent(new CustomEvent('opencart'));
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

    updateSummary();
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
