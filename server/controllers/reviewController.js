const Review = require('../models/Review');
const Product = require('../models/Product');

// Get all reviews for a product
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId, isApproved: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// Add a review
exports.addReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment, title, userName, userEmail } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and review comment are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const reviewerName = req.user ? req.user.name : userName || 'Ceramic Connoisseur';
    const reviewerEmail = req.user ? req.user.email : userEmail || '';

    const review = await Review.create({
      product: product._id,
      user: req.user ? req.user._id : null,
      userName: reviewerName,
      userEmail: reviewerEmail,
      rating: Number(rating),
      title: title || '',
      comment,
      isVerifiedPurchase: true,
      isApproved: true
    });

    // Recalculate average rating for product
    const allReviews = await Review.find({ product: product._id, isApproved: true });
    const totalRating = allReviews.reduce((acc, r) => acc + r.rating, 0);
    product.ratings.average = Number((totalRating / allReviews.length).toFixed(1));
    product.ratings.count = allReviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      review,
      newRatings: product.ratings
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Moderate or Delete Review
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate ratings
    const remaining = await Review.find({ product: productId, isApproved: true });
    const product = await Product.findById(productId);
    if (product) {
      if (remaining.length > 0) {
        const total = remaining.reduce((acc, r) => acc + r.rating, 0);
        product.ratings.average = Number((total / remaining.length).toFixed(1));
        product.ratings.count = remaining.length;
      } else {
        product.ratings.average = 5.0;
        product.ratings.count = 0;
      }
      await product.save();
    }

    res.status(200).json({ success: true, message: 'Review removed successfully.' });
  } catch (error) {
    next(error);
  }
};
