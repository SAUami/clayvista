const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'cod'],
      required: true
    },
    transactionId: {
      type: String,
      default: ''
    },
    gatewayOrderId: {
      type: String,
      default: ''
    },
    gatewaySignature: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['initiated', 'successful', 'failed', 'refunded'],
      default: 'initiated'
    },
    receiptUrl: String,
    metadata: Object
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
