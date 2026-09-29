/**
 * ClayVista - Core Client JavaScript (main.js)
 * Global utilities, auth state, currency conversion, theme, live concierge chat, toasts
 */

// Global State & Config
const ClayVista = {
  apiBase: '/api',
  currency: localStorage.getItem('clayvista_currency') || 'INR',
  currencyRates: {
    INR: { symbol: '₹', rate: 1 },
    USD: { symbol: '$', rate: 0.012 },
    EUR: { symbol: '€', rate: 0.011 },
    GBP: { symbol: '£', rate: 0.0095 }
  },
  theme: localStorage.getItem('clayvista_theme') || 'light'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollEffects();
  initCurrency();
  initAuthUI();
  updateNavCounters();
  initSearch();
  initLiveChat();
  initNewsletter();
  initMobileMenu();
});

// 1. Theme Management (Dark / Light Mode)
function initTheme() {
  document.documentElement.setAttribute('data-theme', ClayVista.theme);
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    updateThemeIcon(themeToggle);
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  ClayVista.theme = ClayVista.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', ClayVista.theme);
  localStorage.setItem('clayvista_theme', ClayVista.theme);
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) updateThemeIcon(themeToggle);
  showToast(`Switched to ${ClayVista.theme} mode`, 'info');
}

function updateThemeIcon(btn) {
  if (ClayVista.theme === 'dark') {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    btn.setAttribute('title', 'Switch to Light Mode');
  } else {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    btn.setAttribute('title', 'Switch to Dark Mode');
  }
}

// 2. Scroll Progress & Header Scroll Shadow
function initScrollEffects() {
  const progressBar = document.getElementById('scroll-progress');
  const header = document.querySelector('.site-header');
  const backToTop = document.getElementById('back-to-top-btn');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar && docHeight > 0) {
      const scrollPercent = (scrollY / docHeight) * 100;
      progressBar.style.width = scrollPercent + '%';
    }

    if (header) {
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    if (backToTop) {
      if (scrollY > 400) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    }
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// 3. Multi-Currency Formatter
function initCurrency() {
  const currencySelects = document.querySelectorAll('.currency-select');
  currencySelects.forEach((select) => {
    select.value = ClayVista.currency;
    select.addEventListener('change', (e) => {
      ClayVista.currency = e.target.value;
      localStorage.setItem('clayvista_currency', ClayVista.currency);
      // Synchronize other select elements
      currencySelects.forEach((s) => (s.value = ClayVista.currency));
      // Trigger price update across DOM
      updatePricesOnPage();
      showToast(`Currency changed to ${ClayVista.currency}`, 'info');
    });
  });
}

function formatPrice(amountInINR) {
  if (amountInINR === undefined || amountInINR === null) return '';
  const current = ClayVista.currencyRates[ClayVista.currency] || ClayVista.currencyRates.INR;
  const converted = Math.round(amountInINR * current.rate);

  if (ClayVista.currency === 'INR') {
    return `${current.symbol}${converted.toLocaleString('en-IN')}`;
  }
  return `${current.symbol}${converted.toLocaleString()}`;
}

function updatePricesOnPage() {
  document.querySelectorAll('[data-price-inr]').forEach((el) => {
    const inr = parseFloat(el.getAttribute('data-price-inr'));
    if (!isNaN(inr)) {
      el.textContent = formatPrice(inr);
    }
  });
}

// 4. Auth State & UI
function getAuthToken() {
  return localStorage.getItem('clayvista_token');
}

function getCurrentUser() {
  const userJson = localStorage.getItem('clayvista_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem('clayvista_token');
  localStorage.removeItem('clayvista_user');
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 500);
}

function initAuthUI() {
  const user = getCurrentUser();
  const authContainer = document.getElementById('user-auth-link');

  if (authContainer) {
    if (user) {
      authContainer.innerHTML = `
        <a href="/user-dashboard.html" class="action-btn" title="My Account (${user.name})">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </a>
      `;
    } else {
      authContainer.innerHTML = `
        <a href="/login.html" class="action-btn" title="Sign In">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </a>
      `;
    }
  }
}

// 5. Cart & Wishlist Counters
async function updateNavCounters() {
  const token = getAuthToken();
  const sessionId = getSessionId();

  // 1. Cart Count
  try {
    const res = await fetch(`${ClayVista.apiBase}/cart`, {
      headers: {
        'x-session-id': sessionId,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (data.success && data.cart) {
      const cartCountEl = document.getElementById('cart-badge-count');
      if (cartCountEl) {
        cartCountEl.textContent = data.cart.totalItems || 0;
        cartCountEl.style.display = data.cart.totalItems > 0 ? 'flex' : 'none';
      }
    }
  } catch (err) {
    // console.warn('Could not update cart counter:', err.message);
  }

  // 2. Wishlist Count
  if (token) {
    try {
      const res = await fetch(`${ClayVista.apiBase}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const wishCountEl = document.getElementById('wishlist-badge-count');
        if (wishCountEl) {
          wishCountEl.textContent = data.count || 0;
          wishCountEl.style.display = data.count > 0 ? 'flex' : 'none';
        }
      }
    } catch (e) {}
  }
}

function getSessionId() {
  let sId = localStorage.getItem('clayvista_session_id');
  if (!sId) {
    sId = 'cv_sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('clayvista_session_id', sId);
  }
  return sId;
}

// 6. Global Toast Notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = `ℹ`;
  if (type === 'success') icon = `✔`;
  if (type === 'error') icon = `✖`;

  toast.innerHTML = `
    <span style="font-size: 1.1rem; font-weight: bold;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 7. Interactive Search Modal & Instant Autocomplete
function initSearch() {
  const searchBtn = document.getElementById('search-toggle-btn');
  const searchModal = document.getElementById('search-modal');
  const closeBtn = document.getElementById('search-modal-close');
  const input = document.getElementById('search-input-field');
  const resultsContainer = document.getElementById('search-results-list');

  if (searchBtn && searchModal) {
    searchBtn.addEventListener('click', () => {
      searchModal.classList.add('open');
      if (input) {
        input.focus();
        input.value = '';
      }
      if (resultsContainer) resultsContainer.innerHTML = '';
    });
  }

  if (closeBtn && searchModal) {
    closeBtn.addEventListener('click', () => {
      searchModal.classList.remove('open');
    });
  }

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) searchModal.classList.remove('open');
    });
  }

  // Live Autocomplete typing with debounce
  if (input && resultsContainer) {
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`${ClayVista.apiBase}/products?search=${encodeURIComponent(query)}&limit=5`);
          const data = await res.json();

          if (data.success && data.products.length > 0) {
            resultsContainer.innerHTML = data.products
              .map(
                (p) => `
                <a href="/product.html?slug=${p.slug}" style="display: flex; align-items: center; gap: 14px; padding: 10px; border-bottom: 1px solid var(--color-border); border-radius: var(--radius-sm); transition: background 0.2s;">
                  <img src="${p.images[0]}" alt="${p.name}" style="width: 52px; height: 52px; object-fit: cover; border-radius: 4px;">
                  <div style="flex: 1;">
                    <h5 style="font-weight: 600; font-size: 0.95rem; margin-bottom: 2px;">${p.name}</h5>
                    <span style="font-size: 0.78rem; color: var(--color-accent);">${p.material} • ${p.category?.name || 'Ceramic'}</span>
                  </div>
                  <div style="font-weight: 700; font-size: 0.95rem;">${formatPrice(p.discountPrice || p.price)}</div>
                </a>
              `
              )
              .join('');
          } else {
            resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--color-text-muted);">No handcrafted ceramic pieces found matching "${query}".</div>`;
          }
        } catch (err) {
          // silent fail
        }
      }, 300);
    });
  }
}

