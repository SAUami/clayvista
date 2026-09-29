const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCustomers,
  getInventory
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/dashboard-stats', getDashboardStats);
router.get('/customers', getCustomers);
router.get('/inventory', getInventory);

module.exports = router;
