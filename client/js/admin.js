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

    // Store recent orders in allAdminOrders for instant modal details
    if (s.recentOrders && s.recentOrders.length > 0) {
      s.recentOrders.forEach((ro) => {
        if (!allAdminOrders.some((o) => o._id === ro._id)) {
          allAdminOrders.push(ro);
        }
      });
    }

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
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 25px; color: var(--color-text-muted);">No orders recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map((o) => {
      const ship = o.customerDetails?.shippingAddress || {};
      const phone = o.customerDetails?.phone || '';
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      const waNumber = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone.slice(-10);
      const itemsCount = o.orderItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || o.orderItems?.length || 0;

      return `
      <tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--color-text);">${o.customerDetails?.name || 'Customer'}</div>
          <div style="margin-top: 3px; font-size: 0.82rem;">
            ${phone ? `
              <a href="tel:${phone}" style="color: var(--color-accent); font-weight: 600; text-decoration: none;">📞 ${phone}</a>
              <a href="https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(o.customerDetails?.name || 'Customer')},%20regarding%20your%20ClayVista%20Order%20${o.orderNumber}" target="_blank" title="WhatsApp Customer" style="text-decoration: none; margin-left: 6px; font-size: 0.9rem;">💬</a>
            ` : '<span style="color: var(--color-text-muted);">No phone</span>'}
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">${o.customerDetails?.email || ''}</div>
        </td>
        <td>
          <div style="font-size: 0.82rem; line-height: 1.45; max-width: 240px;">
            <span style="font-weight: 600; color: var(--color-text);">📍 ${ship.street || 'Address on file'}${ship.apartment ? ', ' + ship.apartment : ''}</span><br>
            <span style="color: var(--color-text-muted);">${ship.city || ''}${ship.city && ship.state ? ', ' : ''}${ship.state || ''} ${ship.pincode ? '- ' + ship.pincode : ''}</span>
          </div>
        </td>
        <td><span style="font-weight: 600; font-size: 0.85rem;">${itemsCount} ${itemsCount === 1 ? 'item' : 'items'}</span></td>
        <td>
          <strong style="color: var(--color-accent);">₹${o.grandTotal.toLocaleString('en-IN')}</strong><br>
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600;">${o.paymentMethod || 'COD'} (${o.paymentStatus || 'pending'})</span>
        </td>
        <td><span class="status-badge status-${o.orderStatus}">${o.orderStatus.replace('_', ' ')}</span></td>
        <td style="font-size: 0.82rem; color: var(--color-text-muted); white-space: nowrap;">
          ${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-primary" onclick="openOrderModal('${o._id}')">Details</button>
            <a href="/api/orders/${o._id}/invoice" target="_blank" class="btn btn-sm btn-outline" title="PDF Tax Invoice">PDF</a>
          </div>
        </td>
      </tr>
      `;
    })
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

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 25px; color: var(--color-text-muted);">No orders recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map((o) => {
      const ship = o.customerDetails?.shippingAddress || {};
      const phone = o.customerDetails?.phone || '';
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      const waNumber = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone.slice(-10);
      const itemsList = o.orderItems && o.orderItems.length > 0 
        ? o.orderItems.map(i => `<div>• ${i.name} <strong>(×${i.quantity})</strong></div>`).join('') 
        : '0 items';

      return `
      <tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--color-text);">${o.customerDetails?.name || 'Customer'}</div>
          <div style="margin-top: 3px; font-size: 0.82rem;">
            ${phone ? `
              <a href="tel:${phone}" style="color: var(--color-accent); font-weight: 600; text-decoration: none;">📞 ${phone}</a>
              <a href="https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(o.customerDetails?.name || 'Customer')},%20regarding%20your%20ClayVista%20Order%20${o.orderNumber}" target="_blank" title="WhatsApp Customer" style="text-decoration: none; margin-left: 6px; font-size: 0.9rem;">💬</a>
            ` : '<span style="color: var(--color-text-muted);">No phone</span>'}
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">${o.customerDetails?.email || ''}</div>
        </td>
        <td>
          <div style="font-size: 0.82rem; line-height: 1.45; max-width: 240px;">
            <span style="font-weight: 600; color: var(--color-text);">📍 ${ship.street || 'Address on file'}${ship.apartment ? ', ' + ship.apartment : ''}</span><br>
            <span style="color: var(--color-text-muted);">${ship.city || ''}${ship.city && ship.state ? ', ' : ''}${ship.state || ''} ${ship.pincode ? '- ' + ship.pincode : ''}</span>
          </div>
        </td>
        <td>
          <div style="font-size: 0.82rem; max-width: 220px; line-height: 1.4;">
            ${itemsList}
          </div>
        </td>
        <td>
          <strong style="color: var(--color-accent);">₹${o.grandTotal.toLocaleString('en-IN')}</strong><br>
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600;">${o.paymentMethod || 'COD'} (${o.paymentStatus || 'pending'})</span>
        </td>
        <td><span class="status-badge status-${o.orderStatus}">${o.orderStatus.replace('_', ' ')}</span></td>
        <td style="font-size: 0.82rem; color: var(--color-text-muted); white-space: nowrap;">
          ${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-primary" onclick="openOrderModal('${o._id}')">Manage</button>
            <a href="/api/orders/${o._id}/invoice" target="_blank" class="btn btn-sm btn-outline" title="PDF Tax Invoice">Invoice</a>
          </div>
        </td>
      </tr>
      `;
    })
    .join('');
}