// 8. Floating Live Concierge Chat Widget
function initLiveChat() {
  const chatToggle = document.getElementById('chat-toggle-btn');
  const chatWindow = document.getElementById('live-chat-window');
  const chatClose = document.getElementById('chat-close-btn');
  const chatForm = document.getElementById('chat-message-form');
  const chatInput = document.getElementById('chat-input-text');
  const chatBox = document.getElementById('chat-messages-container');

  if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      if (chatInput && chatWindow.classList.contains('open')) {
        chatInput.focus();
      }
    });
  }

  if (chatClose && chatWindow) {
    chatClose.addEventListener('click', () => {
      chatWindow.classList.remove('open');
    });
  }

  if (chatForm && chatInput && chatBox) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      // Append user msg
      const userMsg = document.createElement('div');
      userMsg.className = 'chat-msg msg-user';
      userMsg.textContent = userText;
      chatBox.appendChild(userMsg);
      chatInput.value = '';
      chatBox.scrollTop = chatBox.scrollHeight;

      // Smart luxury concierge response simulation
      setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg msg-bot';
        botMsg.innerHTML = generateConciergeReply(userText);
        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 600);
    });
  }
}

function generateConciergeReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes('dinner set') || lower.includes('16-piece') || lower.includes('plate')) {
    return `Our signature <strong>Aura Matte Charcoal 16-Piece Dinner Set</strong> and <strong>Imperial Bone China Set</strong> are high-fired at 1280°C and 100% dishwasher & microwave safe. Would you like me to guide you to our Dinner Sets collection?`;
  }
  if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('pincode')) {
    return `We offer <strong>Free Insured Shipping</strong> on all orders above ₹1,999. All ceramics are encased in custom foam molds guaranteed against breakage. You can check exact pincode delivery times on any product page!`;
  }
  if (lower.includes('track') || lower.includes('order')) {
    return `You can track your package in real-time with your Order ID via our <a href="/track-order.html" style="color: var(--color-accent); text-decoration: underline;">Track Order page</a>.`;
  }
  if (lower.includes('discount') || lower.includes('coupon') || lower.includes('code')) {
    return `You can use coupon code <strong>WELCOME15</strong> to receive 15% off your first handcrafted set, or <strong>CLAY10</strong> for 10% off storewide!`;
  }
  if (lower.includes('microwave') || lower.includes('care') || lower.includes('wash')) {
    return `All ClayVista stoneware and porcelain items are microwave and dishwasher safe. For items with hand-applied 24K gold lustre, we recommend gentle hand washing to preserve metallic shine.`;
  }

  return `Welcome to ClayVista! Our master pottery concierge is here to assist you with table curation, bespoke gifting, dinner sets, or order tracking. How may we delight you today?`;
}

