require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./server/config/db');
const errorHandler = require('./server/middleware/errorHandler');
const Product = require('./server/models/Product');
const seedData = require('./server/seed');

// Import Route Handlers
const authRoutes = require('./server/routes/authRoutes');
const productRoutes = require('./server/routes/productRoutes');
const categoryRoutes = require('./server/routes/categoryRoutes');
const orderRoutes = require('./server/routes/orderRoutes');
const cartRoutes = require('./server/routes/cartRoutes');
const wishlistRoutes = require('./server/routes/wishlistRoutes');
const paymentRoutes = require('./server/routes/paymentRoutes');
const reviewRoutes = require('./server/routes/reviewRoutes');
const couponRoutes = require('./server/routes/couponRoutes');
const blogRoutes = require('./server/routes/blogRoutes');
const contactRoutes = require('./server/routes/contactRoutes');
const adminRoutes = require('./server/routes/adminRoutes');

const app = express();

// Security Middleware (configured with relaxed CSP for fonts, Unsplash images & icons)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static Asset Directories
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use(express.static(path.join(__dirname, 'client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    store: 'ClayVista',
    tagline: 'Crafting Elegance in Every Piece'
  });
});

// Seed API endpoint for instant re-seeding if requested
app.post('/api/admin/reseed', async (req, res, next) => {
  try {
    await seedData();
    res.status(200).json({ success: true, message: 'Database successfully reseeded with sample products!' });
  } catch (err) {
    next(err);
  }
});

// Single Page Application / Static routing fallback
app.get('*', (req, res, next) => {
  // If request begins with /api, pass to error handler / 404
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  // If file doesn't exist, serve client index.html
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start Server with Graceful Port Collision Handling
const initialPort = parseInt(process.env.PORT, 10) || 5001;

const listenOnPort = (portToTry, retriesLeft = 3) => {
  const server = app.listen(portToTry, () => {
    console.log(`\n======================================================`);
    console.log(`  🏺 CLAYVISTA LUXURY CERAMICS & TABLEWARE PLATFORM`);
    console.log(`  Tagline: "Crafting Elegance in Every Piece"`);
    console.log(`  🌐 Website URL : http://localhost:${portToTry}`);
    console.log(`  🛠 Admin Panel : http://localhost:${portToTry}/admin/index.html`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\x1b[33m⚠ Port ${portToTry} is already occupied by another terminal/process.\x1b[0m`);
      if (retriesLeft > 0) {
        console.log(`\x1b[36mℹ Automatically binding to alternate port ${portToTry + 1}...\x1b[0m`);
        listenOnPort(portToTry + 1, retriesLeft - 1);
      } else {
        console.error(`\x1b[31m✖ Ports are busy. Please stop the existing process or change PORT in .env.\x1b[0m`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

const startServer = async () => {
  try {
    await connectDB();

    // Check if initial seed is needed
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('📦 Database is fresh. Pre-populating sample porcelain and ceramic collections...');
      await seedData();
    }

    listenOnPort(initialPort);
  } catch (err) {
    console.error('Failed to start ClayVista server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
