const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Get cart helper
const findOrCreateCart = async (userId, sessionId) => {
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug images price discountPrice stock');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId }).populate('items.product', 'name slug images price discountPrice stock');
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }
  }
  return cart;
};

// Get Cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'guest-session';

    const cart = await findOrCreateCart(userId, sessionId);

    // Calculate totals
    let subtotal = 0;
    const validItems = [];

    if (cart && cart.items) {
      for (const item of cart.items) {
        if (item.product) {
          const effectivePrice = item.product.discountPrice && item.product.discountPrice < item.product.price
            ? item.product.discountPrice
            : item.product.price;
          subtotal += effectivePrice * item.quantity;
          validItems.push({
            id: item.product._id,
            productId: item.product._id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.images[0] || '',
            price: effectivePrice,
            originalPrice: item.product.price,
            stock: item.product.stock,
            quantity: item.quantity,
            total: effectivePrice * item.quantity
          });
        }
      }
    }

    const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || 1999;
    const shippingFee = (subtotal >= freeShippingThreshold || subtotal === 0) ? 0 : (Number(process.env.STANDARD_SHIPPING_FEE) || 150);
    const taxGst = Math.round(Math.max(0, subtotal - (cart?.discount || 0)) * 0.18);
    const grandTotal = Math.max(0, subtotal - (cart?.discount || 0)) + taxGst + shippingFee;

    res.status(200).json({
      success: true,
      cart: {
        items: validItems,
        totalItems: validItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        discount: cart?.discount || 0,
        couponCode: cart?.couponCode || null,
        taxGst,
        shippingFee,
        grandTotal,
        freeShippingRemaining: Math.max(0, freeShippingThreshold - subtotal)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add to Cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'guest-session';

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items available in stock.` });
    }

    let cart = await Cart.findOne(userId ? { user: userId } : { sessionId });
    if (!cart) {
      cart = new Cart(userId ? { user: userId, items: [] } : { sessionId, items: [] });
    }

    const activePrice = (product.discountPrice && product.discountPrice < product.price) ? product.discountPrice : product.price;

    const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Cannot exceed available stock of ${product.stock}.` });
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = activePrice;
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        price: activePrice
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: `Added "${product.name}" to cart.`,
      cartTotalCount: cart.items.reduce((acc, i) => acc + i.quantity, 0)
    });
  } catch (error) {
    next(error);
  }
};

// Update Quantity
exports.updateQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || 'guest-session';

    if (quantity <= 0) {
      return exports.removeFromCart(req, res, next);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Stock limit reached (${product.stock} available).` });
    }

    const cart = await Cart.findOne(userId ? { user: userId } : { sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (item) {
      item.quantity = Number(quantity);
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Cart updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Remove from Cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || 'guest-session';

    const cart = await Cart.findOne(userId ? { user: userId } : { sessionId });
    if (cart) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    next(error);
  }
};

// Clear Cart
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || 'guest-session';

    const cart = await Cart.findOne(userId ? { user: userId } : { sessionId });
    if (cart) {
      cart.items = [];
      cart.couponCode = null;
      cart.discount = 0;
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    next(error);
  }
};

// Apply Coupon to Cart
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || 'guest-session';

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const cart = await Cart.findOne(userId ? { user: userId } : { sessionId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      if (item.product) {
        const price = item.product.discountPrice || item.product.price;
        subtotal += price * item.quantity;
      }
    });

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum cart value of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}.`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    cart.couponCode = coupon.code;
    cart.discount = discount;
    await cart.save();

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You save ₹${discount.toLocaleString('en-IN')}.`,
      discount,
      couponCode: coupon.code
    });
  } catch (error) {
    next(error);
  }
};
