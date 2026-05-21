/* Aurelle — global.ts : vanilla, dependency-free storefront behaviour.
 * Compiled to theme/assets/global.js by esbuild (`pnpm build:js`). */

/* ---------- Shopify runtime shapes ---------- */
interface AurelleConfig {
  moneyFormat: string;
  cartType: 'drawer' | 'page';
  freeShip: number;
}
declare global {
  interface Window {
    AURELLE?: Partial<AurelleConfig>;
  }
}

interface SellingPlanAllocation {
  selling_plan: { name: string };
}
interface CartLineItem {
  key: string;
  quantity: number;
  product_title: string;
  variant_title: string | null;
  image: string | null;
  final_line_price: number;
  selling_plan_allocation?: SellingPlanAllocation;
}
interface Cart {
  item_count: number;
  total_price: number;
  items: CartLineItem[];
}
interface VariantData {
  id: number;
  options: string[];
  price: number;
  compare_at_price: number;
  available: boolean;
}

const FREE_SHIP_THRESHOLD: number = window.AURELLE?.freeShip ?? 5000; // cents
const moneyFormat: string = window.AURELLE?.moneyFormat ?? '${{amount}}';

function $<T extends Element = HTMLElement>(sel: string, ctx?: ParentNode): T | null {
  return (ctx ?? document).querySelector<T>(sel);
}
function $$<T extends Element = HTMLElement>(sel: string, ctx?: ParentNode): T[] {
  return Array.from((ctx ?? document).querySelectorAll<T>(sel));
}

function formatMoney(cents: number): string {
  const value = (cents / 100).toFixed(2);
  return moneyFormat.replace(/\{\{\s*amount\s*\}\}/, value);
}

/* ---------- Overlay helpers ---------- */
const overlay = $('[data-overlay]');
function showOverlay(onClick: (e: Event) => void): void {
  if (!overlay) return;
  overlay.hidden = false;
  requestAnimationFrame(() => {
    overlay.setAttribute('data-active', '');
  });
  overlay.addEventListener('click', onClick, { once: true });
}
function hideOverlay(): void {
  if (!overlay) return;
  overlay.removeAttribute('data-active');
  setTimeout(() => {
    overlay.hidden = true;
  }, 280);
}

/* ---------- Mobile nav ---------- */
const mobileNav = $('[data-mobile-nav]');
$$('[data-mobile-open]').forEach((b) => {
  b.addEventListener('click', () => {
    if (!mobileNav) return;
    mobileNav.setAttribute('data-open', '');
    document.body.style.overflow = 'hidden';
    showOverlay(closeMobileNav);
  });
});
function closeMobileNav(): void {
  if (!mobileNav) return;
  mobileNav.removeAttribute('data-open');
  document.body.style.overflow = '';
  hideOverlay();
}
$$('[data-mobile-close]').forEach((b) => b.addEventListener('click', closeMobileNav));

/* ---------- Cart drawer ---------- */
const drawer = $('[data-cart-drawer]');
function openDrawer(): void {
  if (!drawer) return;
  drawer.setAttribute('data-open', '');
  document.body.style.overflow = 'hidden';
  showOverlay(closeDrawer);
}
function closeDrawer(): void {
  if (!drawer) return;
  drawer.removeAttribute('data-open');
  document.body.style.overflow = '';
  hideOverlay();
}
$$('[data-cart-close]').forEach((b) => b.addEventListener('click', closeDrawer));

