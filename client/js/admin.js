/**
 * ClayVista - Admin Portal Script (admin.js)
 * Comprehensive administrative management for products, orders, customers, inventory, coupons
 */

let allAdminProducts = [];
let allAdminOrders = [];

document.addEventListener('DOMContentLoaded', () => {
  verifyAdminAccess();
  initAdminNavigation();
  loadDashboardData();
});

// 1. Verify Admin Access
function verifyAdminAccess() {
  const token = getAuthToken();
  const user = getCurrentUser();

  if (!token || !user || user.role !== 'admin') {
    showToast('Admin authorization required. Please log in with admin privileges.', 'error');
    window.location.href = '/login.html?redirect=/admin/index.html';
    return;
  }

  const nameEl = document.getElementById('admin-profile-name');
  if (nameEl) nameEl.textContent = user.name;
}

// 2. Admin Navigation Tabs
function initAdminNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-tab-section');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-admin-tab');

      navItems.forEach((b) => b.classList.remove('active'));
      sections.forEach((s) => (s.style.display = 'none'));

      btn.classList.add('active');
      const target = document.getElementById(`admin-tab-${tab}`);
      if (target) target.style.display = 'block';

      // Load specific tab data on demand
      if (tab === 'dashboard') loadDashboardData();
      if (tab === 'products') loadAdminProducts();
      if (tab === 'orders') loadAdminOrders();
      if (tab === 'customers') loadAdminCustomers();
      if (tab === 'inventory') loadAdminInventory();
      if (tab === 'coupons') loadAdminCoupons();
    });
  });

  // Mobile admin sidebar toggle
  const toggleBtn = document.getElementById('admin-menu-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// 3. Load Dashboard Overview Metrics & Chart
async function loadDashboardData() {
  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success || !data.stats) return;

    const s = data.stats;

    // Metrics cards
    const revEl = document.getElementById('metric-total-revenue');
    if (revEl) revEl.textContent = `₹${s.totalRevenue.toLocaleString('en-IN')}`;

    const ordersEl = document.getElementById('metric-total-orders');
    if (ordersEl) ordersEl.textContent = s.totalOrders;

    const prodsEl = document.getElementById('metric-total-products');
    if (prodsEl) prodsEl.textContent = s.totalProducts;

    const custEl = document.getElementById('metric-total-customers');
    if (custEl) custEl.textContent = s.totalCustomers;

    const lowStockBadge = document.getElementById('metric-low-stock');
    if (lowStockBadge) lowStockBadge.textContent = s.lowStockCount;

    // Render Recent Orders
    renderRecentOrders(s.recentOrders || []);

    // Render SVG Sales Trend Chart
    renderSalesTrendChart(s.chartData || []);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('dashboard-recent-orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--color-text-muted);">No orders recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.customerDetails?.name || 'Guest Customer'}</td>
      <td><strong>₹${o.grandTotal.toLocaleString('en-IN')}</strong></td>
      <td>${o.paymentMethod.toUpperCase()}</td>
      <td><span class="status-badge status-${o.orderStatus}">${o.orderStatus.replace('_', ' ')}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
    </tr>
  `
    )
    .join('');
}

function renderSalesTrendChart(chartData) {
  const container = document.getElementById('admin-sales-chart-container');
  if (!container) return;

  if (chartData.length === 0) {
    // Provide sample historical months if store is freshly initialized
    chartData = [
      { month: 'May 2026', sales: 42000, orders: 8 },
      { month: 'Jun 2026', sales: 68000, orders: 14 },
      { month: 'Jul 2026', sales: 94000, orders: 19 },
      { month: 'Aug 2026', sales: 125000, orders: 25 },
      { month: 'Sep 2026', sales: 184500, orders: 38 }
    ];
  }

  const maxVal = Math.max(...chartData.map((d) => d.sales), 10000);

  container.innerHTML = `
    <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 220px; padding-top: 20px; border-bottom: 2px solid var(--color-border); gap: 16px;">
      ${chartData
        .map((d) => {
          const heightPct = Math.round((d.sales / maxVal) * 100);
          return `
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <span style="font-size: 0.72rem; font-weight: 600; color: var(--color-accent); margin-bottom: 6px;">₹${(d.sales / 1000).toFixed(0)}k</span>
            <div style="width: 100%; max-width: 48px; height: ${Math.max(15, heightPct * 1.6)}px; background: linear-gradient(180deg, var(--color-accent) 0%, rgba(196,106,74,0.3) 100%); border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 8px;">${d.month}</span>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

// 4. Manage Products Tab
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/products?limit=100`);
    const data = await res.json();

    if (!data.success) return;

    allAdminProducts = data.products;
    renderProductsTable(allAdminProducts);
  } catch (err) {}
}

function renderProductsTable(products) {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>
        <img src="${p.images[0]}" class="table-thumb" alt="${p.name}">
      </td>
      <td>
        <strong>${p.name}</strong><br>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">SKU: ${p.sku} | ${p.material}</span>
      </td>
      <td>${p.category?.name || 'Tableware'}</td>
      <td><strong>₹${(p.discountPrice || p.price).toLocaleString('en-IN')}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" value="${p.stock}" min="0" style="width: 60px; padding: 4px 6px; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.85rem;" onchange="quickUpdateStock('${p._id}', this.value)">
          ${p.stock <= p.lowStockThreshold ? `<span style="color: #D32F2F; font-size: 0.75rem; font-weight: bold;">LOW</span>` : ''}
        </div>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${p._id}')">Edit</button>
          <button class="btn btn-sm btn-outline" style="color: #D32F2F; border-color: #D32F2F;" onclick="deleteAdminProduct('${p._id}', '${escapeHtml(p.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

async function quickUpdateStock(productId, stockVal) {
  const token = getAuthToken();
  try {
    const res = await fetch(`${ClayVista.apiBase}/products/${productId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ stock: Number(stockVal) })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
    }
  } catch (err) {
    showToast('Failed to update stock', 'error');
  }
}

async function deleteAdminProduct(productId, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted', 'info');
      loadAdminProducts();
    }
  } catch (err) {
    showToast('Error deleting product', 'error');
  }
}

// 5. Add / Edit Product Modal
function openAddProductModal() {
  let modal = document.getElementById('admin-product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-product-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-container" style="max-width: 800px;">
      <button class="modal-close-btn" onclick="document.getElementById('admin-product-modal').classList.remove('open')">✕</button>
      <h3 style="font-family: var(--font-serif); font-size: 1.6rem; margin-bottom: 20px;">Add New Tableware Piece</h3>
      
      <form id="admin-save-product-form" onsubmit="submitSaveProduct(event)">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Product Name *</label>
            <input type="text" class="form-input" id="modal-prod-name" required placeholder="e.g. Imperial Bone China Royal Teacup">
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-select" id="modal-prod-category" required>
              <option value="dinner-sets">Dinner Sets</option>
              <option value="tea-sets">Tea Sets</option>
              <option value="coffee-mugs">Coffee Mugs</option>
              <option value="bowls">Bowls</option>
              <option value="plates">Plates</option>
              <option value="cups">Cups</option>
              <option value="serving-trays">Serving Trays</option>
              <option value="kitchen-accessories">Kitchen Accessories</option>
              <option value="ceramic-decor">Ceramic Decor</option>
              <option value="gift-collection">Gift Collection</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ceramic Material *</label>
            <select class="form-select" id="modal-prod-material">
              <option value="Stoneware">Stoneware</option>
              <option value="Porcelain">Porcelain</option>
              <option value="Bone China">Bone China</option>
              <option value="Terracotta">Terracotta</option>
              <option value="Ceramic">Ceramic</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Regular Price (INR) *</label>
            <input type="number" class="form-input" id="modal-prod-price" required min="100">
          </div>
          <div class="form-group">
            <label class="form-label">Discount Price (INR)</label>
            <input type="number" class="form-input" id="modal-prod-discount-price" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Initial Stock Units *</label>
            <input type="number" class="form-input" id="modal-prod-stock" required min="1" value="20">
          </div>
          <div class="form-group">
            <label class="form-label">Color Tone</label>
            <input type="text" class="form-input" id="modal-prod-color" value="Ivory White">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Image URLs (comma separated) or Main URL *</label>
            <input type="text" class="form-input" id="modal-prod-images" required placeholder="https://images.unsplash.com/photo-...">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Short Description</label>
            <input type="text" class="form-input" id="modal-prod-short-desc" required placeholder="Brief highlight sentence for card views">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Detailed Description</label>
            <textarea class="form-textarea" rows="3" id="modal-prod-desc" required placeholder="Full artisanal craftsmanship story, dimensions, and kiln details"></textarea>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('admin-product-modal').classList.remove('open')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Product</button>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('open');
}

async function submitSaveProduct(e) {
  e.preventDefault();
  const token = getAuthToken();

  const name = document.getElementById('modal-prod-name').value.trim();
  const categorySlug = document.getElementById('modal-prod-category').value;
  const material = document.getElementById('modal-prod-material').value;
  const price = Number(document.getElementById('modal-prod-price').value);
  const discountPrice = Number(document.getElementById('modal-prod-discount-price').value) || null;
  const stock = Number(document.getElementById('modal-prod-stock').value);
  const color = document.getElementById('modal-prod-color').value.trim();
  const images = document
    .getElementById('modal-prod-images')
    .value.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const shortDescription = document.getElementById('modal-prod-short-desc').value.trim();
  const description = document.getElementById('modal-prod-desc').value.trim();

  // Find Category ObjectId from categories list
  let categoryId = null;
  try {
    const catRes = await fetch(`${ClayVista.apiBase}/categories`);
    const catData = await catRes.json();
    if (catData.success) {
      const match = catData.categories.find((c) => c.slug === categorySlug);
      if (match) categoryId = match._id;
    }
  } catch (err) {}

  const payload = {
    name,
    category: categoryId,
    categorySlug,
    material,
    price,
    discountPrice,
    stock,
    color,
    images,
    shortDescription,
    description
  };

  try {
    const res = await fetch(`${ClayVista.apiBase}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('Product successfully added!', 'success');
      document.getElementById('admin-product-modal').classList.remove('open');
      loadAdminProducts();
    } else {
      showToast(data.message || 'Error saving product', 'error');
    }
  } catch (err) {
    showToast('Failed to save product', 'error');
  }
}

// 6. Manage Orders Tab
async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    allAdminOrders = data.orders;
    renderOrdersTable(allAdminOrders);
  } catch (err) {}
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>
        ${o.customerDetails?.name || 'Customer'}<br>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">${o.customerDetails?.phone || ''}</span>
      </td>
      <td>${o.orderItems?.length || 0} items</td>
      <td><strong>₹${o.grandTotal.toLocaleString('en-IN')}</strong></td>
      <td>
        <span class="status-badge status-${o.orderStatus}">${o.orderStatus.replace('_', ' ')}</span>
      </td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-sm btn-outline" onclick="openOrderModal('${o._id}')">Manage</button>
          <a href="/api/orders/${o._id}/invoice" target="_blank" class="btn btn-sm btn-outline">Invoice</a>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function openOrderModal(orderId) {
  const order = allAdminOrders.find((o) => o._id === orderId);
  if (!order) return;

  let modal = document.getElementById('admin-order-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-order-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const ship = order.customerDetails?.shippingAddress || {};

  modal.innerHTML = `
    <div class="modal-container" style="max-width: 720px;">
      <button class="modal-close-btn" onclick="document.getElementById('admin-order-modal').classList.remove('open')">✕</button>
      <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 4px;">Order #${order.orderNumber}</h3>
      <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 20px;">Placed on ${new Date(order.createdAt).toLocaleString('en-IN')}</p>

      <div style="background: var(--color-secondary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 0.88rem;">
        <h5 style="font-weight: 600; margin-bottom: 6px;">Customer & Delivery Details</h5>
        <p><strong>Name:</strong> ${order.customerDetails?.name} | <strong>Email:</strong> ${order.customerDetails?.email} | <strong>Phone:</strong> ${order.customerDetails?.phone}</p>
        <p style="margin-top: 4px;"><strong>Address:</strong> ${ship.street || ''}, ${ship.city || ''}, ${ship.state || ''} - ${ship.pincode || ''}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h5 style="font-weight: 600; margin-bottom: 10px;">Update Order Status & Dispatch</h5>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <select id="modal-update-order-status" class="form-select" style="max-width: 200px;">
            <option value="placed" ${order.orderStatus === 'placed' ? 'selected' : ''}>Placed</option>
            <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="out_for_delivery" ${order.orderStatus === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <input type="text" id="modal-update-tracking-num" class="form-input" style="max-width: 200px;" placeholder="Courier Tracking AWB" value="${order.courier?.trackingNumber || ''}">
          <button class="btn btn-primary" onclick="submitUpdateOrderStatus('${order._id}')">Update Status</button>
        </div>
      </div>

      <h5 style="font-weight: 600; margin-bottom: 10px;">Items Ordered (${order.orderItems?.length || 0})</h5>
      <div style="max-height: 200px; overflow-y: auto;">
        ${order.orderItems
          .map(
            (item) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border-light); font-size: 0.88rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
              <div>${item.name} (Qty: ${item.quantity})</div>
            </div>
            <strong>₹${item.total.toLocaleString('en-IN')}</strong>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  modal.classList.add('open');
}

async function submitUpdateOrderStatus(orderId) {
  const token = getAuthToken();
  const status = document.getElementById('modal-update-order-status').value;
  const trackingNumber = document.getElementById('modal-update-tracking-num').value.trim();

  try {
    const res = await fetch(`${ClayVista.apiBase}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, trackingNumber, note: `Status transitioned to ${status} by admin.` })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      document.getElementById('admin-order-modal').classList.remove('open');
      loadAdminOrders();
    }
  } catch (err) {
    showToast('Failed to update order status', 'error');
  }
}

