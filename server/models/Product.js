const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    shortDescription: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    categorySlug: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0
    },
    discountPrice: {
      type: Number,
      default: null,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      default: 10,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    material: {
      type: String,
      enum: ['Porcelain', 'Bone China', 'Stoneware', 'Terracotta', 'Ceramic', 'Earthenware'],
      default: 'Stoneware'
    },
    color: {
      type: String,
      default: 'Ivory White'
    },
    finish: {
      type: String,
      default: 'Matte Glaze'
    },
    size: {
      type: String,
      default: 'Standard'
    },
    dimensions: {
      height: { type: String, default: '8 cm' },
      diameter: { type: String, default: '15 cm' },
      capacity: { type: String, default: '350 ml' },
      weight: { type: String, default: '450g' }
    },
    weight: {
      type: String,
      default: '450g'
    },
    images: {
      type: [String],
      validate: [v => v.length > 0, 'At least one product image is required']
    },
    images360: {
      type: [String],
      default: []
    },
    is360Available: {
      type: Boolean,
      default: true
    },
    ratings: {
      average: { type: Number, default: 4.8, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    specifications: {
      microwaveSafe: { type: Boolean, default: true },
      dishwasherSafe: { type: Boolean, default: true },
      foodSafe: { type: Boolean, default: true },
      leadCadmiumFree: { type: Boolean, default: true },
      thermalShockResistant: { type: Boolean, default: true },
      origin: { type: String, default: 'Handcrafted in Khurja Studio, India' },
      firingTemperature: { type: String, default: '1280°C High Fired' },
      craftMethod: { type: String, default: 'Hand-thrown on potter wheel, dual-dip glazed' }
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isTrending: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: true
    },
    tags: [String],
    viewCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text', material: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