// 9. Newsletter Form
function initNewsletter() {
  const form = document.getElementById('newsletter-subscription-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value) return;

      try {
        const res = await fetch(`${ClayVista.apiBase}/contact/newsletter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Subscribed successfully! Use WELCOME15 for 15% off.', 'success');
          input.value = '';
        } else {
          showToast(data.message || 'Subscription failed', 'error');
        }
      } catch (err) {
        showToast('Thank you for subscribing to ClayVista dispatches!', 'success');
        input.value = '';
      }
    });
  }
}

// 10. Mobile Navigation Drawer
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');

  function openDrawer() {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
}

// 11. Wishlist Global Toggle Helper
async function toggleWishlistGlobal(productId, btnEl) {
  const token = getAuthToken();
  if (!token) {
    showToast('Please log in to save items to your wishlist.', 'error');
    setTimeout(() => (window.location.href = '/login.html'), 1200);
    return;
  }

  try {
    const res = await fetch(`${ClayVista.apiBase}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, data.added ? 'success' : 'info');
      if (btnEl) {
        if (data.added) {
          btnEl.classList.add('active');
          btnEl.style.color = '#C46A4A';
        } else {
          btnEl.classList.remove('active');
          btnEl.style.color = '';
        }
      }
      updateNavCounters();
    }
  } catch (err) {
    showToast('Could not update wishlist', 'error');
  }
}

// 12. Add to Cart Global Helper
async function addToCartGlobal(productId, quantity = 1, btnEl) {
  const token = getAuthToken();
  const sessionId = getSessionId();

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = `<span style="font-size:0.8rem">Adding...</span>`;
  }

  try {
    const res = await fetch(`${ClayVista.apiBase}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      updateNavCounters();
    } else {
      showToast(data.message || 'Could not add product to cart', 'error');
    }
  } catch (err) {
    showToast('Error connecting to cart service', 'error');
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = `Add to Cart`;
    }
  }
}

// 13. Quick View Modal Opener
async function openQuickView(productId) {
  try {
    const res = await fetch(`${ClayVista.apiBase}/products/${productId}`);
    const data = await res.json();
    if (!data.success || !data.product) return;
    const p = data.product;

    let modal = document.getElementById('quick-view-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quick-view-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container">
        <button class="modal-close-btn" onclick="document.getElementById('quick-view-modal').classList.remove('open')">✕</button>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center;">
          <div style="border-radius: var(--radius-md); overflow: hidden; background: var(--color-secondary);">
            <img src="${p.images[0]}" alt="${p.name}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover;">
          </div>
          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-accent); font-weight: 600;">${p.category?.name || 'Tableware'}</span>
            <h3 style="font-family: var(--font-serif); font-size: 1.6rem; margin: 6px 0 12px;">${p.name}</h3>
            <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;">
              <span style="font-size: 1.5rem; font-weight: 700; color: var(--color-text);">${formatPrice(p.discountPrice || p.price)}</span>
              ${p.discountPrice ? `<span style="text-decoration: line-through; color: var(--color-text-light);">${formatPrice(p.price)}</span>` : ''}
            </div>
            <p style="color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">${p.shortDescription}</p>
            <div style="background: var(--color-secondary); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 24px; font-size: 0.82rem;">
              <p><strong>Material:</strong> ${p.material} | <strong>Color:</strong> ${p.color}</p>
              <p style="margin-top: 4px;"><strong>Stock:</strong> ${p.stock > 0 ? `<span style="color:#2B5E43;">In Stock (${p.stock} units)</span>` : `<span style="color:#D32F2F;">Out of Stock</span>`}</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <button class="btn btn-primary" onclick="addToCartGlobal('${p._id}', 1, this)">Add to Cart</button>
              <a href="/product.html?slug=${p.slug}" class="btn btn-outline">View Full Details</a>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('open');
  } catch (err) {
    showToast('Could not load quick view', 'error');
  }
}
