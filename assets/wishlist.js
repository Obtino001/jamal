/**
 * ============================================================
 * WISHLIST — Custom Web Components
 * localStorage-backed wishlist for Shopify (Prestige theme)
 * ============================================================
 */

// ── Storage helper ──────────────────────────────────────────
const Wishlist = {
    STORAGE_KEY: 'mytruth_wishlist',

    get() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    },

    has(handle) {
        return this.get().includes(handle);
    },

    add(handle) {
        const list = this.get();
        if (!list.includes(handle)) {
            list.push(handle);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            this._dispatch('wishlist:added', { handle });
            this._dispatch('wishlist:updated', { list });
        }
    },

    remove(handle) {
        const list = this.get().filter(h => h !== handle);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        this._dispatch('wishlist:removed', { handle });
        this._dispatch('wishlist:updated', { list });
    },

    toggle(handle) {
        this.has(handle) ? this.remove(handle) : this.add(handle);
    },

    count() {
        return this.get().length;
    },

    _dispatch(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
};

// ── WishlistButton ───────────────────────────────────────────
// Usage: <wishlist-button product-handle="my-product"></wishlist-button>
if (!customElements.get('wishlist-button')) {
    class WishlistButton extends HTMLElement {
        connectedCallback() {
            this.handle = this.getAttribute('product-handle');
            if (!this.handle) return;

            this._render();
            this._syncState();

            this._btn.addEventListener('click', e => {
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
// Usage: <wishlist-count></wishlist-count>
if (!customElements.get('wishlist-count')) {
    class WishlistCount extends HTMLElement {
        connectedCallback() {
            this._update();
            document.addEventListener('wishlist:updated', () => this._update());
        }

        _update() {
            const count = Wishlist.count();
            this.textContent = count;
            this.hidden = count === 0;
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
                            btn.textContent = 'Added!';
                            // Trigger Prestige's cart refresh
                            document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
                            // Open cart drawer if present
                            const cartDrawer = document.getElementById('cart-drawer');
                            if (cartDrawer) cartDrawer.show();
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

            const image = product.images[0]
                ? `<img src="${product.images[0]}" alt="${this._escape(product.title)}" class="wishlist-card__image" loading="lazy" width="400" height="400">`
                : `<div class="wishlist-card__image-placeholder"></div>`;

            const badge = !product.available
                ? `<span class="wishlist-card__badge">Slutsåld</span>`
                : '';

            const addBtn = product.available
                ? `<form class="wishlist-card__form">
            <input type="hidden" name="id" value="${variant.id}">
            <button type="submit" class="wishlist-card__add-btn button button--subdued">Lägg i varukorgen</button>
           </form>`
                : `<button class="wishlist-card__add-btn button button--subdued" disabled>Slutsåld</button>`;

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
            ${product.vendor ? `<p class="wishlist-card__vendor smallcaps">${this._escape(product.vendor)}</p>` : ''}
            <a href="/products/${product.handle}" class="wishlist-card__title">${this._escape(product.title)}</a>
            <div class="wishlist-card__price">
              <span class="wishlist-card__price-current ${comparePrice ? 'price--on-sale' : ''}">${price}</span>
              ${comparePrice ? `<s class="wishlist-card__price-compare price--compare">${comparePrice}</s>` : ''}
            </div>
            ${addBtn}
          </div>
        </article>`;
        }

        _formatMoney(cents) {
            return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' });
        }

        _escape(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
    }

    customElements.define('wishlist-page', WishlistPage);
}
