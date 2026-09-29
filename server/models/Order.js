const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true }
});

const trackingHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['placed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'ClayVista Fulfillment Hub'
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    customerDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      shippingAddress: {
        street: { type: String, required: true },
        apartment: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' }
      },
      billingAddress: {
        street: String,
        apartment: String,
        city: String,
        state: String,
        pincode: String,
        country: String
      }
    },
    orderItems: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxGst: {
      type: Number,
      required: true,
      default: 0
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    couponApplied: {
      code: String,
      discount: Number
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'stripe'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed'
    },
    trackingHistory: [trackingHistorySchema],
    courier: {
      name: { type: String, default: 'BlueDart Luxury Express' },
      trackingNumber: { type: String, default: '' },
      trackingUrl: { type: String, default: '' }
    },
    invoiceNumber: {
      type: String,
      default: ''
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
