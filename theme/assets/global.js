/* Aurelle — global.js : vanilla, dependency-free storefront behaviour */
(function () {
  'use strict';

  var FREE_SHIP_THRESHOLD = (window.AURELLE && window.AURELLE.freeShip) || 5000; // cents
  var moneyFormat = (window.AURELLE && window.AURELLE.moneyFormat) || '${{amount}}';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function formatMoney(cents) {
    var value = (cents / 100).toFixed(2);
    return moneyFormat.replace(/\{\{\s*amount\s*\}\}/, value);
  }

  /* ---------- Overlay helpers ---------- */
  var overlay = $('[data-overlay]');
  function showOverlay(onClick) {
    if (!overlay) return;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.setAttribute('data-active', ''); });
    overlay._handler = onClick;
    overlay.addEventListener('click', onClick, { once: true });
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.removeAttribute('data-active');
    setTimeout(function () { overlay.hidden = true; }, 280);
  }

  /* ---------- Mobile nav ---------- */
  var mobileNav = $('[data-mobile-nav]');
  $$('[data-mobile-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!mobileNav) return;
      mobileNav.setAttribute('data-open', '');
      document.body.style.overflow = 'hidden';
      showOverlay(closeMobileNav);
    });
  });
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.removeAttribute('data-open');
    document.body.style.overflow = '';
    hideOverlay();
  }
  $$('[data-mobile-close]').forEach(function (b) { b.addEventListener('click', closeMobileNav); });

  /* ---------- Cart drawer ---------- */
  var drawer = $('[data-cart-drawer]');
  function openDrawer() {
    if (!drawer) return;
    drawer.setAttribute('data-open', '');
    document.body.style.overflow = 'hidden';
    showOverlay(closeDrawer);
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.removeAttribute('data-open');
    document.body.style.overflow = '';
    hideOverlay();
  }
  $$('[data-cart-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });

  function renderDrawer(cart) {
    if (!drawer) return;
    var body = $('[data-cart-body]', drawer);
    var foot = $('[data-cart-foot]', drawer);
    if (cart.item_count === 0) {
      body.innerHTML = '<div class="drawer-empty"><p>Your cart is empty.</p><a class="button button--primary" href="/collections/all">Shop all</a></div>';
      if (foot) foot.style.display = 'none';
    } else {
      if (foot) foot.style.display = '';
      body.innerHTML = cart.items.map(function (it) {
        return '' +
          '<div class="line-item" data-key="' + it.key + '">' +
            '<img src="' + (it.image ? it.image.replace(/(\.[^.]+)(\?.*)?$/, '_160x$1$2') : '') + '" alt="' + it.product_title + '" loading="lazy">' +
            '<div>' +
              '<div class="line-item__title">' + it.product_title + '</div>' +
              (it.variant_title && it.variant_title !== 'Default Title' ? '<div class="line-item__variant">' + it.variant_title + '</div>' : '') +
              (it.selling_plan_allocation ? '<div class="line-item__variant">' + it.selling_plan_allocation.selling_plan.name + '</div>' : '') +
              '<div class="qty" style="margin-top:8px;transform:scale(.85);transform-origin:left">' +
                '<button type="button" data-qty="-1" data-key="' + it.key + '">−</button>' +
                '<input value="' + it.quantity + '" readonly>' +
                '<button type="button" data-qty="1" data-key="' + it.key + '">+</button>' +
              '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<div>' + formatMoney(it.final_line_price) + '</div>' +
              '<button class="line-item__remove" data-remove="' + it.key + '">Remove</button>' +
            '</div>' +
          '</div>';
      }).join('');
    }
    // subtotal + free-ship bar
    var sub = $('[data-cart-subtotal]', drawer);
    if (sub) sub.textContent = formatMoney(cart.total_price);
    var bar = $('[data-freeship-bar]', drawer);
    var msg = $('[data-freeship-msg]', drawer);
    if (bar && msg) {
      var remaining = FREE_SHIP_THRESHOLD - cart.total_price;
      if (remaining <= 0) {
        msg.textContent = '🎉 You’ve unlocked free shipping!';
        bar.firstElementChild.style.width = '100%';
      } else {
        msg.innerHTML = 'You’re ' + formatMoney(remaining) + ' away from <strong>free shipping</strong>';
        bar.firstElementChild.style.width = Math.min(100, (cart.total_price / FREE_SHIP_THRESHOLD) * 100) + '%';
      }
    }
    // bind line controls
    $$('[data-qty]', drawer).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key');
        var delta = parseInt(b.getAttribute('data-qty'), 10);
        var input = b.parentNode.querySelector('input');
        changeItem(key, parseInt(input.value, 10) + delta);
      });
    });
    $$('[data-remove]', drawer).forEach(function (b) {
      b.addEventListener('click', function () { changeItem(b.getAttribute('data-remove'), 0); });
    });
  }

  function updateCartCount(count) {
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  function refreshCart(open) {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        renderDrawer(cart);
        if (open) openDrawer();
        return cart;
      })
      .catch(function () {});
  }

  function changeItem(key, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        renderDrawer(cart);
        if (document.body.classList.contains('template-cart')) location.reload();
      });
  }

  /* ---------- AJAX add to cart ---------- */
  $$('form[data-product-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var cartType = (window.AURELLE && window.AURELLE.cartType) || 'drawer';
      if (cartType !== 'drawer') return; // let it submit to /cart
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var original = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Adding…'; }
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          if (btn) { btn.innerHTML = 'Added ✓'; }
          return refreshCart(true);
        })
        .catch(function () { if (btn) btn.innerHTML = 'Error — try again'; })
        .finally(function () {
          setTimeout(function () { if (btn) { btn.disabled = false; btn.innerHTML = original; } }, 1200);
        });
    });
  });
  $$('[data-open-cart]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      if ((window.AURELLE && window.AURELLE.cartType) === 'page') return; // follow link
      e.preventDefault();
      refreshCart(true);
    });
  });

  /* ---------- Product gallery ---------- */
  $$('[data-gallery]').forEach(function (gallery) {
    var main = $('[data-gallery-main]', gallery);
    $$('[data-gallery-thumb]', gallery).forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var full = thumb.getAttribute('data-full');
        if (main) main.querySelector('img').src = full;
        $$('[data-gallery-thumb]', gallery).forEach(function (t) { t.setAttribute('aria-current', 'false'); });
        thumb.setAttribute('aria-current', 'true');
      });
    });
  });

  /* ---------- Variant selection ---------- */
  $$('[data-product-form]').forEach(function (form) {
    var dataEl = $('[data-variants-json]', form.closest('[data-product-root]') || document);
    if (!dataEl) return;
    var variants;
    try { variants = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var root = form.closest('[data-product-root]');

    function selectedOptions() {
      return $$('[data-option-selector]', root).map(function (group) {
        var checked = group.querySelector('input:checked');
        if (checked) return checked.value;
        var sel = group.querySelector('select');
        return sel ? sel.value : null;
      });
    }
    function update() {
      var opts = selectedOptions();
      var match = variants.find(function (v) {
        return v.options.every(function (o, i) { return o === opts[i]; });
      });
      var idInput = $('[data-variant-id]', form);
      var priceEl = $('[data-price]', root);
      var compareEl = $('[data-compare]', root);
      var btn = form.querySelector('[type="submit"]');
      if (!match) {
        if (btn) { btn.disabled = true; btn.textContent = 'Unavailable'; }
        return;
      }
      if (idInput) idInput.value = match.id;
      if (priceEl) priceEl.textContent = formatMoney(match.price);
      if (compareEl) {
        if (match.compare_at_price > match.price) {
          compareEl.textContent = formatMoney(match.compare_at_price);
          compareEl.style.display = '';
        } else { compareEl.style.display = 'none'; }
      }
      if (btn) {
        btn.disabled = !match.available;
        btn.querySelector('[data-btn-label]')
          ? (btn.querySelector('[data-btn-label]').textContent = match.available ? 'Add to cart' : 'Sold out')
          : (btn.textContent = match.available ? 'Add to cart' : 'Sold out');
      }
    }
    $$('[data-option-selector] input, [data-option-selector] select', root).forEach(function (i) {
      i.addEventListener('change', function () {
        // active style for swatch labels
        var group = i.closest('[data-option-selector]');
        if (group) $$('.swatch', group).forEach(function (s) { s.classList.toggle('is-active', s.contains(i) && i.checked); });
        update();
      });
    });
    update();
  });

  /* ---------- Selling plan (subscription) toggle ---------- */
  $$('[data-product-root]').forEach(function (root) {
    var plans = $$('[data-plan]', root);
    var planInput = $('[data-selling-plan-input]', root);
    plans.forEach(function (plan) {
      plan.addEventListener('click', function () {
        plans.forEach(function (p) { p.classList.remove('is-active'); });
        plan.classList.add('is-active');
        if (planInput) planInput.value = plan.getAttribute('data-plan') || '';
      });
    });
  });

  /* ---------- Quantity steppers (on product page) ---------- */
  $$('[data-qty-widget]').forEach(function (w) {
    var input = w.querySelector('input');
    w.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var delta = b.getAttribute('data-step') === 'down' ? -1 : 1;
        var val = Math.max(1, (parseInt(input.value, 10) || 1) + delta);
        input.value = val;
      });
    });
  });

  /* ---------- Sticky ATC ---------- */
  var sticky = $('[data-sticky-atc]');
  var atcAnchor = $('[data-atc-anchor]');
  if (sticky && atcAnchor && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) sticky.removeAttribute('data-visible');
        else if (en.boundingClientRect.top < 0) sticky.setAttribute('data-visible', '');
        else sticky.removeAttribute('data-visible');
      });
    }, { threshold: 0 }).observe(atcAnchor);
  }

  /* ---------- Initialise count on load ---------- */
  refreshCart(false);
})();
