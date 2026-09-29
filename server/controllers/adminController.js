const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

// Dashboard Overview Metrics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Calculate Total Revenue
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Low stock products count
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // Recent 5 orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderNumber customerDetails.name grandTotal orderStatus paymentMethod paymentStatus createdAt');

    // Monthly Sales Chart Data (Last 6 months)
    const monthlySales = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // Format months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedChartData = monthlySales.map((m) => ({
      month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      sales: m.totalSales,
      orders: m.count
    }));

    // Status breakdown for orders
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        lowStockCount,
        recentOrders,
        chartData: formattedChartData,
        statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Customer Listing
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: customers.length, customers });
  } catch (error) {
    next(error);
  }
};

// Inventory Stock & Alerts
exports.getInventory = async (req, res, next) => {
  try {
    const products = await Product.find()
      .select('name sku stock lowStockThreshold price category images')
      .populate('category', 'name')
      .sort({ stock: 1 });

    const recentLogs = await Inventory.find()
      .populate('product', 'name sku')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      products,
      recentLogs
    });
  } catch (error) {
    next(error);
  }
};
