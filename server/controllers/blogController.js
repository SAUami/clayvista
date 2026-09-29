const Blog = require('../models/Blog');

// Get all blogs
exports.getBlogs = async (req, res, next) => {
  try {
    const { category, tag } = req.query;
    const query = { isPublished: true };

    if (category) query.category = new RegExp(category, 'i');
    if (tag) query.tags = { $in: [new RegExp(tag, 'i')] };

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    next(error);
  }
};

// Get single blog
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let blog = await Blog.findOne({ slug: slug.toLowerCase() });

    if (!blog && slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slug);
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    res.status(200).json({ success: true, blog });
  } catch (error) {
    next(error);
  }
};

// Admin: Create Blog
exports.createBlog = async (req, res, next) => {
  try {
    const { title, excerpt, content, coverImage, author, category, tags, readTime } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author: author || 'ClayVista Master Potter',
      category: category || 'Ceramic Care & Table Styling',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      readTime: readTime || '4 min read'
    });

    res.status(201).json({ success: true, message: 'Article published successfully.', blog });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Blog
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    res.status(200).json({ success: true, message: 'Article deleted.' });
  } catch (error) {
    next(error);
  }
};
