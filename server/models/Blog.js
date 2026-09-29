const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    excerpt: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
      required: true
    },
    author: {
      type: String,
      default: 'ClayVista Master Potter'
    },
    category: {
      type: String,
      default: 'Ceramic Care & Table Styling'
    },
    tags: [String],
    readTime: {
      type: String,
      default: '4 min read'
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
