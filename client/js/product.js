/**
 * ClayVista - Product Details Script (product.js)
 * Gallery, Zoom, 360 Spin, Pincode checker, Reviews, Related Products
 */

let currentProduct = null;
let currentQuantity = 1;
let currentAngleIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || params.get('id');

  if (!slug) {
    window.location.href = '/shop.html';
    return;
  }

  loadProductDetails(slug);
  initPincodeChecker();
  initReviewForm();
});

// 1. Fetch & Render Product Details
async function loadProductDetails(slug) {
  try {
    const res = await fetch(`${ClayVista.apiBase}/products/${slug}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      document.getElementById('product-details-container').innerHTML = `
        <div style="padding: 100px 20px; text-align: center;">
          <h2 style="font-family: var(--font-serif); margin-bottom: 12px;">Product Not Found</h2>
          <p style="color: var(--color-text-muted); margin-bottom: 24px;">The handcrafted tableware piece you are searching for might have found a new home.</p>
          <a href="/shop.html" class="btn btn-primary">Browse All Tableware</a>
        </div>
      `;
      return;
    }

    currentProduct = data.product;
    renderProductPage(currentProduct);
    saveRecentlyViewed(currentProduct);
    loadProductReviews(currentProduct._id);
    loadRelatedProducts(currentProduct._id);
  } catch (err) {
    console.error(err);
  }
}

// 2. Render Page Elements
function renderProductPage(p) {
  // Page Title & Breadcrumbs
  document.title = `${p.name} | ClayVista Luxury Ceramics`;
  const breadcrumbCat = document.getElementById('breadcrumb-category');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = p.category?.name || 'Tableware';
    breadcrumbCat.href = `/shop.html?category=${p.category?.slug || ''}`;
  }
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbTitle) breadcrumbTitle.textContent = p.name;

  // Title, SKU, Rating
  const titleEl = document.getElementById('product-title');
  if (titleEl) titleEl.textContent = p.name;

  const skuEl = document.getElementById('product-sku');
  if (skuEl) skuEl.textContent = `SKU: ${p.sku}`;

  const ratingStars = document.getElementById('product-rating-stars');
  if (ratingStars) {
    ratingStars.innerHTML = `★ <strong>${p.ratings.average.toFixed(1)}</strong> <span style="color: var(--color-text-light);">(${p.ratings.count} verified customer reviews)</span>`;
  }

  // Prices
  const priceCurrent = document.getElementById('product-price-current');
  if (priceCurrent) {
    const effectivePrice = p.discountPrice || p.price;
    priceCurrent.setAttribute('data-price-inr', effectivePrice);
    priceCurrent.textContent = formatPrice(effectivePrice);
  }

  const priceOriginal = document.getElementById('product-price-original');
  if (priceOriginal) {
    if (p.discountPrice && p.discountPrice < p.price) {
      priceOriginal.setAttribute('data-price-inr', p.price);
      priceOriginal.textContent = formatPrice(p.price);
      priceOriginal.style.display = 'inline';
    } else {
      priceOriginal.style.display = 'none';
    }
  }

  // Stock Badge
  const stockBadge = document.getElementById('product-stock-badge');
  if (stockBadge) {
    if (p.stock > 5) {
      stockBadge.innerHTML = `<span style="color: #2B5E43; font-weight: 600;">● In Stock (${p.stock} available)</span>`;
    } else if (p.stock > 0) {
      stockBadge.innerHTML = `<span style="color: #C46A4A; font-weight: 600;">● Only ${p.stock} left in studio kiln!</span>`;
    } else {
      stockBadge.innerHTML = `<span style="color: #D32F2F; font-weight: 600;">● Currently Out of Stock</span>`;
    }
  }

  // Descriptions
  const shortDesc = document.getElementById('product-short-desc');
  if (shortDesc) shortDesc.textContent = p.shortDescription;

  const longDesc = document.getElementById('product-long-desc');
  if (longDesc) longDesc.innerHTML = `<p>${p.description}</p>`;

  // Render Image Gallery
  renderGallery(p.images);

  // Render Specifications
  renderSpecifications(p);

  // Setup Add to Cart and Buy Now buttons
  const addCartBtn = document.getElementById('btn-add-to-cart');
  if (addCartBtn) {
    addCartBtn.onclick = () => addToCartGlobal(p._id, currentQuantity, addCartBtn);
  }

  const buyNowBtn = document.getElementById('btn-buy-now');
  if (buyNowBtn) {
    buyNowBtn.onclick = async () => {
      await addToCartGlobal(p._id, currentQuantity, buyNowBtn);
      window.location.href = '/checkout.html';
    };
  }

  const wishBtn = document.getElementById('btn-wishlist-detail');
  if (wishBtn) {
    wishBtn.onclick = () => toggleWishlistGlobal(p._id, wishBtn);
  }

  const shareBtn = document.getElementById('btn-share-product');
  if (shareBtn) {
    shareBtn.onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: p.name,
          text: `Check out ${p.name} from ClayVista - Handcrafted Ceramics`,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Product link copied to clipboard!', 'success');
      }
    };
  }

  // Setup Quantity Stepper
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyInput = document.getElementById('qty-input');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.onclick = () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        qtyInput.value = currentQuantity;
      }
    };
    qtyPlus.onclick = () => {
      if (currentQuantity < p.stock) {
        currentQuantity++;
        qtyInput.value = currentQuantity;
      } else {
        showToast(`Studio stock limit reached (${p.stock} units)`, 'info');
      }
    };
  }
}

// 3. Image Gallery & 360 Spin Visualizer
function renderGallery(images) {
  const mainImg = document.getElementById('main-gallery-image');
  const thumbStrip = document.getElementById('gallery-thumbnails');
  const zoomLens = document.getElementById('gallery-zoom-lens');
  const galleryWrapper = document.getElementById('gallery-main-wrapper');

  if (!mainImg || !thumbStrip) return;

  mainImg.src = images[0];

  thumbStrip.innerHTML = images
    .map(
      (img, i) => `
    <div class="gallery-thumb-item ${i === 0 ? 'active' : ''}" onclick="selectGalleryImage('${img}', this)" style="cursor: pointer; border-radius: 4px; overflow: hidden; border: 2px solid ${i === 0 ? 'var(--color-accent)' : 'transparent'};">
      <img src="${img}" alt="Angle ${i + 1}" style="width: 70px; height: 70px; object-fit: cover;">
    </div>
  `
    )
    .join('');

  // Interactive Hover Zoom Lens
  if (galleryWrapper && mainImg) {
    galleryWrapper.addEventListener('mousemove', (e) => {
      const rect = galleryWrapper.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      mainImg.style.transform = 'scale(1.6)';
    });

    galleryWrapper.addEventListener('mouseleave', () => {
      mainImg.style.transformOrigin = 'center center';
      mainImg.style.transform = 'scale(1)';
    });
  }

  // 360 Spin Simulator Controls
  const spinBtn = document.getElementById('btn-toggle-360');
  const spinModal = document.getElementById('modal-360-view');
  if (spinBtn) {
    spinBtn.onclick = () => open360Simulator(images);
  }
}

function selectGalleryImage(src, thumbEl) {
  const mainImg = document.getElementById('main-gallery-image');
  if (mainImg) mainImg.src = src;

  document.querySelectorAll('.gallery-thumb-item').forEach((item) => {
    item.style.borderColor = 'transparent';
    item.classList.remove('active');
  });

  if (thumbEl) {
    thumbEl.style.borderColor = 'var(--color-accent)';
    thumbEl.classList.add('active');
  }
}

// 4. Interactive 360° Spin Simulator
function open360Simulator(images) {
  let modal = document.getElementById('modal-360-view');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-360-view';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  // We cycle through available images or simulated angles
  const angles = images.length > 1 ? images : [images[0], images[0]];
  currentAngleIndex = 0;

  modal.innerHTML = `
    <div class="modal-container" style="max-width: 650px; text-align: center;">
      <button class="modal-close-btn" onclick="document.getElementById('modal-360-view').classList.remove('open')">✕</button>
      <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 6px;">360° Studio Inspection</h3>
      <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 20px;">Drag or use arrows to view this piece from every angle.</p>
      
      <div id="spin-container" style="position: relative; width: 100%; aspect-ratio: 1/1; background: var(--color-secondary); border-radius: var(--radius-md); overflow: hidden; cursor: grab; user-select: none;">
        <img id="spin-frame-img" src="${angles[0]}" style="width: 100%; height: 100%; object-fit: contain;">
        <div style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: #FFF; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; letter-spacing: 1px;">
          ⟲ DRAG HORIZONTALLY TO ROTATE ⟳
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 16px; margin-top: 20px;">
        <button class="btn btn-sm btn-outline" id="spin-left-btn">◀ Rotate Left</button>
        <button class="btn btn-sm btn-outline" id="spin-right-btn">Rotate Right ▶</button>
      </div>
    </div>
  `;

  modal.classList.add('open');

  const spinImg = document.getElementById('spin-frame-img');
  const spinBox = document.getElementById('spin-container');
  const leftBtn = document.getElementById('spin-left-btn');
  const rightBtn = document.getElementById('spin-right-btn');

  function rotate(step) {
    currentAngleIndex = (currentAngleIndex + step + angles.length) % angles.length;
    spinImg.src = angles[currentAngleIndex];
  }

  if (leftBtn) leftBtn.onclick = () => rotate(-1);
  if (rightBtn) rightBtn.onclick = () => rotate(1);

  // Drag interaction
  let isDragging = false;
  let startX = 0;

  spinBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    spinBox.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (spinBox) spinBox.style.cursor = 'grab';
  });

  spinBox.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 40) {
      rotate(diff > 0 ? 1 : -1);
      startX = e.clientX;
    }
  });
}

// 5. Specifications Table
function renderSpecifications(p) {
  const container = document.getElementById('product-specs-table');
  if (!container) return;

  const specs = p.specifications || {};
  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
      <tr style="border-bottom: 1px solid var(--color-border);"><td style="padding: 10px; font-weight: 600; width: 40%;">Material</td><td style="padding: 10px;">${p.material}</td></tr>
      <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-secondary);"><td style="padding: 10px; font-weight: 600;">Glaze Finish</td><td style="padding: 10px;">${p.finish || 'Matte Glaze'}</td></tr>
      <tr style="border-bottom: 1px solid var(--color-border);"><td style="padding: 10px; font-weight: 600;">Color Tone</td><td style="padding: 10px;">${p.color}</td></tr>
      <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-secondary);"><td style="padding: 10px; font-weight: 600;">Weight</td><td style="padding: 10px;">${p.weight}</td></tr>
      <tr style="border-bottom: 1px solid var(--color-border);"><td style="padding: 10px; font-weight: 600;">Dimensions</td><td style="padding: 10px;">Diameter: ${p.dimensions?.diameter || 'N/A'}, Height: ${p.dimensions?.height || 'N/A'}, Capacity: ${p.dimensions?.capacity || 'N/A'}</td></tr>
      <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-secondary);"><td style="padding: 10px; font-weight: 600;">Microwave & Dishwasher Safe</td><td style="padding: 10px;">${specs.microwaveSafe ? '✔ 100% Food Safe, Microwave & Dishwasher Friendly' : 'Gentle Handwash Recommended'}</td></tr>
      <tr style="border-bottom: 1px solid var(--color-border);"><td style="padding: 10px; font-weight: 600;">Lead & Cadmium Free</td><td style="padding: 10px;">✔ 100% Certified Non-Toxic & Food Grade</td></tr>
      <tr style="background: var(--color-secondary);"><td style="padding: 10px; font-weight: 600;">Firing Temperature</td><td style="padding: 10px;">${specs.firingTemperature || '1280°C High Fired Vitrified Stoneware'}</td></tr>
    </table>
  `;
}

// 6. Pincode Delivery Estimator
function initPincodeChecker() {
  const input = document.getElementById('pincode-input-field');
  const btn = document.getElementById('pincode-check-btn');
  const resultBox = document.getElementById('pincode-result-box');

  if (!btn || !input || !resultBox) return;

  btn.addEventListener('click', async () => {
    const pin = input.value.trim();
    if (pin.length !== 6 || isNaN(pin)) {
      resultBox.innerHTML = `<span style="color: #D32F2F;">Please enter a valid 6-digit postal pincode.</span>`;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {
      const res = await fetch(`${ClayVista.apiBase}/products/pincode/${pin}`);
      const data = await res.json();

      if (data.success && data.serviceable) {
        resultBox.innerHTML = `
          <div style="background: rgba(43, 94, 67, 0.08); border-left: 3px solid #2B5E43; padding: 12px; border-radius: 4px; font-size: 0.85rem; color: #2B5E43;">
            <p><strong>✔ Delivery Available to ${pin}</strong></p>
            <p style="margin-top: 4px; color: var(--color-text);">Estimated Delivery by <strong>${data.estimatedDeliveryDate}</strong> (${data.estimatedDeliveryDays} business days via ${data.courierPartner}). Free insured shipping on orders above ₹1,999.</p>
          </div>
        `;
      } else {
        resultBox.innerHTML = `<span style="color: #D32F2F;">${data.message || 'Delivery currently unavailable to this area.'}</span>`;
      }
    } catch (err) {
      resultBox.innerHTML = `<span style="color: #D32F2F;">Could not verify pincode. Please try again.</span>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Check';
    }
  });
}

// 7. Product Customer Reviews
async function loadProductReviews(productId) {
  const container = document.getElementById('product-reviews-list');
  if (!container) return;

  try {
    const res = await fetch(`${ClayVista.apiBase}/reviews/product/${productId}`);
    const data = await res.json();

    if (!data.success || data.reviews.length === 0) {
      container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--color-text-muted);">No reviews yet. Be the first to share your experience with this handcrafted piece!</div>`;
      return;
    }

    container.innerHTML = data.reviews
      .map(
        (r) => `
      <div style="padding: 20px 0; border-bottom: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-accent); color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">${r.userName[0]}</div>
            <strong style="font-size: 0.95rem;">${r.userName}</strong>
            <span style="font-size: 0.75rem; color: #2B5E43; background: rgba(43,94,67,0.1); padding: 2px 6px; border-radius: 4px;">Verified Purchase</span>
          </div>
          <span style="color: var(--color-text-light); font-size: 0.78rem;">${new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div style="color: #F5A623; font-size: 0.85rem; margin-bottom: 6px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        ${r.title ? `<h5 style="font-weight: 600; margin-bottom: 4px;">${r.title}</h5>` : ''}
        <p style="color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6;">${r.comment}</p>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

function initReviewForm() {
  const form = document.getElementById('add-review-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    const rating = form.querySelector('input[name="review_rating"]:checked')?.value || 5;
    const title = form.querySelector('#review-title-input')?.value.trim();
    const comment = form.querySelector('#review-comment-input')?.value.trim();
    const name = form.querySelector('#review-name-input')?.value.trim();

    if (!comment) {
      showToast('Please write your review feedback.', 'error');
      return;
    }

    const token = getAuthToken();

    try {
      const res = await fetch(`${ClayVista.apiBase}/reviews/product/${currentProduct._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rating, title, comment, userName: name })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        form.reset();
        loadProductReviews(currentProduct._id);
      } else {
        showToast(data.message || 'Could not submit review', 'error');
      }
    } catch (err) {
      showToast('Error submitting review', 'error');
    }
  });
}

// 8. Related Products
async function loadRelatedProducts(productId) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const res = await fetch(`${ClayVista.apiBase}/products/related/${productId}`);
    const data = await res.json();

    if (data.success && data.products.length > 0) {
      container.innerHTML = data.products
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
              <button class="btn-add-cart-card" onclick="addToCartGlobal('${p._id}', 1, this)">Add</button>
            </div>
          </div>
        </div>
      `
        )
        .join('');
    }
  } catch (e) {}
}

// 9. Save Recently Viewed in LocalStorage
function saveRecentlyViewed(p) {
  let list = JSON.parse(localStorage.getItem('clayvista_recent') || '[]');
  list = list.filter((item) => item.id !== p._id);
  list.unshift({
    id: p._id,
    name: p.name,
    slug: p.slug,
    image: p.images[0],
    price: p.discountPrice || p.price
  });
  if (list.length > 5) list.pop();
  localStorage.setItem('clayvista_recent', JSON.stringify(list));
}
