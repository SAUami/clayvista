const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');

// Get all products with rich filtering, search, sorting and pagination
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      material,
      color,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = { isActive: true };

    // Search keyword
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { shortDescription: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
    }

    // Category filter (slug or id)
    if (category && category !== 'all') {
      const catDoc = await Category.findOne({
        $or: [{ slug: category.toLowerCase() }, { name: new RegExp('^' + category + '$', 'i') }]
      });
      if (catDoc) {
        query.category = catDoc._id;
      }
    }

    // Material filter
    if (material && material !== 'all') {
      const materials = material.split(',').map((m) => m.trim());
      query.material = { $in: materials.map((m) => new RegExp('^' + m + '$', 'i')) };
    }

    // Color filter
    if (color && color !== 'all') {
      const colors = color.split(',').map((c) => c.trim());
      query.color = { $in: colors.map((c) => new RegExp(c, 'i')) };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    // In Stock filter
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'best-selling') {
      sortOption = { isBestSeller: -1, viewCount: -1 };
    } else if (sort === 'highest-rated') {
      sortOption = { 'ratings.average': -1, 'ratings.count': -1 };
    } else if (sort === 'latest') {
      sortOption = { createdAt: -1 };
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const itemsPerPage = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(itemsPerPage);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / itemsPerPage),
      currentPage,
      products
    });
  } catch (error) {
    next(error);
  }
};

// Get single product by slug or id
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    let product = await Product.findOne({ slug: slug.toLowerCase() }).populate('category', 'name slug');

    // If not found by slug, try searching by MongoDB ObjectId
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// Get Featured Products
exports.getFeatured = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(8);

    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Get Best Sellers
exports.getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestSeller: true, isActive: true })
      .populate('category', 'name slug')
      .limit(8);

    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Get Trending Products
exports.getTrending = async (req, res, next) => {
  try {
    const products = await Product.find({ isTrending: true, isActive: true })
      .populate('category', 'name slug')
      .limit(8);

    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Get Related Products
exports.getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: currentProduct._id },
      category: currentProduct.category,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(4);

    res.status(200).json({ success: true, products: related });
  } catch (error) {
    next(error);
  }
};

// Check Pincode Delivery
exports.checkPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      return res.status(400).json({
        success: false,
        serviceable: false,
        message: 'Please enter a valid 6-digit postal pincode.'
      });
    }

    // Realistic delivery estimation logic
    const firstDigit = pincode[0];
    let deliveryDays = 3;
    let hub = 'Northern Fulfillment Hub';

    if (['1', '2'].includes(firstDigit)) {
      deliveryDays = 2;
      hub = 'Delhi NCR Master Pottery Hub';
    } else if (['3', '4'].includes(firstDigit)) {
      deliveryDays = 3;
      hub = 'Western Region Logistics Hub';
    } else if (['5', '6'].includes(firstDigit)) {
      deliveryDays = 4;
      hub = 'Southern Express Hub';
    } else {
      deliveryDays = 4;
      hub = 'Eastern Distribution Hub';
    }

    const estDate = new Date();
    estDate.setDate(estDate.getDate() + deliveryDays);

    res.status(200).json({
      success: true,
      serviceable: true,
      pincode,
      estimatedDeliveryDays: deliveryDays,
      estimatedDeliveryDate: estDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      courierPartner: 'BlueDart Fragile Express',
      freeDeliveryEligible: true,
      codAvailable: true,
      message: `Delivering to ${pincode} by ${estDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}. Insured ceramic packaging.`
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create Product
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    // Auto generate slug if not provided
    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Auto generate SKU if not provided
    if (!productData.sku) {
      productData.sku = 'CV-' + Math.floor(1000 + Math.random() * 9000);
    }

    // Parse specifications if stringified
    if (typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {}
    }

    // Parse dimensions if stringified
    if (typeof productData.dimensions === 'string') {
      try {
        productData.dimensions = JSON.parse(productData.dimensions);
      } catch (e) {}
    }

    // Handle image file uploads if present
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map((file) => `/uploads/${file.filename}`);
      productData.images = productData.images ? [...productData.images, ...uploadedUrls] : uploadedUrls;
    } else if (typeof productData.images === 'string') {
      productData.images = productData.images.split(',').map((img) => img.trim());
    }

    const product = await Product.create(productData);

    // Write initial inventory record
    await Inventory.create({
      product: product._id,
      changeType: 'initial',
      quantityDelta: product.stock,
      previousStock: 0,
      newStock: product.stock,
      notes: 'Initial product stock created.'
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update Product
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateData = { ...req.body };

    if (typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (e) {}
    }

    if (typeof updateData.dimensions === 'string') {
      try {
        updateData.dimensions = JSON.parse(updateData.dimensions);
      } catch (e) {}
    }

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map((file) => `/uploads/${file.filename}`);
      updateData.images = product.images.concat(uploadedUrls);
    } else if (typeof updateData.images === 'string') {
      updateData.images = updateData.images.split(',').map((img) => img.trim());
    }

    // Check stock modification
    if (updateData.stock !== undefined && updateData.stock !== product.stock) {
      const delta = Number(updateData.stock) - product.stock;
      await Inventory.create({
        product: product._id,
        changeType: 'adjustment',
        quantityDelta: delta,
        previousStock: product.stock,
        newStock: Number(updateData.stock),
        notes: 'Stock updated manually by administrator.'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Product
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete or hard delete
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Quick update stock
exports.updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previous = product.stock;
    product.stock = Number(stock);
    await product.save();

    await Inventory.create({
      product: product._id,
      changeType: 'adjustment',
      quantityDelta: Number(stock) - previous,
      previousStock: previous,
      newStock: product.stock,
      notes: 'Quick stock adjustment.'
    });

    res.status(200).json({
      success: true,
      message: `Stock updated to ${product.stock} units.`,
      product
    });
  } catch (error) {
    next(error);
  }
};
