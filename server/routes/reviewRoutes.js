const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  addReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', optionalAuth, addReview);
router.delete('/:id', protect, adminOnly, deleteReview);

module.exports = router;
