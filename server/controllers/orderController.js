const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Inventory = require('../models/Inventory');
const { sendOrderConfirmation, sendEmail } = require('../utils/sendEmail');
const { generatePDFInvoice } = require('../utils/invoiceGenerator');

// Place / Create Order
exports.createOrder = async (req, res, next) => {
  try {
    const {
      customerDetails,
      orderItems,
      couponCode,
      paymentMethod = 'cod'
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart has no items to checkout.' });
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.shippingAddress) {
      return res.status(400).json({ success: false, message: 'Please provide complete customer and delivery address details.' });
    }

    // Verify each product and calculate prices accurately from the DB (never trust frontend prices blindly)
    let subtotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product || item.id || item._id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product "${item.name || 'Unknown'}" is no longer available.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`
        });
      }

      const activePrice = (product.discountPrice && product.discountPrice < product.price) ? product.discountPrice : product.price;
      const itemTotal = activePrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '/assets/images/placeholder.jpg',
        price: activePrice,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Process Coupon if provided
    let discountAmount = 0;
    let couponApplied = null;

    if (couponCode && couponCode.trim() !== '') {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() }
      });

      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }

        couponApplied = {
          code: coupon.code,
          discount: discountAmount
        };

        // Increment coupon usage
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    // GST & Shipping calculations
    // Free shipping threshold ₹1999 (or configured in .env)
    const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || 1999;
    const shippingFee = (subtotal >= freeShippingThreshold) ? 0 : (Number(process.env.STANDARD_SHIPPING_FEE) || 150);

    // 18% GST calculation (embedded in or added per Indian Crockery & Chinaware HSN 6911/6912 tax rules)
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxGst = Math.round(taxableAmount * 0.18);
    const grandTotal = taxableAmount + taxGst + shippingFee;

    // Generate unique order number (e.g. CV-2026-8941)
    const orderNumber = `CV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderNumber,
      user: req.user ? req.user._id : null,
      customerDetails,
      orderItems: validatedItems,
      subtotal,
      taxGst,
      shippingFee,
      discountAmount,
      couponApplied,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'placed',
      invoiceNumber: `INV-${orderNumber}`,
      trackingHistory: [
        {
          status: 'placed',
          timestamp: new Date(),
          note: 'Order successfully placed. Awaiting artisan packaging.',
          location: 'ClayVista Fulfillment Hub, Delhi NCR'
        }
      ]
    };

    const order = await Order.create(orderData);

    // AUTOMATION: Reduce inventory stock & check low stock
    for (const item of validatedItems) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.stock;
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();

        // Log to inventory table
        await Inventory.create({
          product: product._id,
          changeType: 'purchase',
          quantityDelta: -item.quantity,
          previousStock,
          newStock: product.stock,
          orderNumber: order.orderNumber,
          notes: `Purchased in order ${order.orderNumber}`
        });

        // Automation: Alert admin if stock falls below threshold
        if (product.stock <= product.lowStockThreshold) {
          sendEmail({
            to: process.env.STORE_EMAIL || 'admin@clayvista.com',
            subject: `[Low Stock Alert] ${product.name} is running low!`,
            text: `Product "${product.name}" (SKU: ${product.sku}) now has only ${product.stock} units remaining.`
          }).catch(() => {});
        }
      }
    }

    // AUTOMATION: Asynchronously send customer order confirmation email with breakdown
    sendOrderConfirmation(order).catch((err) => {
      console.warn('Order confirmation email warning:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
};

// Get User's Orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// Get Single Order By ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('orderItems.product', 'name images slug');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: non-admin can only view their own order
    if (req.user && req.user.role !== 'admin' && order.user && order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order.' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// Track Order by Order Number and Phone/Email
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderNumber, contact } = req.query;

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'Please provide an Order Number.' });
    }

    const query = { orderNumber: orderNumber.trim() };

    // If contact (email or phone) is provided, verify it
    if (contact && contact.trim() !== '') {
      const cleanContact = contact.trim().toLowerCase();
      query.$or = [
        { 'customerDetails.email': cleanContact },
        { 'customerDetails.phone': cleanContact }
      ];
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No order found matching the provided order number and contact information.'
      });
    }

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        grandTotal: order.grandTotal,
        customerDetails: {
          name: order.customerDetails.name,
          city: order.customerDetails.shippingAddress.city,
          state: order.customerDetails.shippingAddress.state,
          pincode: order.customerDetails.shippingAddress.pincode
        },
        orderItems: order.orderItems,
        courier: order.courier,
        trackingHistory: order.trackingHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Order
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (req.user.role !== 'admin' && order.user && order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order.' });
    }

    if (order.orderStatus !== 'placed') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already "${order.orderStatus}". Please contact support.`
      });
    }

    order.orderStatus = 'cancelled';
    order.trackingHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Order cancelled by customer.',
      location: 'ClayVista System'
    });

    await order.save();

    // Restock items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    res.status(200).json({ success: true, message: 'Order has been cancelled.', order });
  } catch (error) {
    next(error);
  }
};

// Download Invoice as PDF
exports.downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: id }, { orderNumber: id }] };
    } else {
      query = { orderNumber: id };
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for invoice.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ClayVista-Invoice-${order.orderNumber}.pdf`);

    generatePDFInvoice(
      order,
      (chunk) => res.write(chunk),
      () => res.end()
    );
  } catch (error) {
    next(error);
  }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: 'i' } },
        { 'customerDetails.name': { $regex: search.trim(), $options: 'i' } },
        { 'customerDetails.email': { $regex: search.trim(), $options: 'i' } },
        { 'customerDetails.phone': { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);
    const skip = (currentPage - 1) * itemsPerPage;

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(itemsPerPage);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / itemsPerPage),
      currentPage,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update Order Status & Courier Info
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, courierName, trackingNumber, trackingUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (status) {
      order.orderStatus = status;
      if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
        if (order.paymentMethod === 'cod') {
          order.paymentStatus = 'completed';
          order.isPaid = true;
          order.paidAt = new Date();
        }
      }
    }

    if (courierName) order.courier.name = courierName;
    if (trackingNumber) order.courier.trackingNumber = trackingNumber;
    if (trackingUrl) order.courier.trackingUrl = trackingUrl;

    order.trackingHistory.push({
      status: status || order.orderStatus,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}.`,
      location: 'ClayVista Logistics Hub'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${order.orderStatus}.`,
      order
    });
  } catch (error) {
    next(error);
  }
};