function renderDrawer(cart: Cart): void {
  if (!drawer) return;
  const body = $('[data-cart-body]', drawer);
  const foot = $('[data-cart-foot]', drawer);
  if (cart.item_count === 0) {
    if (body) body.innerHTML = '<div class="drawer-empty"><p>Your cart is empty.</p><a class="button button--primary" href="/collections/all">Shop all</a></div>';
    if (foot) foot.style.display = 'none';
  } else {
    if (foot) foot.style.display = '';
    if (body) {
      body.innerHTML = cart.items
        .map((it) => {
          const thumb = it.image ? it.image.replace(/(\.[^.]+)(\?.*)?$/, '_160x$1$2') : '';
          const variant = it.variant_title && it.variant_title !== 'Default Title' ? `<div class="line-item__variant">${it.variant_title}</div>` : '';
          const plan = it.selling_plan_allocation ? `<div class="line-item__variant">${it.selling_plan_allocation.selling_plan.name}</div>` : '';
          return (
            `<div class="line-item" data-key="${it.key}">` +
            `<img src="${thumb}" alt="${it.product_title}" loading="lazy">` +
            '<div>' +
            `<div class="line-item__title">${it.product_title}</div>` +
            variant +
            plan +
            '<div class="qty" style="margin-top:8px;transform:scale(.85);transform-origin:left">' +
            `<button type="button" data-qty="-1" data-key="${it.key}">−</button>` +
            `<input value="${it.quantity}" readonly>` +
            `<button type="button" data-qty="1" data-key="${it.key}">+</button>` +
            '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
            `<div>${formatMoney(it.final_line_price)}</div>` +
            `<button class="line-item__remove" data-remove="${it.key}">Remove</button>` +
            '</div>' +
            '</div>'
          );
        })
        .join('');
    }
  }
  // subtotal + free-ship bar
  const sub = $('[data-cart-subtotal]', drawer);
  if (sub) sub.textContent = formatMoney(cart.total_price);
  const bar = $('[data-freeship-bar]', drawer);
  const msg = $('[data-freeship-msg]', drawer);
  if (bar && msg) {
    const fill = bar.firstElementChild as HTMLElement | null;
    const remaining = FREE_SHIP_THRESHOLD - cart.total_price;
    if (remaining <= 0) {
      msg.textContent = '🎉 You’ve unlocked free shipping!';
      if (fill) fill.style.width = '100%';
    } else {
      msg.innerHTML = `You’re ${formatMoney(remaining)} away from <strong>free shipping</strong>`;
      if (fill) fill.style.width = Math.min(100, (cart.total_price / FREE_SHIP_THRESHOLD) * 100) + '%';
    }
  }
  // bind line controls
  $$('[data-qty]', drawer).forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.getAttribute('data-key');
      const delta = parseInt(b.getAttribute('data-qty') || '0', 10);
      const input = (b.parentNode as HTMLElement | null)?.querySelector('input');
      if (!key || !input) return;
      changeItem(key, parseInt(input.value, 10) + delta);
    });
  });
  $$('[data-remove]', drawer).forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.getAttribute('data-remove');
      if (key) changeItem(key, 0);
    });
  });
}

function updateCartCount(count: number): void {
  $$('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.style.display = count > 0 ? '' : 'none';
  });
}

function refreshCart(open: boolean): Promise<Cart | void> {
  return fetch('/cart.js', { headers: { Accept: 'application/json' } })
    .then((r) => r.json() as Promise<Cart>)
    .then((cart) => {
      updateCartCount(cart.item_count);
      renderDrawer(cart);
      if (open) openDrawer();
      return cart;
    })
    .catch(() => {});
}

function changeItem(key: string, quantity: number): void {
  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: key, quantity }),
  })
    .then((r) => r.json() as Promise<Cart>)
    .then((cart) => {
      updateCartCount(cart.item_count);
      renderDrawer(cart);
      if (document.body.classList.contains('template-cart')) location.reload();
    });
}

/* ---------- AJAX add to cart ---------- */
$$<HTMLFormElement>('form[data-product-form]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    const cartType = window.AURELLE?.cartType ?? 'drawer';
    if (cartType !== 'drawer') return; // let it submit to /cart
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
    const original = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Adding…';
    }
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    })
      .then((r) => r.json())
      .then(() => {
        if (btn) btn.innerHTML = 'Added ✓';
        return refreshCart(true);
      })
      .catch(() => {
        if (btn) btn.innerHTML = 'Error — try again';
      })
      .finally(() => {
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = original;
          }
        }, 1200);
      });
  });
});
$$('[data-open-cart]').forEach((b) => {
  b.addEventListener('click', (e) => {
    if ((window.AURELLE?.cartType ?? 'drawer') === 'page') return; // follow link
    e.preventDefault();
    refreshCart(true);
  });
});