async function openOrderModal(orderId) {
  let order = allAdminOrders.find((o) => o._id === orderId || o.orderNumber === orderId);
  if (!order) {
    const token = getAuthToken();
    try {
      const res = await fetch(`${ClayVista.apiBase}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.order) {
        order = data.order;
        allAdminOrders.push(order);
      }
    } catch (e) {}
  }
  if (!order) return;

  let modal = document.getElementById('admin-order-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-order-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const ship = order.customerDetails?.shippingAddress || {};
  const phone = order.customerDetails?.phone || '';
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  const waNumber = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone.slice(-10);

  modal.innerHTML = `
    <div class="modal-container" style="max-width: 760px; max-height: 90vh; overflow-y: auto;">
      <button class="modal-close-btn" onclick="document.getElementById('admin-order-modal').classList.remove('open')">✕</button>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-right: 30px;">
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 4px;">Order #${order.orderNumber}</h3>
          <p style="color: var(--color-text-muted); font-size: 0.85rem;">Placed on ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-${order.orderStatus}" style="font-size: 0.85rem; padding: 4px 10px;">${order.orderStatus.replace('_', ' ')}</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <!-- Customer Contact Details -->
        <div style="background: var(--color-secondary); padding: 16px; border-radius: var(--radius-sm); font-size: 0.88rem;">
          <h5 style="font-weight: 600; margin-bottom: 8px; color: var(--color-accent); display: flex; align-items: center; gap: 6px;">
            👤 Customer Information
          </h5>
          <p style="margin-bottom: 6px;"><strong>Name:</strong> ${order.customerDetails?.name || 'Customer'}</p>
          <p style="margin-bottom: 6px;"><strong>Email:</strong> <a href="mailto:${order.customerDetails?.email || ''}" style="color: inherit;">${order.customerDetails?.email || 'N/A'}</a></p>
          <p style="margin-bottom: 8px;">
            <strong>Phone:</strong> ${phone ? `
              <a href="tel:${phone}" style="color: var(--color-accent); font-weight: 600; text-decoration: none;">${phone}</a>
            ` : 'N/A'}
          </p>
          ${phone ? `
            <a href="https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(order.customerDetails?.name || 'Customer')},%20regarding%20your%20ClayVista%20Order%20${order.orderNumber}" target="_blank" class="btn btn-sm" style="background: #25D366; color: #FFF; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-weight: 500; padding: 6px 12px; border-radius: 4px;">
              Chat on WhatsApp 💬
            </a>
          ` : ''}
        </div>

        <!-- Full Delivery Address -->
        <div style="background: var(--color-secondary); padding: 16px; border-radius: var(--radius-sm); font-size: 0.88rem;">
          <h5 style="font-weight: 600; margin-bottom: 8px; color: var(--color-accent); display: flex; align-items: center; gap: 6px;">
            📍 Delivery & Shipping Address
          </h5>
          <p style="line-height: 1.5; margin-bottom: 6px;">
            <strong>Street:</strong> ${ship.street || 'Address not specified'}${ship.apartment ? ', ' + ship.apartment : ''}<br>
            <strong>City:</strong> ${ship.city || 'N/A'}<br>
            <strong>State:</strong> ${ship.state || 'N/A'}<br>
            <strong>PIN Code:</strong> ${ship.pincode || 'N/A'}<br>
            <strong>Country:</strong> ${ship.country || 'India'}
          </p>
          <div style="margin-top: 6px; font-size: 0.8rem; color: var(--color-text-muted);">
            Payment: <strong>${(order.paymentMethod || 'COD').toUpperCase()}</strong> (${order.paymentStatus || 'Pending'})
          </div>
        </div>
      </div>

      <!-- Update Status Section -->
      <div style="background: var(--color-card-bg); border: 1px solid var(--color-border); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
        <h5 style="font-weight: 600; margin-bottom: 10px;">Update Order Status & Dispatch</h5>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <select id="modal-update-order-status" class="form-select" style="max-width: 180px;">
            <option value="placed" ${order.orderStatus === 'placed' ? 'selected' : ''}>Placed</option>
            <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="out_for_delivery" ${order.orderStatus === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <input type="text" id="modal-update-tracking-num" class="form-input" style="max-width: 200px;" placeholder="Courier Tracking AWB" value="${order.courier?.trackingNumber || ''}">
          <button class="btn btn-primary" onclick="submitUpdateOrderStatus('${order._id}')">Update Status</button>
          <a href="/api/orders/${order._id}/invoice" target="_blank" class="btn btn-outline">Download Invoice PDF</a>
        </div>
      </div>

      <!-- Items Ordered -->
      <h5 style="font-weight: 600; margin-bottom: 10px;">Items Ordered (${order.orderItems?.length || 0})</h5>
      <div style="border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 16px;">
        ${order.orderItems
          .map(
            (item) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--color-border-light); font-size: 0.88rem;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${item.image}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px;">
              <div>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 0.78rem; color: var(--color-text-muted);">Quantity: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <strong>₹${item.total.toLocaleString('en-IN')}</strong>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Totals Summary -->
      <div style="text-align: right; font-size: 0.9rem; padding-top: 8px;">
        <div style="margin-bottom: 4px; color: var(--color-text-muted);">Subtotal: <strong>₹${order.subtotal ? order.subtotal.toLocaleString('en-IN') : order.grandTotal.toLocaleString('en-IN')}</strong></div>
        <div style="margin-bottom: 4px; color: var(--color-text-muted);">GST (18%): <strong>₹${(order.taxGst || 0).toLocaleString('en-IN')}</strong></div>
        <div style="margin-bottom: 4px; color: var(--color-text-muted);">Shipping: <strong>${order.shippingFee === 0 ? 'FREE' : '₹' + (order.shippingFee || 0)}</strong></div>
        <div style="font-size: 1.15rem; font-weight: bold; color: var(--color-accent); margin-top: 8px;">Grand Total: ₹${order.grandTotal.toLocaleString('en-IN')}</div>
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
      .map((c) => {
        const phone = c.phone || '';
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        const waNumber = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone.slice(-10);
        const addrList = c.addresses && c.addresses.length > 0
          ? c.addresses.map(a => `
              <div style="font-size: 0.8rem; line-height: 1.4; margin-bottom: 4px; padding: 4px 6px; background: var(--color-secondary); border-radius: 4px;">
                📍 <strong>${a.street || ''}${a.apartment ? ', ' + a.apartment : ''}</strong><br>
                ${a.city || ''}, ${a.state || ''} - ${a.pincode || ''}
              </div>
            `).join('')
          : '<span style="color: var(--color-text-muted); font-size: 0.8rem;">No saved address</span>';

        return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.email}</td>
          <td>
            <strong>${phone || 'N/A'}</strong>
            ${phone ? ` <a href="https://wa.me/${waNumber}" target="_blank" title="WhatsApp Customer" style="text-decoration:none;">💬</a>` : ''}
          </td>
          <td>${addrList}</td>
          <td>${new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
        `;
      })
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
