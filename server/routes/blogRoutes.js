const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  deleteBlog
} = require('../controllers/blogController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', protect, adminOnly, createBlog);
router.delete('/:id', protect, adminOnly, deleteBlog);

module.exports = router;
