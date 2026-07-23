/**
 * Georg Jensen PDP interactions — accordion, read more, mobile gallery, wishlist UI
 */
(function () {
  function initGeorgPdp(root) {
    if (!root || root.dataset.gjPdpInit === 'true') return;
    root.dataset.gjPdpInit = 'true';

    // Accordion
    root.querySelectorAll('.accordion-head').forEach(function (head) {
      var body = head.nextElementSibling;
      if (!body || !body.classList.contains('accordion-body')) return;
      head.setAttribute('aria-expanded', 'false');
      head.addEventListener('click', function () {
        var open = body.classList.toggle('is-open');
        head.classList.toggle('is-open', open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          head.click();
        }
      });
    });

    // Read more
    var desc = root.querySelector('.product-info_content_item');
    var readMore = root.querySelector('.product-info_content_item-read-more');
    if (desc && readMore) {
      var fullText = desc.getAttribute('data-full-text') || desc.textContent.trim();
      var collapsed = true;
      desc.classList.add('is-collapsed');

      // Hide toggle if short
      requestAnimationFrame(function () {
        if (desc.scrollHeight <= desc.clientHeight + 4) {
          readMore.hidden = true;
          desc.classList.remove('is-collapsed');
        }
      });

      readMore.addEventListener('click', function () {
        collapsed = !collapsed;
        desc.classList.toggle('is-collapsed', collapsed);
        readMore.textContent = collapsed
          ? readMore.getAttribute('data-more-label') || 'Read more'
          : readMore.getAttribute('data-less-label') || 'Read less';
      });
      readMore.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          readMore.click();
        }
      });
    }

    // Mobile image thumbs
    var slides = Array.prototype.slice.call(root.querySelectorAll('.product-image-carousel .product-image.main-image'));
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('.owl-thumbs .thumb'));
    if (slides.length) {
      slides[0].classList.add('is-active');
      thumbs.forEach(function (thumb, index) {
        thumb.addEventListener('click', function () {
          slides.forEach(function (s) {
            s.classList.remove('is-active');
          });
          thumbs.forEach(function (t) {
            t.classList.remove('selected');
          });
          if (slides[index]) slides[index].classList.add('is-active');
          thumb.classList.add('selected');
        });
      });
    }

    // Wishlist — shared window.Wishlist (handles)
    var wishAdd = root.querySelector('[data-gj-wishlist-add], .add-remove-wishlist.add');
    var wishRemove = root.querySelector('[data-gj-wishlist-remove], .add-remove-wishlist.remove');
    var productHandle =
      (wishAdd && wishAdd.getAttribute('data-product-handle')) ||
      (wishRemove && wishRemove.getAttribute('data-product-handle')) ||
      '';

    function syncWishlistUI() {
      if (!wishAdd || !window.Wishlist || !productHandle) return;
      var active = Wishlist.has(productHandle);
      wishAdd.classList.toggle('is-active', active);
      wishAdd.style.display = active ? 'none' : '';
      if (wishRemove) wishRemove.style.display = active ? '' : 'none';
    }

    function toggleWishlist(add) {
      if (!window.Wishlist || !productHandle) return;
      if (add) Wishlist.add(productHandle);
      else Wishlist.remove(productHandle);
      syncWishlistUI();
    }

    if (wishAdd) {
      wishAdd.addEventListener('click', function () {
        toggleWishlist(true);
      });
      wishAdd.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleWishlist(true);
        }
      });
    }
    if (wishRemove) {
      wishRemove.addEventListener('click', function () {
        toggleWishlist(false);
      });
    }
    syncWishlistUI();
    document.addEventListener('wishlist:updated', syncWishlistUI);

    // Variant picker (CHOOSE SIZE) → update id + price + ATC state
    var form = root.querySelector('form[data-type="add-to-cart-form"]');
    var variantInput = form && form.querySelector('input[name="id"]');
    var priceEl = root.querySelector('[data-gj-price]');
    var compareEl = root.querySelector('[data-gj-compare]');
    var atcBtns = root.querySelectorAll('[data-gj-atc]');
    var variantDataEl = root.querySelector('[data-gj-variants]');
    var selects = root.querySelectorAll('.variation-select, [data-gj-variation-select]');
    var pickers = root.querySelectorAll('[data-gj-size-picker]');

    if (variantDataEl && variantInput && selects.length) {
      var variants = [];
      try {
        variants = JSON.parse(variantDataEl.textContent);
      } catch (e) {
        variants = [];
      }

      function selectedOptions() {
        return Array.prototype.map.call(selects, function (s) {
          return s.value;
        });
      }

      function allOptionsChosen() {
        return selectedOptions().every(function (v) {
          return v != null && String(v).length > 0;
        });
      }

      function findVariant(opts) {
        if (!opts.length || opts.some(function (o) { return !o; })) return null;
        return variants.find(function (v) {
          return opts.every(function (opt, i) {
            return v.options[i] === opt;
          });
        });
      }

      function formatMoney(cents) {
        if (window.Shopify && typeof Shopify.formatMoney === 'function') {
          var format = (window.theme && theme.moneyFormat) || '{{amount}}';
          return Shopify.formatMoney(cents, format);
        }
        var fmt = root.getAttribute('data-money-format') || '{{amount}}';
        var amount = (cents / 100).toFixed(2).replace('.', ',');
        return fmt.replace(/\{\{\s*amount\s*\}\}/, amount).replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, amount);
      }

      function syncDeliveryNote() {
        var note = root.querySelector('[data-gj-delivery-note]');
        if (!note) return;
        if (allOptionsChosen()) note.removeAttribute('hidden');
        else note.setAttribute('hidden', '');
      }

      function setPickerSelected(picker, value) {
        var label = picker.querySelector('[data-gj-size-trigger-label]');
        var placeholder = picker.getAttribute('data-placeholder') || 'Choose size';
        if (value) {
          picker.classList.add('is-selected');
          if (label) label.textContent = value;
        } else {
          picker.classList.remove('is-selected');
          if (label) label.textContent = placeholder;
        }
      }

      function applyVariant(variant) {
        if (!variant) {
          atcBtns.forEach(function (btn) {
            btn.disabled = true;
            btn.setAttribute('aria-disabled', 'true');
            var label = btn.querySelector('[data-gj-atc-label]');
            if (label) {
              label.textContent = allOptionsChosen()
                ? btn.getAttribute('data-unavailable-label') || 'Unavailable'
                : btn.getAttribute('data-available-label') || 'Add to basket';
            }
          });
          if (variantInput) variantInput.disabled = true;
          syncDeliveryNote();
          return;
        }
        variantInput.value = variant.id;
        variantInput.disabled = !variant.available;
        if (priceEl) priceEl.textContent = variant.price_formatted || formatMoney(variant.price);
        if (compareEl) {
          if (variant.compare_at_price && variant.compare_at_price > variant.price) {
            compareEl.textContent = variant.compare_at_price_formatted || formatMoney(variant.compare_at_price);
            compareEl.hidden = false;
          } else {
            compareEl.hidden = true;
          }
        }
        atcBtns.forEach(function (btn) {
          btn.disabled = !variant.available;
          btn.setAttribute('aria-disabled', variant.available ? 'false' : 'true');
          var label = btn.querySelector('[data-gj-atc-label]');
          if (label) {
            label.textContent = variant.available
              ? btn.getAttribute('data-available-label') || 'Add to basket'
              : btn.getAttribute('data-soldout-label') || 'Sold out';
          }
        });
        var mobilePrice = root.querySelector('[data-gj-mobile-price]');
        if (mobilePrice) mobilePrice.textContent = variant.price_formatted || formatMoney(variant.price);
        syncDeliveryNote();
      }

      function closePicker(picker) {
        picker.classList.remove('is-open');
        var trigger = picker.querySelector('[data-gj-size-trigger]');
        var panel = picker.querySelector('[data-gj-size-panel]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
      }

      function openPicker(picker) {
        pickers.forEach(function (p) {
          if (p !== picker) closePicker(p);
        });
        picker.classList.add('is-open');
        var trigger = picker.querySelector('[data-gj-size-trigger]');
        var panel = picker.querySelector('[data-gj-size-panel]');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        if (panel) panel.hidden = false;
      }

      // Start with no size chosen (GJ: CHOOSE SIZE first)
      atcBtns.forEach(function (btn) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      });
      if (variantInput) variantInput.disabled = true;

      pickers.forEach(function (picker) {
        var trigger = picker.querySelector('[data-gj-size-trigger]');
        var select = picker.querySelector('[data-gj-variation-select], .variation-select');
        var options = picker.querySelectorAll('[data-gj-size-option]');

        if (trigger) {
          trigger.addEventListener('click', function () {
            if (picker.classList.contains('is-open')) closePicker(picker);
            else openPicker(picker);
          });
        }

        options.forEach(function (optBtn) {
          optBtn.addEventListener('click', function () {
            var value = optBtn.getAttribute('data-value');
            if (select) {
              select.value = value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            options.forEach(function (o) {
              var on = o === optBtn;
              o.classList.toggle('is-selected', on);
              o.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            setPickerSelected(picker, value);
            closePicker(picker);
          });
        });
      });

      document.addEventListener('click', function (e) {
        if (!root.contains(e.target)) return;
        if (e.target.closest('[data-gj-size-picker]')) return;
        pickers.forEach(closePicker);
      });

      selects.forEach(function (select) {
        select.addEventListener('change', function () {
          applyVariant(findVariant(selectedOptions()));
        });
      });
    }

    // Mobile ATC mirror click → submit main form
    var mobileAtc = root.querySelector('[data-gj-mobile-atc]');
    if (mobileAtc && form) {
      mobileAtc.addEventListener('click', function () {
        var submit = form.querySelector('[type="submit"]');
        if (submit && !submit.disabled) submit.click();
      });
    }
  }

  function boot() {
    document.querySelectorAll('[data-gj-pdp]').forEach(initGeorgPdp);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (e) {
    if (e.target) {
      var root = e.target.querySelector('[data-gj-pdp]') || (e.target.matches('[data-gj-pdp]') ? e.target : null);
      if (root) {
        root.dataset.gjPdpInit = '';
        initGeorgPdp(root);
      }
    }
  });
})();
