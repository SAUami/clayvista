/**
 * ClayVista - User Dashboard Script (dashboard.js)
 * Profile management, Address book, Order history, Invoices, Wishlist, Password Change
 */

document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  if (!token) {
    showToast('Please sign in to access your dashboard.', 'info');
    window.location.href = '/login.html';
    return;
  }

  loadUserProfile();
  loadUserOrders();
  loadUserWishlist();
  initDashboardTabs();
  initProfileForms();
});

// 1. Tab Switching
function initDashboardTabs() {
  const navItems = document.querySelectorAll('.dashboard-nav-item');
  const sections = document.querySelectorAll('.dashboard-tab-content');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      navItems.forEach((b) => b.classList.remove('active'));
      sections.forEach((s) => (s.style.display = 'none'));

      btn.classList.add('active');
      const targetSection = document.getElementById(`tab-${target}`);
      if (targetSection) targetSection.style.display = 'block';
    });
  });
}

// 2. Load User Profile & Addresses
async function loadUserProfile() {
  const token = getAuthToken();
  try {
    const res = await fetch(`${ClayVista.apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.user) {
      const u = data.user;
      document.getElementById('dash-welcome-name').textContent = u.name;
      document.getElementById('dash-email-display').textContent = u.email;
      document.getElementById('profile-name-input').value = u.name;
      document.getElementById('profile-phone-input').value = u.phone || '';

      renderAddressBook(u.addresses || []);
    }
  } catch (err) {
    showToast('Failed to load profile', 'error');
  }
}

function renderAddressBook(addresses) {
  const container = document.getElementById('dash-addresses-list');
  if (!container) return;

  if (addresses.length === 0) {
    container.innerHTML = `<p style="color: var(--color-text-muted);">No saved addresses. Add a new delivery address below.</p>`;
    return;
  }

  container.innerHTML = addresses
    .map(
      (addr) => `
    <div style="background: var(--color-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 12px; position: relative;">
      ${addr.isDefault ? `<span style="position: absolute; top: 12px; right: 12px; background: var(--color-accent); color: #FFF; font-size: 0.68rem; padding: 2px 8px; border-radius: 4px; font-weight: 600;">DEFAULT</span>` : ''}
      <h5 style="font-weight: 600; margin-bottom: 4px;">${addr.name} (${addr.phone})</h5>
      <p style="font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.5;">
        ${addr.street}${addr.apartment ? ', ' + addr.apartment : ''}<br>
        ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}
      </p>
      <div style="margin-top: 12px;">
        <button class="btn btn-sm btn-outline" onclick="deleteAddress('${addr._id}')" style="color: #D32F2F; border-color: #D32F2F;">Delete</button>
      </div>
    </div>
  `
    )
    .join('');
}

async function deleteAddress(addressId) {
  if (!confirm('Are you sure you want to remove this address?')) return;
  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/auth/address/${addressId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Address removed', 'info');
      loadUserProfile();
    }
  } catch (e) {
    showToast('Failed to delete address', 'error');
  }
}

// 3. Load Order History
async function loadUserOrders() {
  const container = document.getElementById('dash-orders-list');
  if (!container) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success || data.orders.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--color-text-muted);">
          <p style="margin-bottom: 16px;">You haven't placed any orders yet.</p>
          <a href="/shop.html" class="btn btn-sm btn-primary">Discover Tableware</a>
        </div>
      `;
      return;
    }

    container.innerHTML = data.orders
      .map(
        (order) => `
      <div style="background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--color-border-light); padding-bottom: 16px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 0.8rem; color: var(--color-text-muted);">Order Number</span>
            <h4 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--color-accent);">${order.orderNumber}</h4>
            <span style="font-size: 0.78rem; color: var(--color-text-light);">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div style="text-align: right;">
            <span class="status-badge status-${order.orderStatus}">${order.orderStatus.replace('_', ' ')}</span>
            <div style="font-size: 1.1rem; font-weight: 700; margin-top: 6px;">${formatPrice(order.grandTotal)}</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
          ${order.orderItems
            .map(
              (item) => `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.88rem;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${item.image}" alt="${item.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px;">
                <div>
                  <strong>${item.name}</strong><br>
                  <span style="color: var(--color-text-muted); font-size: 0.78rem;">Qty: ${item.quantity}</span>
                </div>
              </div>
              <span>${formatPrice(item.total)}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border-light); padding-top: 16px; flex-wrap: wrap; gap: 12px;">
          <div style="font-size: 0.82rem; color: var(--color-text-muted);">
            Payment: <strong>${order.paymentMethod.toUpperCase()}</strong> (${order.paymentStatus.toUpperCase()})
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="/track-order.html?orderNumber=${order.orderNumber}" class="btn btn-sm btn-outline">Track Delivery</a>
            <a href="/api/orders/${order._id}/invoice" target="_blank" class="btn btn-sm btn-primary">Download Tax Invoice</a>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

// 4. Load Wishlist
async function loadUserWishlist() {
  const container = document.getElementById('dash-wishlist-grid');
  if (!container) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success || data.wishlist.length === 0) {
      container.innerHTML = `<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--color-text-muted);">Your wishlist is empty. Tap the heart icon on any tableware item to save it!</div>`;
      return;
    }

    container.innerHTML = data.wishlist
      .map(
        (p) => `
      <div class="product-card">
        <div class="product-thumb-wrapper">
          <a href="/product.html?slug=${p.slug}">
            <img src="${p.images[0]}" alt="${p.name}" class="product-thumb">
          </a>
        </div>
        <div class="product-card-body">
          <span class="product-category-name">${p.material}</span>
          <h4 class="product-card-title"><a href="/product.html?slug=${p.slug}">${p.name}</a></h4>
          <div class="product-card-footer">
            <span class="price-current" data-price-inr="${p.discountPrice || p.price}">${formatPrice(p.discountPrice || p.price)}</span>
            <button class="btn-add-cart-card" onclick="addToCartGlobal('${p._id}', 1, this)">Add to Cart</button>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

// 5. Profile Update & Password Change Forms
function initProfileForms() {
  // Update Profile Info
  const profileForm = document.getElementById('dash-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name-input').value.trim();
      const phone = document.getElementById('profile-phone-input').value.trim();
      const token = getAuthToken();

      try {
        const res = await fetch(`${ClayVista.apiBase}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name, phone })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Profile updated successfully', 'success');
          localStorage.setItem('clayvista_user', JSON.stringify(data.user));
          loadUserProfile();
        }
      } catch (err) {
        showToast('Error updating profile', 'error');
      }
    });
  }

  // Add Address Form
  const addrForm = document.getElementById('dash-add-address-form');
  if (addrForm) {
    addrForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('addr-name').value.trim();
      const phone = document.getElementById('addr-phone').value.trim();
      const street = document.getElementById('addr-street').value.trim();
      const apartment = document.getElementById('addr-apt').value.trim();
      const city = document.getElementById('addr-city').value.trim();
      const state = document.getElementById('addr-state').value.trim();
      const pincode = document.getElementById('addr-pincode').value.trim();
      const isDefault = document.getElementById('addr-default').checked;
      const token = getAuthToken();

      try {
        const res = await fetch(`${ClayVista.apiBase}/auth/address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name, phone, street, apartment, city, state, pincode, isDefault })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Address added to your address book', 'success');
          addrForm.reset();
          loadUserProfile();
        }
      } catch (err) {
        showToast('Failed to add address', 'error');
      }
    });
  }

  // Change Password Form
  const passForm = document.getElementById('dash-change-password-form');
  if (passForm) {
    passForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('current-password-input').value;
      const newPassword = document.getElementById('new-password-input').value;
      const confirmPassword = document.getElementById('confirm-password-input').value;

      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
      }

      const token = getAuthToken();

      try {
        const res = await fetch(`${ClayVista.apiBase}/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Password updated successfully', 'success');
          passForm.reset();
        } else {
          showToast(data.message || 'Password update failed', 'error');
        }
      } catch (err) {
        showToast('Error changing password', 'error');
      }
    });
  }
}
