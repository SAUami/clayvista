/**
 * ClayVista - Cart Page Script (cart.js)
 * Live cart calculations, quantity adjustment, coupon application, Save for Later
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCartData();
  initCouponForm();
  renderSavedForLater();
});

async function loadCartData() {
  const container = document.getElementById('cart-items-container');
  const summaryBox = document.getElementById('cart-summary-box');
  const emptyState = document.getElementById('cart-empty-state');
  const token = getAuthToken();
  const sessionId = getSessionId();

  try {
    const res = await fetch(`${ClayVista.apiBase}/cart`, {
      headers: {
        'x-session-id': sessionId,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();

    if (!data.success || !data.cart || data.cart.items.length === 0) {
      if (container) container.style.display = 'none';
      if (summaryBox) summaryBox.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      updateNavCounters();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (container) container.style.display = 'block';
    if (summaryBox) summaryBox.style.display = 'block';

    const cart = data.cart;

    // Render Items
    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid var(--color-border); font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-muted);">
            <th style="padding: 14px 0;">Item Details</th>
            <th style="padding: 14px 16px; text-align: center;">Price</th>
            <th style="padding: 14px 16px; text-align: center;">Quantity</th>
            <th style="padding: 14px 16px; text-align: right;">Total</th>
            <th style="padding: 14px 0; text-align: right;"></th>
          </tr>
        </thead>
        <tbody>
          ${cart.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td style="padding: 20px 0; display: flex; gap: 16px; align-items: center;">
                <img src="${item.image}" alt="${item.name}" style="width: 75px; height: 75px; object-fit: cover; border-radius: var(--radius-sm); background: var(--color-secondary);">
                <div>
                  <h4 style="font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 4px;">
                    <a href="/product.html?slug=${item.slug}">${item.name}</a>
                  </h4>
                  <button onclick="saveForLater('${item.productId}', '${escapeHtml(item.name)}', '${item.image}', ${item.price})" style="font-size: 0.78rem; color: var(--color-accent); text-decoration: underline; cursor: pointer;">Save for Later</button>
                </div>
              </td>
              <td style="padding: 20px 16px; text-align: center; font-weight: 500;">
                ${formatPrice(item.price)}
              </td>
              <td style="padding: 20px 16px; text-align: center;">
                <div style="display: inline-flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                  <button onclick="updateCartItemQty('${item.productId}', ${item.quantity - 1})" style="padding: 4px 10px; cursor: pointer;">-</button>
                  <span style="padding: 4px 12px; font-weight: 600; font-size: 0.9rem;">${item.quantity}</span>
                  <button onclick="updateCartItemQty('${item.productId}', ${item.quantity + 1})" style="padding: 4px 10px; cursor: pointer;">+</button>
                </div>
              </td>
              <td style="padding: 20px 16px; text-align: right; font-weight: 700; color: var(--color-text);">
                ${formatPrice(item.total)}
              </td>
              <td style="padding: 20px 0; text-align: right;">
                <button onclick="removeCartItem('${item.productId}')" title="Remove" style="color: #D32F2F; font-size: 1.1rem; cursor: pointer;">✕</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    // Render Order Summary
    const subtotalEl = document.getElementById('summary-subtotal');
    if (subtotalEl) subtotalEl.textContent = formatPrice(cart.subtotal);

    const gstEl = document.getElementById('summary-gst');
    if (gstEl) gstEl.textContent = formatPrice(cart.taxGst);

    const shippingEl = document.getElementById('summary-shipping');
    if (shippingEl) shippingEl.textContent = cart.shippingFee === 0 ? 'FREE' : formatPrice(cart.shippingFee);

    const discountRow = document.getElementById('summary-discount-row');
    const discountVal = document.getElementById('summary-discount-val');
    if (cart.discount > 0 && discountRow && discountVal) {
      discountRow.style.display = 'flex';
      discountVal.textContent = `-${formatPrice(cart.discount)}`;
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }

    const grandTotalEl = document.getElementById('summary-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = formatPrice(cart.grandTotal);

    // Free shipping threshold indicator
    const freeShippingProgress = document.getElementById('free-shipping-note');
    if (freeShippingProgress) {
      if (cart.freeShippingRemaining <= 0) {
        freeShippingProgress.innerHTML = `<span style="color: #2B5E43; font-weight: 600;">✔ Congratulations! Your order qualifies for Free Insured Express Delivery.</span>`;
      } else {
        freeShippingProgress.innerHTML = `Add <strong>${formatPrice(cart.freeShippingRemaining)}</strong> more to qualify for <strong>FREE Insured Delivery</strong>!`;
      }
    }

    updateNavCounters();
  } catch (err) {
    console.error(err);
  }
}

async function updateCartItemQty(productId, newQty) {
  const token = getAuthToken();
  const sessionId = getSessionId();

  try {
    const res = await fetch(`${ClayVista.apiBase}/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ productId, quantity: newQty })
    });
    const data = await res.json();
    if (data.success) {
      loadCartData();
    } else {
      showToast(data.message || 'Error updating item quantity', 'error');
    }
  } catch (err) {
    showToast('Failed to update cart', 'error');
  }
}

async function removeCartItem(productId) {
  const token = getAuthToken();
  const sessionId = getSessionId();

  try {
    const res = await fetch(`${ClayVista.apiBase}/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Item removed from cart', 'info');
      loadCartData();
    }
  } catch (err) {
    showToast('Could not remove item', 'error');
  }
}

function initCouponForm() {
  const form = document.getElementById('coupon-apply-form');
  const input = document.getElementById('coupon-code-input');
  if (!form || !input) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = input.value.trim();
    if (!code) return;

    const token = getAuthToken();
    const sessionId = getSessionId();

    try {
      const res = await fetch(`${ClayVista.apiBase}/cart/coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        input.value = '';
        loadCartData();
      } else {
        showToast(data.message || 'Invalid coupon code', 'error');
      }
    } catch (err) {
      showToast('Error validating coupon', 'error');
    }
  });
}

// Save for Later shelf
function saveForLater(productId, name, image, price) {
  removeCartItem(productId);
  let list = JSON.parse(localStorage.getItem('clayvista_saved_later') || '[]');
  if (!list.some((i) => i.id === productId)) {
    list.push({ id: productId, name, image, price });
    localStorage.setItem('clayvista_saved_later', JSON.stringify(list));
    showToast(`Saved "${name}" for later`, 'info');
  }
  renderSavedForLater();
}

function renderSavedForLater() {
  const container = document.getElementById('saved-for-later-container');
  if (!container) return;

  const list = JSON.parse(localStorage.getItem('clayvista_saved_later') || '[]');
  if (list.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <h3 style="font-family: var(--font-serif); font-size: 1.4rem; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 12px;">Saved for Later (${list.length})</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
      ${list
        .map(
          (item) => `
        <div style="background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 14px; text-align: center;">
          <img src="${item.image}" alt="${item.name}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
          <h5 style="font-family: var(--font-serif); font-size: 0.95rem; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</h5>
          <div style="font-weight: 700; color: var(--color-accent); margin-bottom: 12px;">${formatPrice(item.price)}</div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-sm btn-primary" onclick="moveSavedToCart('${item.id}')">Move to Cart</button>
            <button class="btn btn-sm btn-outline" onclick="removeSavedItem('${item.id}')">Remove</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function moveSavedToCart(id) {
  removeSavedItem(id);
  addToCartGlobal(id, 1);
  setTimeout(loadCartData, 400);
}

function removeSavedItem(id) {
  let list = JSON.parse(localStorage.getItem('clayvista_saved_later') || '[]');
  list = list.filter((i) => i.id !== id);
  localStorage.setItem('clayvista_saved_later', JSON.stringify(list));
  renderSavedForLater();
}