// 7. Manage Customers Tab
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/admin/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    tbody.innerHTML = data.customers
      .map(
        (c) => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.phone || 'N/A'}</td>
        <td>${c.addresses?.length || 0} saved addresses</td>
        <td>${new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {}
}

// 8. Inventory Tab
async function loadAdminInventory() {
  const tbody = document.getElementById('admin-inventory-tbody');
  if (!tbody) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/admin/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    tbody.innerHTML = data.products
      .map(
        (p) => `
      <tr style="${p.stock <= p.lowStockThreshold ? 'background: rgba(211, 47, 47, 0.04);' : ''}">
        <td><img src="${p.images[0]}" class="table-thumb" alt="${p.name}"></td>
        <td><strong>${p.name}</strong><br><span style="font-size:0.75rem; color: var(--color-text-muted);">SKU: ${p.sku}</span></td>
        <td><strong>${p.stock} units</strong></td>
        <td>${p.lowStockThreshold} units</td>
        <td>
          ${p.stock <= p.lowStockThreshold ? `<span style="color: #D32F2F; font-weight: bold;">⚠ Low Stock Alert</span>` : `<span style="color: #2B5E43;">Sufficient</span>`}
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="restockProductPrompt('${p._id}', '${escapeHtml(p.name)}', ${p.stock})">Restock +</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {}
}

async function restockProductPrompt(productId, name, current) {
  const addCount = prompt(`Enter quantity to add to current stock (${current}) of "${name}":`, '20');
  if (!addCount || isNaN(addCount) || Number(addCount) <= 0) return;

  const newStock = current + Number(addCount);
  await quickUpdateStock(productId, newStock);
  loadAdminInventory();
}

// 9. Manage Coupons Tab
async function loadAdminCoupons() {
  const tbody = document.getElementById('admin-coupons-tbody');
  if (!tbody) return;

  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/coupons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    tbody.innerHTML = data.coupons
      .map(
        (c) => `
      <tr>
        <td><strong style="color: var(--color-accent); font-family: monospace; font-size: 1rem;">${c.code}</strong></td>
        <td>${c.discountType === 'percentage' ? c.discountValue + '% OFF' : '₹' + c.discountValue + ' FLAT'}</td>
        <td>₹${c.minOrderAmount.toLocaleString('en-IN')}</td>
        <td>${c.usedCount} / ${c.usageLimit}</td>
        <td>${c.isActive ? '<span style="color:#2B5E43; font-weight:bold;">Active</span>' : 'Expired'}</td>
        <td>
          <button class="btn btn-sm btn-outline" style="color: #D32F2F; border-color: #D32F2F;" onclick="deleteCoupon('${c._id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {}
}

async function deleteCoupon(couponId) {
  if (!confirm('Delete this promotional coupon?')) return;
  const token = getAuthToken();

  try {
    const res = await fetch(`${ClayVista.apiBase}/coupons/${couponId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Coupon removed', 'info');
      loadAdminCoupons();
    }
  } catch (e) {
    showToast('Failed to delete coupon', 'error');
  }
}

// 10. Reseed Database Trigger
async function reseedDatabase() {
  if (!confirm('This will reset and re-populate all sample ceramic products, categories, coupons, and orders. Proceed?')) return;
  const token = getAuthToken();

  try {
    showToast('Reseeding database with heirloom collections...', 'info');
    const res = await fetch(`${ClayVista.apiBase}/admin/reseed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => location.reload(), 1200);
    }
  } catch (err) {
    showToast('Reseed failed', 'error');
  }
}
