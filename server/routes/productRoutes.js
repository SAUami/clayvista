const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getFeatured,
  getBestSellers,
  getTrending,
  getRelated,
  checkPincode,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeatured);
router.get('/best-sellers', getBestSellers);
router.get('/trending', getTrending);
router.get('/pincode/:pincode', checkPincode);
router.get('/related/:id', getRelated);
router.get('/:slug', getProductBySlug);

// Admin-only management routes
router.post('/', protect, adminOnly, upload.array('images', 8), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 8), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.patch('/:id/stock', protect, adminOnly, updateStock);

module.exports = router;
