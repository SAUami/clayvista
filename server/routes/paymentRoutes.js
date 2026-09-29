const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeSession,
  verifyStripePayment
} = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.use(optionalAuth);

// Razorpay
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

// Stripe
router.post('/stripe/create-session', createStripeSession);
router.post('/stripe/verify', verifyStripePayment);

module.exports = router;
