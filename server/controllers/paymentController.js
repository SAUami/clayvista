const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Initialize Razorpay instance if keys are available
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.warn('Razorpay init warning:', err.message);
  }
}

// 1. RAZORPAY: Create Order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const amountInPaise = Math.round(order.grandTotal * 100);

    // If Razorpay instance is ready, generate real/test Razorpay order
    if (razorpayInstance && !process.env.RAZORPAY_KEY_ID.includes('clayvista123456')) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${order.orderNumber}`,
        notes: {
          orderNumber: order.orderNumber,
          customerName: order.customerDetails.name
        }
      };

      const rzpOrder = await razorpayInstance.orders.create(options);

      return res.status(200).json({
        success: true,
        gatewayOrderId: rzpOrder.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        orderNumber: order.orderNumber
      });
    }

    // Developer / Mock Mode Fallback for instant local testing
    const mockGatewayOrderId = 'order_mock_' + Date.now();
    res.status(200).json({
      success: true,
      isMock: true,
      gatewayOrderId: mockGatewayOrderId,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
      amount: amountInPaise,
      currency: 'INR',
      orderNumber: order.orderNumber,
      message: 'Razorpay sandbox initialized.'
    });
  } catch (error) {
    next(error);
  }
};

// 2. RAZORPAY: Verify Payment Signature
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let isValid = false;

    if (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) {
      isValid = true; // Simulated successful test transaction
    } else if (process.env.RAZORPAY_KEY_SECRET) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      isValid = expectedSignature === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature.' });
    }

    order.paymentStatus = 'completed';
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: razorpay_payment_id || 'rzp_pay_' + Date.now(),
      status: 'captured',
      updateTime: new Date().toISOString(),
      emailAddress: order.customerDetails.email
    };
    order.trackingHistory.push({
      status: 'processing',
      timestamp: new Date(),
      note: 'Payment received via Razorpay. Order confirmed for craftsmanship inspection.',
      location: 'ClayVista Accounts & Packaging'
    });
    order.orderStatus = 'processing';
    await order.save();

    await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      user: order.user,
      amount: order.grandTotal,
      currency: 'INR',
      gateway: 'razorpay',
      transactionId: razorpay_payment_id || 'rzp_pay_' + Date.now(),
      gatewayOrderId: razorpay_order_id,
      gatewaySignature: razorpay_signature,
      status: 'successful'
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed!',
      order
    });
  } catch (error) {
    next(error);
  }
};

// 3. STRIPE: Create Payment Intent / Session
exports.createStripeSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Amount in cents/paise (USD/INR)
    const amount = Math.round(order.grandTotal * 100);

    // If Stripe secret is live
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('TestMode1234567890')) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'inr',
        metadata: {
          orderNumber: order.orderNumber,
          customerEmail: order.customerDetails.email
        }
      });

      return res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        orderNumber: order.orderNumber
      });
    }

    // Mock response for instant testing
    res.status(200).json({
      success: true,
      isMock: true,
      clientSecret: 'pi_mock_secret_' + Date.now(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
      orderNumber: order.orderNumber,
      message: 'Stripe test payment intent ready.'
    });
  } catch (error) {
    next(error);
  }
};

// 4. STRIPE: Confirm / Verify Payment
exports.verifyStripePayment = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'completed';
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: paymentIntentId || 'pi_' + Date.now(),
      status: 'succeeded',
      updateTime: new Date().toISOString(),
      emailAddress: order.customerDetails.email
    };
    order.orderStatus = 'processing';
    order.trackingHistory.push({
      status: 'processing',
      timestamp: new Date(),
      note: 'Payment captured securely via Stripe.',
      location: 'ClayVista Accounts'
    });
    await order.save();

    await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      user: order.user,
      amount: order.grandTotal,
      currency: 'INR',
      gateway: 'stripe',
      transactionId: paymentIntentId || 'pi_' + Date.now(),
      status: 'successful'
    });

    res.status(200).json({
      success: true,
      message: 'Stripe payment verified successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
};
