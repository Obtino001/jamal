/**
 * ============================================================
 * WISHLIST — Custom Web Components + card toggles
 * localStorage-backed wishlist for Shopify
 * ============================================================
 */

const Wishlist = {
    STORAGE_KEY: 'gj-wishlist',
    LEGACY_KEYS: ['mytruth_wishlist'],

    get() {
        try {
            this._migrate();
            const list = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
            return Array.isArray(list) ? list.filter(Boolean).map(String) : [];
        } catch {
            return [];
        }
    },

    _migrate() {
        if (localStorage.getItem(this.STORAGE_KEY)) return;
        for (const key of this.LEGACY_KEYS) {
            try {
                const legacy = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(legacy) && legacy.length) {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(legacy.map(String)));
                    return;
                }
            } catch (_) {}
        }
    },

    has(handle) {
        if (!handle) return false;
        return this.get().includes(String(handle));
    },

    add(handle) {
        handle = String(handle || '');
        if (!handle) return;
        const list = this.get();
        if (!list.includes(handle)) {
            list.push(handle);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            this._dispatch('wishlist:added', { handle });
            this._dispatch('wishlist:updated', { list });
            this._dispatch('gj:wishlist-updated', { list });
        }
    },

    remove(handle) {
        handle = String(handle || '');
        if (!handle) return;
        const list = this.get().filter((h) => h !== handle);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        this._dispatch('wishlist:removed', { handle });
        this._dispatch('wishlist:updated', { list });
        this._dispatch('gj:wishlist-updated', { list });
    },

    toggle(handle) {
        handle = String(handle || '');
        if (!handle) return;
        this.has(handle) ? this.remove(handle) : this.add(handle);
    },

    count() {
        return this.get().length;
    },

    _dispatch(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    },

    syncToggleButtons(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-gj-wishlist-toggle]').forEach((btn) => {
            const handle = btn.getAttribute('data-product-handle') || '';
            const active = this.has(handle);
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
        });
    }
};

window.Wishlist = Wishlist;

