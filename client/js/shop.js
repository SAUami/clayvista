/**
 * ClayVista - Shop Page Script (shop.js)
 * Filtering, searching, sorting, pagination, and product comparison
 */

const ShopState = {
  category: 'all',
  material: 'all',
  minPrice: 0,
  maxPrice: 30000,
  rating: null,
  inStock: false,
  sort: 'latest',
  search: '',
  page: 1,
  limit: 12,
  viewMode: 'grid-3',
  compareList: JSON.parse(localStorage.getItem('clayvista_compare') || '[]')
};

document.addEventListener('DOMContentLoaded', () => {
  readUrlParams();
  loadCategoriesForSidebar();
  loadProducts();
  initFilterEvents();
  renderCompareBar();
});

// 1. Read URL Parameters
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) ShopState.category = params.get('category');
  if (params.get('material')) ShopState.material = params.get('material');
  if (params.get('search')) ShopState.search = params.get('search');
  if (params.get('sort')) ShopState.sort = params.get('sort');
  if (params.get('page')) ShopState.page = parseInt(params.get('page'), 10) || 1;

  // Set filter inputs if present
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput && ShopState.search) searchInput.value = ShopState.search;

  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect && ShopState.sort) sortSelect.value = ShopState.sort;
}

// 2. Load Categories for Filter Sidebar
async function loadCategoriesForSidebar() {
  const container = document.getElementById('sidebar-category-list');
  if (!container) return;

  try {
    const res = await fetch(`${ClayVista.apiBase}/categories`);
    const data = await res.json();
    if (data.success) {
      container.innerHTML = `
        <li style="margin-bottom: 8px;">
          <label style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem;">
            <span><input type="radio" name="cat_filter" value="all" ${ShopState.category === 'all' ? 'checked' : ''} onchange="filterByCategory('all')"> All Collections</span>
          </label>
        </li>
        ${data.categories
          .map(
            (c) => `
          <li style="margin-bottom: 8px;">
            <label style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem;">
              <span><input type="radio" name="cat_filter" value="${c.slug}" ${ShopState.category === c.slug ? 'checked' : ''} onchange="filterByCategory('${c.slug}')"> ${c.name}</span>
            </label>
          </li>
        `
          )
          .join('')}
      `;
    }
  } catch (err) {}
}

function filterByCategory(slug) {
  ShopState.category = slug;
  ShopState.page = 1;
  loadProducts();
}

