# 🏺 ClayVista - Luxury Porcelain & Ceramic Tableware E-Commerce Platform

> **Tagline:** *Crafting Elegance in Every Piece*

ClayVista is a modern, premium, fully responsive full-stack e-commerce web platform engineered for luxury porcelain, chinaware, and high-fired stoneware crockery.

---

## 🌟 Key Features

### 🛍️ Client Experience & Storefront
- **Luxury Aesthetic & Palette:** Clean porcelain whites (`#FFFFFF`), warm off-whites (`#F7F7F5`), artisanal terracotta accent (`#C46A4A`), and dark charcoal (`#333333`) with dark mode support.
- **Rich Typography:** Google Fonts *Playfair Display* (luxury serif) & *Poppins* (modern sans-serif).
- **Interactive 360° Studio Visualizer:** Examine ceramic pieces from every angle with intuitive horizontal drag simulation.
- **Hover Zoom Lens:** High-resolution zoom inspection on every product detail page.
- **Pincode Delivery Estimator:** Realistic logistics verification by Indian postal pincode with estimated delivery dates.
- **Product Comparison Drawer:** Side-by-side spec comparison (material, dimensions, dishwasher safe, microwave safe, firing temperature).
- **Multi-Currency Converter:** Instant dynamic pricing in INR (₹), USD ($), EUR (€), and GBP (£).
- **Floating Live Concierge Chat & WhatsApp:** Real-time advice on table styling, gifting sets, and order tracking.
- **Instant Search with Autocomplete:** Debounced real-time product search with direct thumbnail previews.
- **Smart Cart & Save for Later:** Live calculations for 18% GST, Free Shipping threshold (₹1,999), and coupon applications (`WELCOME15`, `CLAY10`).

### 📦 Order Tracking & Invoicing
- **Milestone Stepper:** Real-time 5-stage shipment progression (`Placed` ➔ `Inspected` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`).
- **Automated Tax Invoices (PDF):** Dynamically generated styled PDF invoices with GST breakdown, HSN classification, and studio seal.

### 🛠️ Administrative Operations Portal (`/admin/index.html`)
- **Executive Metrics:** Total Revenue, Total Orders, Active Catalog Items, Registered Customers, and Low Stock count.
- **Visual Sales Velocity Chart:** Revenue analytics graph over recent operational periods.
- **Product Management:** Full CRUD capabilities with image uploads, SKU generators, and ceramic material classifications.
- **Order Management:** Transition order states, attach courier tracking AWB numbers, and generate client invoices.
- **Inventory & Low Stock Alerts:** Automated warnings when stock reaches threshold, with inline restocking.
- **Coupons Engine:** Create percentage or fixed-amount discounts with usage limits and minimum order values.

---

## 💻 Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid, CSS Custom Properties), Vanilla JavaScript (Modular ES6+).
- **Backend:** Node.js & Express.js.
- **Database:** MongoDB & Mongoose (with zero-configuration auto-managed in-memory fallback for local development).
- **Authentication:** JWT, bcrypt password hashing, and 6-digit email OTP verification.
- **Payments:** Razorpay, Stripe, and Cash on Delivery (COD) with test-mode simulation.
- **Email:** Nodemailer with HTML templates for Order Confirmation, OTP, and Low Stock Alerts.
- **PDF Generation:** PDFKit for dynamic GST-compliant tax invoices.
- **Security:** Helmet, CORS, Rate Limiting, Input Sanitization, and Secure Role-Based Access Control.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+) and npm.
- MongoDB (optional: local service or MongoDB Atlas connection string in `.env`. If not provided, an auto-managed in-memory database automatically runs).

### 2. Installation
```bash
git clone <repository_url>
cd clayvista
npm install
```

### 3. Environment Setup
Review or modify `.env` (configured with working defaults):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/clayvista
JWT_SECRET=clayvista_super_secure_jwt_secret_key_2026_luxury_porcelain
```

### 4. Start the Application
```bash
npm start
```
The server will boot up, connect to MongoDB, automatically populate 15 luxury ceramic products, categories, coupons, and demo accounts, and listen on:
- **Storefront:** [http://localhost:5000](http://localhost:5000)
- **Admin Dashboard:** [http://localhost:5000/admin/index.html](http://localhost:5000/admin/index.html)

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Master Admin** | `admin@clayvista.com` | `Admin@12345` |
| **Demo Customer** | `customer@clayvista.com` | `Customer@12345` |

*Note: The login page includes one-click buttons to automatically load these credentials.*

---

## 🎟️ Active Promotional Coupons
- `WELCOME15`: 15% off first order (Min cart: ₹1,499)
- `CLAY10`: 10% off storewide (Min cart: ₹999)
- `FESTIVE500`: Flat ₹500 discount on heirloom dining sets above ₹3,999

---

## 📁 Project Structure

```text
clayvista/
├── client/
│   ├── css/
│   │   ├── style.css          # Core design system, variables & layout
│   │   ├── responsive.css     # Mobile & tablet breakpoints
│   │   └── admin.css          # Admin portal stylesheet
│   ├── js/
│   │   ├── main.js            # Theme, currency, search, chat, toast
│   │   ├── shop.js            # Catalog filtering, search, compare
│   │   ├── product.js         # Zoom, 360 viewer, pincode, reviews
│   │   ├── cart.js            # Cart calculations & save for later
│   │   ├── checkout.js        # Address picker & payment gateways
│   │   ├── dashboard.js       # Customer account & order history
│   │   ├── auth.js            # Auth & OTP recovery
│   │   └── admin.js           # Admin metrics & CRUD operations
│   ├── admin/
│   │   └── index.html         # Admin Dashboard UI
│   ├── index.html             # Homepage
│   ├── shop.html              # Catalog
│   ├── product.html           # Product Details
│   ├── categories.html        # Category Showcase
│   ├── about.html             # Craft Story & 1280°C Process
│   ├── contact.html           # Inquiries & Studio Visits
│   ├── blog.html              # Ceramic Journal
│   ├── faq.html               # FAQ Accordions
│   ├── cart.html              # Cart
│   ├── checkout.html          # Checkout
│   ├── order-success.html     # Confirmation & Invoice Download
│   ├── track-order.html       # Real-time Shipment Stepper
│   ├── user-dashboard.html    # Profile & Order History
│   ├── login.html             # Sign In
│   ├── register.html          # Create Account
│   └── forgot-password.html   # Password Recovery
├── server/
│   ├── config/
│   │   └── db.js              # MongoDB connector with auto-memory fallback
│   ├── controllers/           # API controllers
│   ├── models/                # Mongoose database models
│   ├── routes/                # Express REST routes
│   ├── middleware/            # JWT auth, upload & error handling
│   ├── utils/                 # PDF invoices & email dispatch
│   └── seed.js                # Initial database seed script
├── public/
│   └── uploads/               # Product image upload storage
├── server.js                  # Express server entry point
├── app.js                     # Root entry alias
├── package.json
└── .env
```

---

© 2026 ClayVista Tableware Private Limited. Handcrafted with pride in India.
