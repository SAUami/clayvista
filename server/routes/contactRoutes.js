const express = require('express');
const router = express.Router();
const {
  submitContact,
  subscribeNewsletter,
  getInquiries,
  getSubscribers
} = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', submitContact);
router.post('/newsletter', subscribeNewsletter);
router.get('/inquiries', protect, adminOnly, getInquiries);
router.get('/subscribers', protect, adminOnly, getSubscribers);

module.exports = router;