// 3. Load Products from Backend API
async function loadProducts() {
  const grid = document.getElementById('shop-products-grid');
  const countDisplay = document.getElementById('shop-results-count');
  const paginationContainer = document.getElementById('shop-pagination');

  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px; text-align: center;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(196,106,74,0.2); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 14px; color: var(--color-text-muted);">Curating handcrafted tableware...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  }

  // Construct query parameters
  const params = new URLSearchParams();
  if (ShopState.category && ShopState.category !== 'all') params.set('category', ShopState.category);
  if (ShopState.material && ShopState.material !== 'all') params.set('material', ShopState.material);
  if (ShopState.search) params.set('search', ShopState.search);
  if (ShopState.minPrice > 0) params.set('minPrice', ShopState.minPrice);
  if (ShopState.maxPrice < 30000) params.set('maxPrice', ShopState.maxPrice);
  if (ShopState.rating) params.set('rating', ShopState.rating);
  if (ShopState.inStock) params.set('inStock', 'true');
  if (ShopState.sort) params.set('sort', ShopState.sort);
  params.set('page', ShopState.page);
  params.set('limit', ShopState.limit);

  try {
    const res = await fetch(`${ClayVista.apiBase}/products?${params.toString()}`);
    const data = await res.json();

    if (!data.success || data.products.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 80px 20px; text-align: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-accent); margin-bottom: 16px;"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
            <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 8px;">No Ceramic Pieces Found</h3>
            <p style="color: var(--color-text-muted); margin-bottom: 24px;">Try loosening your filters or search keywords to explore our wider collection.</p>
            <button class="btn btn-outline" onclick="resetAllFilters()">Reset All Filters</button>
          </div>
        `;
      }
      if (countDisplay) countDisplay.textContent = 'Showing 0 products';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    if (countDisplay) {
      countDisplay.textContent = `Showing ${data.products.length} of ${data.totalProducts} handcrafted pieces`;
    }

    // Render Product Cards
    if (grid) {
      grid.innerHTML = data.products.map((p) => createProductCardHTML(p)).join('');
      // Trigger price formatting for newly created elements
      updatePricesOnPage();
    }

    // Render Pagination
    if (paginationContainer && data.totalPages > 1) {
      let pageHtml = '';
      for (let i = 1; i <= data.totalPages; i++) {
        pageHtml += `
          <button class="btn btn-sm ${i === data.currentPage ? 'btn-primary' : 'btn-outline'}" onclick="changePage(${i})" style="min-width: 38px; margin: 0 4px;">
            ${i}
          </button>
        `;
      }
      paginationContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; margin-top: 40px;">
          ${data.currentPage > 1 ? `<button class="btn btn-sm btn-outline" onclick="changePage(${data.currentPage - 1})" style="margin-right: 8px;">Prev</button>` : ''}
          ${pageHtml}
          ${data.currentPage < data.totalPages ? `<button class="btn btn-sm btn-outline" onclick="changePage(${data.currentPage + 1})" style="margin-left: 8px;">Next</button>` : ''}
        </div>
      `;
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #D32F2F;">Failed to load catalog. Please check your connection.</div>`;
    }
  }
}