// Global card / heart toggles (collection, reco, carousel)
(function bindWishlistToggles() {
    function onClick(e) {
        const btn = e.target.closest('[data-gj-wishlist-toggle]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const handle = btn.getAttribute('data-product-handle') || '';
        if (!handle) return;
        Wishlist.toggle(handle);
        Wishlist.syncToggleButtons(document);
    }

    function boot() {
        document.addEventListener('click', onClick);
        Wishlist.syncToggleButtons(document);
        document.addEventListener('wishlist:updated', () => Wishlist.syncToggleButtons(document));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();

// ── WishlistButton ───────────────────────────────────────────
// Usage: <wishlist-button product-handle="my-product"></wishlist-button>
if (!customElements.get('wishlist-button')) {
    class WishlistButton extends HTMLElement {
        connectedCallback() {
            this.handle = this.getAttribute('product-handle');
            if (!this.handle) return;

            this._render();
            this._syncState();

            this._btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                Wishlist.toggle(this.handle);
            });

            document.addEventListener('wishlist:updated', () => this._syncState());
        }

        _render() {
            this.innerHTML = `
        <button class="wishlist-button" type="button" aria-label="Add to wishlist">
          <svg class="wishlist-button__icon wishlist-button__icon--outline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <svg class="wishlist-button__icon wishlist-button__icon--filled" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>`;
            this._btn = this.querySelector('.wishlist-button');
        }

        _syncState() {
            const active = Wishlist.has(this.handle);
            this._btn.classList.toggle('is-active', active);
            this._btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
            this._btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
    }

    customElements.define('wishlist-button', WishlistButton);
}

// ── WishlistCount ────────────────────────────────────────────
if (!customElements.get('wishlist-count')) {
    class WishlistCount extends HTMLElement {
        connectedCallback() {
            this._update();
            document.addEventListener('wishlist:updated', () => this._update());
            document.addEventListener('gj:wishlist-updated', () => this._update());
        }

        _update() {
            const count = Wishlist.count();
            this.textContent = count;
            this.hidden = count === 0;
            if (count === 0) this.setAttribute('data-empty', '');
            else this.removeAttribute('data-empty');
        }
    }

    customElements.define('wishlist-count', WishlistCount);
}

// ── WishlistPage ─────────────────────────────────────────────
// Usage: <wishlist-page data-empty-text="Your wishlist is empty"></wishlist-page>
if (!customElements.get('wishlist-page')) {
    class WishlistPage extends HTMLElement {
        connectedCallback() {
            this._emptyText = this.dataset.emptyText || 'Your wishlist is empty.';
            this._render();
            document.addEventListener('wishlist:updated', () => this._render());
        }

        async _render() {
            const handles = Wishlist.get();

            if (handles.length === 0) {
                this.innerHTML = `
          <div class="wishlist-page__empty">
            <p class="wishlist-page__empty-text">${this._emptyText}</p>
            <a href="/collections/all" class="button">Fortsätt handla</a>
          </div>`;
                return;
            }

            this.innerHTML = `<div class="wishlist-page__grid" role="list"></div>`;
            const grid = this.querySelector('.wishlist-page__grid');

            const results = await Promise.all(
                handles.map(handle =>
                    fetch(`/products/${handle}.js`)
                        .then(r => r.ok ? r.json() : null)
                        .catch(() => null)
                )
            );

            const products = results.filter(Boolean);

            if (products.length === 0) {
                this.innerHTML = `
          <div class="wishlist-page__empty">
            <p class="wishlist-page__empty-text">${this._emptyText}</p>
            <a href="/collections/all" class="button">Fortsätt handla</a>
          </div>`;
                return;
            }

            grid.innerHTML = products.map(p => this._cardHTML(p)).join('');

            // Wire up remove buttons
            grid.querySelectorAll('[data-wishlist-remove]').forEach(btn => {
                btn.addEventListener('click', () => {
                    Wishlist.remove(btn.dataset.wishlistRemove);
                });
            });

            // Wire up add-to-cart forms
            grid.querySelectorAll('.wishlist-card__form').forEach(form => {
                form.addEventListener('submit', async e => {
                    e.preventDefault();
                    const id = form.querySelector('[name="id"]').value;
                    const btn = form.querySelector('[type="submit"]');
                    const originalText = btn.textContent;
                    btn.textContent = 'Adding...';
                    btn.disabled = true;

                    try {
                        const resp = await fetch('/cart/add.js', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: parseInt(id), quantity: 1 })
                        });

                        if (resp.ok) {
                            const addedLabel = btn.getAttribute('data-added-label') || 'Added';
                            btn.textContent = addedLabel;
                            document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
                            const cartDrawer =
                              document.querySelector('wi-cartdrawer') ||
                              document.getElementById('cart-drawer');
                            if (cartDrawer) {
                              if (typeof cartDrawer.open === 'function') cartDrawer.open();
                              else if (typeof cartDrawer.show === 'function') cartDrawer.show();
                              else cartDrawer.classList.add('active');
                            }
                            setTimeout(() => {
                                btn.textContent = originalText;
                                btn.disabled = false;
                            }, 2000);
                        } else {
                            btn.textContent = 'Failed';
                            btn.disabled = false;
                        }
                    } catch {
                        btn.textContent = 'Error';
                        btn.disabled = false;
                    }
                });
            });
        }

        _cardHTML(product) {
            const variant = product.variants[0];
            const price = this._formatMoney(variant.price);
            const comparePrice = variant.compare_at_price && variant.compare_at_price > variant.price
                ? this._formatMoney(variant.compare_at_price)
                : null;

            const addLabel = this.getAttribute('data-add-label') || 'Add to basket';
            const soldLabel = this.getAttribute('data-soldout-label') || 'Sold out';
            const addedLabel = this.getAttribute('data-added-label') || 'Added';

            const image = product.images[0]
                ? `<img src="${product.images[0]}" alt="${this._escape(product.title)}" class="wishlist-card__image" loading="lazy" width="400" height="400">`
                : `<div class="wishlist-card__image-placeholder"></div>`;

            const badge = !product.available
                ? `<span class="wishlist-card__badge">${this._escape(soldLabel)}</span>`
                : '';

            const addBtn = product.available
                ? `<form class="wishlist-card__form">
            <input type="hidden" name="id" value="${variant.id}">
            <button type="submit" class="wishlist-card__add-btn" data-added-label="${this._escape(addedLabel)}">${this._escape(addLabel)}</button>
           </form>`
                : `<button class="wishlist-card__add-btn" disabled>${this._escape(soldLabel)}</button>`;

            const vendor = product.vendor && String(product.vendor).trim()
                ? `<p class="wishlist-card__vendor">${this._escape(product.vendor)}</p>`
                : '';

            return `
        <article class="wishlist-card" role="listitem">
          <div class="wishlist-card__figure">
            <a href="/products/${product.handle}" class="wishlist-card__media">
              ${image}
              ${badge}
            </a>
            <button class="wishlist-card__remove" data-wishlist-remove="${product.handle}" aria-label="Remove from wishlist" title="Remove">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
          <div class="wishlist-card__info">
            ${vendor}
            <a href="/products/${product.handle}" class="wishlist-card__title">${this._escape(product.title)}</a>
            <div class="wishlist-card__price">
              <span class="wishlist-card__price-current ${comparePrice ? 'price--on-sale' : ''}">${price}</span>
              ${comparePrice ? `<s class="wishlist-card__price-compare">${comparePrice}</s>` : ''}
            </div>
            ${addBtn}
          </div>
        </article>`;
        }

        _formatMoney(cents) {
            const value = Number(cents) / 100;
            const currency = window.Shopify?.currency?.active || 'DKK';
            try {
                if (Number.isInteger(value)) {
                    return new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(value);
                }
                return new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(value);
            } catch {
                return String(value).replace(/([,.])00$/, '') + ' kr';
            }
        }

        _escape(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
    }

    customElements.define('wishlist-page', WishlistPage);
}
