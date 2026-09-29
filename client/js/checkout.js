/**
 * ClayVista - Checkout Script (checkout.js)
 * Step-by-step address selection, payment gateway selection, and order placement
 */

let checkoutCart = null;

document.addEventListener('DOMContentLoaded', () => {
  loadCheckoutOverview();
  prefillUserInfo();
  initCheckoutForm();
});

// 1. Load Cart & Pricing Overview for Checkout
async function loadCheckoutOverview() {
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
      showToast('Your cart is empty. Redirecting to shop...', 'info');
      setTimeout(() => (window.location.href = '/shop.html'), 1500);
      return;
    }

    checkoutCart = data.cart;
    renderCheckoutSummary(checkoutCart);
  } catch (err) {
    showToast('Failed to load cart for checkout', 'error');
  }
}

function renderCheckoutSummary(cart) {
  const itemsContainer = document.getElementById('checkout-items-list');
  if (itemsContainer) {
    itemsContainer.innerHTML = cart.items
      .map(
        (item) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border-light); font-size: 0.88rem;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${item.image}" alt="${item.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px;">
          <div>
            <h6 style="font-weight: 600; margin-bottom: 2px;">${item.name}</h6>
            <span style="color: var(--color-text-muted); font-size: 0.78rem;">Qty: ${item.quantity} × ${formatPrice(item.price)}</span>
          </div>
        </div>
        <strong style="color: var(--color-text);">${formatPrice(item.total)}</strong>
      </div>
    `
      )
      .join('');
  }

  // Price Totals
  const subEl = document.getElementById('checkout-subtotal');
  if (subEl) subEl.textContent = formatPrice(cart.subtotal);

  const gstEl = document.getElementById('checkout-gst');
  if (gstEl) gstEl.textContent = formatPrice(cart.taxGst);

  const shipEl = document.getElementById('checkout-shipping');
  if (shipEl) shipEl.textContent = cart.shippingFee === 0 ? 'FREE' : formatPrice(cart.shippingFee);

  const discRow = document.getElementById('checkout-discount-row');
  const discVal = document.getElementById('checkout-discount-val');
  if (cart.discount > 0 && discRow && discVal) {
    discRow.style.display = 'flex';
    discVal.textContent = `-${formatPrice(cart.discount)}`;
  }

  const grandEl = document.getElementById('checkout-grand-total');
  if (grandEl) grandEl.textContent = formatPrice(cart.grandTotal);
}

// 2. Prefill User Info & Addresses if logged in
async function prefillUserInfo() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${ClayVista.apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.user) {
      const u = data.user;
      const nameInput = document.getElementById('shipping-name');
      const emailInput = document.getElementById('shipping-email');
      const phoneInput = document.getElementById('shipping-phone');

      if (nameInput && !nameInput.value) nameInput.value = u.name;
      if (emailInput && !emailInput.value) emailInput.value = u.email;
      if (phoneInput && !phoneInput.value) phoneInput.value = u.phone || '';

      // If user has saved addresses, display address selector
      if (u.addresses && u.addresses.length > 0) {
        renderSavedAddressSelector(u.addresses);
      }
    }
  } catch (err) {}
}

function renderSavedAddressSelector(addresses) {
  const container = document.getElementById('saved-addresses-selector');
  if (!container) return;

  container.style.display = 'block';
  container.innerHTML = `
    <label class="form-label">Select from Saved Addresses:</label>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
      ${addresses
        .map(
          (addr, idx) => `
        <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; background: var(--color-secondary);">
          <input type="radio" name="saved_addr_radio" value="${addr._id}" ${addr.isDefault || idx === 0 ? 'checked' : ''} onchange="applySavedAddress(${JSON.stringify(addr).replace(/"/g, '&quot;')})">
          <span style="font-size: 0.85rem;">
            <strong>${addr.name}</strong> (${addr.phone})<br>
            ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}
          </span>
        </label>
      `
        )
        .join('')}
    </div>
  `;

  // Apply default
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  if (defaultAddr) applySavedAddress(defaultAddr);
}

function applySavedAddress(addr) {
  const streetInput = document.getElementById('shipping-street');
  const cityInput = document.getElementById('shipping-city');
  const stateInput = document.getElementById('shipping-state');
  const pinInput = document.getElementById('shipping-pincode');
  const phoneInput = document.getElementById('shipping-phone');

  if (streetInput) streetInput.value = addr.street;
  if (cityInput) cityInput.value = addr.city;
  if (stateInput) stateInput.value = addr.state;
  if (pinInput) pinInput.value = addr.pincode;
  if (phoneInput && !phoneInput.value) phoneInput.value = addr.phone;
}

// 3. Checkout Form Submission
function initCheckoutForm() {
  const form = document.getElementById('checkout-order-form');
  const placeOrderBtn = document.getElementById('btn-place-order');

  if (!form || !placeOrderBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!checkoutCart || checkoutCart.items.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    const name = document.getElementById('shipping-name')?.value.trim();
    const email = document.getElementById('shipping-email')?.value.trim();
    const phone = document.getElementById('shipping-phone')?.value.trim();
    const street = document.getElementById('shipping-street')?.value.trim();
    const apartment = document.getElementById('shipping-apartment')?.value.trim() || '';
    const city = document.getElementById('shipping-city')?.value.trim();
    const state = document.getElementById('shipping-state')?.value.trim();
    const pincode = document.getElementById('shipping-pincode')?.value.trim();

    if (!name || !email || !phone || !street || !city || !state || !pincode) {
      showToast('Please complete all delivery address fields.', 'error');
      return;
    }

    const paymentMethod = form.querySelector('input[name="payment_method"]:checked')?.value || 'cod';

    const orderPayload = {
      customerDetails: {
        name,
        email,
        phone,
        shippingAddress: { street, apartment, city, state, pincode, country: 'India' }
      },
      orderItems: checkoutCart.items.map((i) => ({
        product: i.productId,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
        total: i.total
      })),
      couponCode: checkoutCart.couponCode,
      paymentMethod
    };

    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `<span>Processing Secure Order...</span>`;

    const token = getAuthToken();
    const sessionId = getSessionId();

    try {
      // 1. Create Order in Database
      const res = await fetch(`${ClayVista.apiBase}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (!data.success || !data.order) {
        showToast(data.message || 'Failed to place order', 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = `Place Order`;
        return;
      }

      const createdOrder = data.order;

      // 2. Handle Payment Flows
      if (paymentMethod === 'razorpay') {
        await handleRazorpayFlow(createdOrder);
      } else if (paymentMethod === 'stripe') {
        await handleStripeFlow(createdOrder);
      } else {
        // Cash on Delivery
        await fetch(`${ClayVista.apiBase}/cart/clear`, {
          method: 'DELETE',
          headers: { 'x-session-id': sessionId, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        showToast('Order confirmed via Cash on Delivery!', 'success');
        window.location.href = `/order-success.html?orderNumber=${createdOrder.orderNumber}&id=${createdOrder._id}`;
      }
    } catch (err) {
      showToast('Unexpected error during checkout', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = `Place Order`;
    }
  });
}

// 4. Razorpay Integration Flow
async function handleRazorpayFlow(order) {
  try {
    const res = await fetch(`${ClayVista.apiBase}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order._id })
    });
    const rzpData = await res.json();

    if (!rzpData.success) {
      showToast('Could not initialize Razorpay gateway', 'error');
      return;
    }

    // Clear cart
    const token = getAuthToken();
    const sessionId = getSessionId();
    await fetch(`${ClayVista.apiBase}/cart/clear`, {
      method: 'DELETE',
      headers: { 'x-session-id': sessionId, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });

    // Simulate instant test gateway verification for development
    await fetch(`${ClayVista.apiBase}/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order._id,
        razorpay_order_id: rzpData.gatewayOrderId,
        razorpay_payment_id: 'rzp_pay_test_' + Date.now(),
        razorpay_signature: 'test_signature_valid'
      })
    });

    showToast('Payment confirmed via Razorpay!', 'success');
    window.location.href = `/order-success.html?orderNumber=${order.orderNumber}&id=${order._id}`;
  } catch (err) {
    showToast('Payment processing error', 'error');
  }
}

// 5. Stripe Integration Flow
async function handleStripeFlow(order) {
  try {
    const res = await fetch(`${ClayVista.apiBase}/payments/stripe/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order._id })
    });
    const stripeData = await res.json();

    const token = getAuthToken();
    const sessionId = getSessionId();
    await fetch(`${ClayVista.apiBase}/cart/clear`, {
      method: 'DELETE',
      headers: { 'x-session-id': sessionId, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });

    // Verify test intent
    await fetch(`${ClayVista.apiBase}/payments/stripe/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order._id,
        paymentIntentId: 'pi_test_' + Date.now()
      })
    });

    showToast('Payment captured via Stripe!', 'success');
    window.location.href = `/order-success.html?orderNumber=${order.orderNumber}&id=${order._id}`;
  } catch (err) {
    showToast('Payment processing error', 'error');
  }
}