// 4. Product Card Template
function createProductCardHTML(p) {
  const isCompared = ShopState.compareList.some((c) => c.id === p._id);

  let badges = '';
  if (p.discountPrice && p.discountPrice < p.price) {
    const pct = Math.round(((p.price - p.discountPrice) / p.price) * 100);
    badges += `<span class="badge badge-sale">${pct}% OFF</span>`;
  }
  if (p.isBestSeller) {
    badges += `<span class="badge badge-best">Best Seller</span>`;
  } else if (p.isNewArrival) {
    badges += `<span class="badge badge-new">New Arrival</span>`;
  }

  return `
    <div class="product-card" data-product-id="${p._id}">
      <div class="product-thumb-wrapper">
        <div class="product-badges">${badges}</div>
        <a href="/product.html?slug=${p.slug}">
          <img src="${p.images[0]}" alt="${p.name}" class="product-thumb" loading="lazy">
        </a>
        <div class="product-actions-hover">
          <button class="action-icon-btn" title="Save to Wishlist" onclick="toggleWishlistGlobal('${p._id}', this)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
          <button class="action-icon-btn" title="Quick View" onclick="openQuickView('${p._id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="action-icon-btn ${isCompared ? 'active' : ''}" title="Compare Specs" onclick="toggleCompare('${p._id}', '${escapeHtml(p.name)}', '${p.images[0]}', ${p.discountPrice || p.price}, '${p.material}', this)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"></path><path d="M4 20L21 3"></path><path d="M21 16v5h-5"></path><path d="M15 15l6 6"></path><path d="M4 4l5 5"></path></svg>
          </button>
        </div>
      </div>
      <div class="product-card-body">
        <span class="product-category-name">${p.material} • ${p.category?.name || 'Ceramic'}</span>
        <h4 class="product-card-title"><a href="/product.html?slug=${p.slug}">${p.name}</a></h4>
        <div class="product-rating">
          <span>★</span> <strong>${p.ratings.average.toFixed(1)}</strong>
          <span class="rating-count">(${p.ratings.count})</span>
        </div>
        <div class="product-card-footer">
          <div class="product-price-box">
            <span class="price-current" data-price-inr="${p.discountPrice || p.price}">${formatPrice(p.discountPrice || p.price)}</span>
            ${p.discountPrice ? `<span class="price-original" data-price-inr="${p.price}">${formatPrice(p.price)}</span>` : ''}
          </div>
          <button class="btn-add-cart-card" onclick="addToCartGlobal('${p._id}', 1, this)">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'");
}

function changePage(page) {
  ShopState.page = page;
  loadProducts();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

// 5. Initialize Filter Event Listeners
function initFilterEvents() {
  // Sort dropdown
  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      ShopState.sort = e.target.value;
      ShopState.page = 1;
      loadProducts();
    });
  }

  // Search input
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ShopState.search = e.target.value.trim();
        ShopState.page = 1;
        loadProducts();
      }, 400);
    });
  }

  // Material checkboxes
  const materialInputs = document.querySelectorAll('input[name="material_filter"]');
  materialInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const selected = Array.from(materialInputs)
        .filter((i) => i.checked)
        .map((i) => i.value);
      ShopState.material = selected.length > 0 ? selected.join(',') : 'all';
      ShopState.page = 1;
      loadProducts();
    });
  });

  // Price slider
  const priceSlider = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-slider-value');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      ShopState.maxPrice = Number(e.target.value);
      priceDisplay.textContent = formatPrice(ShopState.maxPrice);
    });
    priceSlider.addEventListener('change', () => {
      ShopState.page = 1;
      loadProducts();
    });
  }

  // In Stock Only Toggle
  const stockToggle = document.getElementById('in-stock-only-toggle');
  if (stockToggle) {
    stockToggle.addEventListener('change', (e) => {
      ShopState.inStock = e.target.checked;
      ShopState.page = 1;
      loadProducts();
    });
  }

  // Mobile Filter Drawer Toggle
  const filterOpenBtn = document.getElementById('open-filters-btn');
  const filterCloseBtn = document.getElementById('close-filters-btn');
  const sidebar = document.getElementById('shop-filter-sidebar');

  if (filterOpenBtn && sidebar) {
    filterOpenBtn.addEventListener('click', () => sidebar.classList.add('open'));
  }
  if (filterCloseBtn && sidebar) {
    filterCloseBtn.addEventListener('click', () => sidebar.classList.remove('open'));
  }
}

function resetAllFilters() {
  ShopState.category = 'all';
  ShopState.material = 'all';
  ShopState.minPrice = 0;
  ShopState.maxPrice = 30000;
  ShopState.rating = null;
  ShopState.inStock = false;
  ShopState.search = '';
  ShopState.page = 1;

  // Reset inputs
  document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = r.value === 'all'));
  document.querySelectorAll('input[type="checkbox"]').forEach((c) => (c.checked = false));
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) searchInput.value = '';

  loadProducts();
}

// 6. Product Comparison Drawer
function toggleCompare(id, name, image, price, material, btnEl) {
  const index = ShopState.compareList.findIndex((item) => item.id === id);

  if (index > -1) {
    ShopState.compareList.splice(index, 1);
    if (btnEl) btnEl.classList.remove('active');
    showToast(`Removed "${name}" from comparison`, 'info');
  } else {
    if (ShopState.compareList.length >= 3) {
      showToast('You can compare a maximum of 3 products at a time.', 'error');
      return;
    }
    ShopState.compareList.push({ id, name, image, price, material });
    if (btnEl) btnEl.classList.add('active');
    showToast(`Added "${name}" to comparison`, 'success');
  }

  localStorage.setItem('clayvista_compare', JSON.stringify(ShopState.compareList));
  renderCompareBar();
}

function renderCompareBar() {
  let bar = document.getElementById('compare-sticky-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compare-sticky-bar';
    bar.style.cssText = `
      position: fixed; bottom: 0; left: 0; width: 100%; background: #1A1A1A; color: #FFF;
      padding: 12px 24px; box-shadow: 0 -4px 20px rgba(0,0,0,0.25); z-index: 9990;
      display: flex; align-items: center; justify-content: space-between; transition: transform 0.3s ease;
      transform: translateY(100%);
    `;
    document.body.appendChild(bar);
  }

  if (ShopState.compareList.length === 0) {
    bar.style.transform = 'translateY(100%)';
    return;
  }

  bar.style.transform = 'translateY(0)';
  bar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 16px;">
      <span style="font-weight: 600; font-size: 0.9rem;">Compare Products (${ShopState.compareList.length}/3):</span>
      <div style="display: flex; gap: 10px;">
        ${ShopState.compareList
          .map(
            (c) => `
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;">
            <img src="${c.image}" style="width: 24px; height: 24px; object-fit: cover; border-radius: 2px;">
            <span>${c.name.substring(0, 20)}...</span>
            <button onclick="toggleCompare('${c.id}', '', '', 0, '', null)" style="color: #FF7043; cursor: pointer; font-size: 1rem; margin-left: 4px;">✕</button>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-sm btn-outline-white" onclick="clearCompare()">Clear All</button>
      <button class="btn btn-sm btn-accent" onclick="openCompareModal()">Compare Now</button>
    </div>
  `;
}

function clearCompare() {
  ShopState.compareList = [];
  localStorage.setItem('clayvista_compare', '[]');
  renderCompareBar();
  document.querySelectorAll('.action-icon-btn.active').forEach((btn) => btn.classList.remove('active'));
}

async function openCompareModal() {
  if (ShopState.compareList.length === 0) return;

  try {
    // Fetch details for each product
    const details = await Promise.all(
      ShopState.compareList.map((c) => fetch(`${ClayVista.apiBase}/products/${c.id}`).then((r) => r.json()))
    );

    const prods = details.map((d) => d.product).filter(Boolean);

    let modal = document.getElementById('compare-details-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'compare-details-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container" style="max-width: 960px;">
        <button class="modal-close-btn" onclick="document.getElementById('compare-details-modal').classList.remove('open')">✕</button>
        <h3 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 24px;">Product Specifications Comparison</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-border);">
                <th style="padding: 12px; width: 25%;">Feature</th>
                ${prods
                  .map(
                    (p) => `
                  <th style="padding: 12px; text-align: center;">
                    <img src="${p.images[0]}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; margin: 0 auto 8px;">
                    <a href="/product.html?slug=${p.slug}" style="font-weight: 600; color: var(--color-text);">${p.name}</a>
                  </th>
                `
                  )
                  .join('')}
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 12px; font-weight: 600;">Price</td>
                ${prods.map((p) => `<td style="padding: 12px; text-align: center; font-weight: bold; color: var(--color-accent);">${formatPrice(p.discountPrice || p.price)}</td>`).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-secondary);">
                <td style="padding: 12px; font-weight: 600;">Material</td>
                ${prods.map((p) => `<td style="padding: 12px; text-align: center;">${p.material}</td>`).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 12px; font-weight: 600;">Glaze Finish</td>
                ${prods.map((p) => `<td style="padding: 12px; text-align: center;">${p.finish || 'Matte'}</td>`).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-secondary);">
                <td style="padding: 12px; font-weight: 600;">Microwave & Dishwasher Safe</td>
                ${prods.map((p) => `<td style="padding: 12px; text-align: center;">${p.specifications?.microwaveSafe ? '✔ 100% Safe' : 'Handwash Only'}</td>`).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 12px; font-weight: 600;">Origin & Firing</td>
                ${prods.map((p) => `<td style="padding: 12px; text-align: center;">${p.specifications?.firingTemperature || '1280°C High Fired'}</td>`).join('')}
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: 600;">Action</td>
                ${prods.map((p) => `<td style="padding: 12px; text-align: center;"><button class="btn btn-sm btn-primary" onclick="addToCartGlobal('${p._id}', 1, this)">Add to Cart</button></td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    modal.classList.add('open');
  } catch (err) {
    showToast('Failed to load comparison', 'error');
  }
}