/* ---------- Product gallery ---------- */
$$('[data-gallery]').forEach((gallery) => {
  const main = $('[data-gallery-main]', gallery);
  $$('[data-gallery-thumb]', gallery).forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const full = thumb.getAttribute('data-full');
      const img = main?.querySelector('img');
      if (img && full) img.src = full;
      $$('[data-gallery-thumb]', gallery).forEach((t) => t.setAttribute('aria-current', 'false'));
      thumb.setAttribute('aria-current', 'true');
    });
  });
});

/* ---------- Variant selection ---------- */
$$<HTMLFormElement>('[data-product-form]').forEach((form) => {
  const root = form.closest<HTMLElement>('[data-product-root]');
  const dataEl = $('[data-variants-json]', root ?? document);
  if (!dataEl) return;
  let variants: VariantData[];
  try {
    variants = JSON.parse(dataEl.textContent || '[]') as VariantData[];
  } catch {
    return;
  }

  function selectedOptions(): Array<string | null> {
    return $$('[data-option-selector]', root ?? document).map((group) => {
      const checked = group.querySelector<HTMLInputElement>('input:checked');
      if (checked) return checked.value;
      const sel = group.querySelector<HTMLSelectElement>('select');
      return sel ? sel.value : null;
    });
  }
  function update(): void {
    const opts = selectedOptions();
    const match = variants.find((v) => v.options.every((o, i) => o === opts[i]));
    const idInput = $<HTMLInputElement>('[data-variant-id]', form);
    const priceEl = $('[data-price]', root ?? document);
    const compareEl = $('[data-compare]', root ?? document);
    const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (!match) {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Unavailable';
      }
      return;
    }
    if (idInput) idInput.value = String(match.id);
    if (priceEl) priceEl.textContent = formatMoney(match.price);
    if (compareEl) {
      if (match.compare_at_price > match.price) {
        compareEl.textContent = formatMoney(match.compare_at_price);
        compareEl.style.display = '';
      } else {
        compareEl.style.display = 'none';
      }
    }
    if (btn) {
      btn.disabled = !match.available;
      const label = btn.querySelector<HTMLElement>('[data-btn-label]');
      const text = match.available ? 'Add to cart' : 'Sold out';
      if (label) label.textContent = text;
      else btn.textContent = text;
    }
  }
  $$<HTMLInputElement | HTMLSelectElement>('[data-option-selector] input, [data-option-selector] select', root ?? document).forEach((i) => {
    i.addEventListener('change', () => {
      // active style for swatch labels
      const group = i.closest('[data-option-selector]');
      if (group) {
        $$('.swatch', group).forEach((s) => {
          s.classList.toggle('is-active', s.contains(i) && (i as HTMLInputElement).checked);
        });
      }
      update();
    });
  });
  update();
});

/* ---------- Selling plan (subscription) toggle ---------- */
$$('[data-product-root]').forEach((root) => {
  const plans = $$('[data-plan]', root);
  const planInput = $<HTMLInputElement>('[data-selling-plan-input]', root);
  plans.forEach((plan) => {
    plan.addEventListener('click', () => {
      plans.forEach((p) => p.classList.remove('is-active'));
      plan.classList.add('is-active');
      if (planInput) planInput.value = plan.getAttribute('data-plan') || '';
    });
  });
});

/* ---------- Quantity steppers (on product page) ---------- */
$$('[data-qty-widget]').forEach((w) => {
  const input = w.querySelector<HTMLInputElement>('input');
  if (!input) return;
  w.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.addEventListener('click', () => {
      const delta = b.getAttribute('data-step') === 'down' ? -1 : 1;
      const val = Math.max(1, (parseInt(input.value, 10) || 1) + delta);
      input.value = String(val);
    });
  });
});

/* ---------- Sticky ATC ---------- */
const sticky = $('[data-sticky-atc]');
const atcAnchor = $('[data-atc-anchor]');
if (sticky && atcAnchor && 'IntersectionObserver' in window) {
  new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) sticky.removeAttribute('data-visible');
        else if (en.boundingClientRect.top < 0) sticky.setAttribute('data-visible', '');
        else sticky.removeAttribute('data-visible');
      });
    },
    { threshold: 0 },
  ).observe(atcAnchor);
}

/* ---------- Initialise count on load ---------- */
refreshCart(false);

export {};
