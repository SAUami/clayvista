const Coupon = require('../models/Coupon');

// Validate coupon for checkout
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    if (cartTotal && cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Coupon requires a minimum cart total of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}.`
      });
    }

    let discount = 0;
    if (cartTotal) {
      if (coupon.discountType === 'percentage') {
        discount = Math.round((cartTotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      } else {
        discount = coupon.discountValue;
      }
    }

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" is valid!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountCalculated: discount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all coupons
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    next(error);
  }
};

// Admin: Create Coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit } = req.body;

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description: description || '',
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 2000,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      usageLimit: Number(usageLimit) || 1000
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully.',
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    res.status(200).json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
