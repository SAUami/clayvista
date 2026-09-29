const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
  downloadInvoice,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');

// Public tracking and invoice
router.get('/track', trackOrder);
router.get('/:id/invoice', downloadInvoice);

// Order placement (supports both authenticated and guest checkout)
router.post('/', optionalAuth, createOrder);

// Authenticated user orders
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', optionalAuth, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

// Admin Order Management
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
