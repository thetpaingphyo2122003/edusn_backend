// src/controllers/blogController.js
const blogRepository = require('../repositories/blogRepository');
const { uploadImage, deleteImage } = require('../services/uploadService');

/**
 * @desc    Get all blogs (with pagination, filter, search) - PUBLIC (published only)
 * @route   GET /api/blogs
 * @access  Public
 */
const getAllBlogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        let blogs;
        let total;
        
        if (req.query.search) {
            blogs = await blogRepository.search(req.query.search);
            total = blogs.length;
        } 
        else if (req.query.category) {
            blogs = await blogRepository.findByCategory(req.query.category, limit);
            total = await blogRepository.count({ category: req.query.category, status: 'published' });
        }
        else if (req.query.tag) {
            blogs = await blogRepository.findByTag(req.query.tag);
            total = blogs.length;
        }
        else if (req.query.author) {
            blogs = await blogRepository.findByAuthor(req.query.author);
            total = blogs.length;
        }
        else {
            const result = await blogRepository.findPublished(page, limit);
            blogs = result;
            total = await blogRepository.count({ status: 'published' });
        }
        
        res.json({
            success: true,
            data: blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL blogs for admin (including draft and archived)
 * @route   GET /api/blogs/admin/all
 * @access  Private (Admin)
 */
const getAllBlogsAdmin = async (req, res, next) => {
    try {
        const { status, category, search } = req.query;
        let filter = {};
        
        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;
        
        let blogs;
        
        if (search) {
            blogs = await blogRepository.model.find({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ],
                ...filter
            }).sort({ createdAt: -1 });
        } else {
            blogs = await blogRepository.findAllForAdmin(filter);
        }
        
        res.json({
            success: true,
            count: blogs.length,
            data: blogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single blog by slug - PUBLIC
 * @route   GET /api/blogs/slug/:slug
 * @access  Public
 */
const getBlogBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        
        const blog = await blogRepository.findBySlug(slug);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Only show published blogs to public
        if (blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Increment view count
        await blogRepository.incrementViewCount(blog._id);
        
        res.json({
            success: true,
            data: blog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single blog by ID (for admin)
 * @route   GET /api/blogs/id/:id
 * @access  Private (Admin)
 */
const getBlogById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        res.json({
            success: true,
            data: blog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new blog
 * @route   POST /api/blogs
 * @access  Private (Admin/Editor)
 */
const createBlog = async (req, res, next) => {
    try {
        const { title, content, excerpt, category, tags, status, seo } = req.body;

        let featuredImage = null;

        if (req.file) {
            const uploaded = await uploadImage(req.file, 'blogs');
            featuredImage = uploaded.url;
        }

        let processedTags = [];
        if (tags) {
            if (Array.isArray(tags)) {
                processedTags = tags;
            } else if (typeof tags === 'string') {
                processedTags = tags.split(',').map(tag => tag.trim());
            }
        }

        const blog = await blogRepository.create({
            title,
            content,
            excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200),
            category: category || 'general',
            tags: processedTags,
            status: status || 'draft',
            featured_image: featuredImage,
            published_date: status === 'published' ? new Date() : null,
            seo: seo || {},
            author: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: blog
        });
    } catch (error) {
        console.error('Create blog error:', error);
        next(error);
    }
};

/**
 * @desc    Update blog
 * @route   PUT /api/blogs/:id
 * @access  Private (Admin/Editor)
 */
const updateBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this blog'
            });
        }
        
        const { title, content, excerpt, category, tags, status, seo } = req.body;
        
        let featuredImage = blog.featured_image;
        if (req.file) {
            if (blog.featured_image) {
                try {
                    const publicId = blog.featured_image.split('/').pop().split('.')[0];
                    await deleteImage(`blogs/${publicId}`);
                } catch (err) {
                    console.error('Error deleting old image:', err);
                }
            }
            const uploaded = await uploadImage(req.file, 'blogs');
            featuredImage = uploaded.url;
        }
        
        let processedTags = blog.tags;
        if (tags) {
            if (Array.isArray(tags)) {
                processedTags = tags;
            } else if (typeof tags === 'string') {
                processedTags = tags.split(',').map(tag => tag.trim());
            }
        }
        
        const updateData = {
            title: title || blog.title,
            content: content || blog.content,
            excerpt: excerpt || blog.excerpt,
            category: category || blog.category,
            tags: processedTags,
            seo: seo || blog.seo,
            featured_image: featuredImage
        };
        
        // Handle status change
        if (status && status !== blog.status) {
            updateData.status = status;
            if (status === 'published' && blog.status !== 'published') {
                updateData.published_date = new Date();
            } else if (status !== 'published') {
                updateData.published_date = null;
            }
        }
        
        const updatedBlog = await blogRepository.updateById(id, updateData);
        
        res.json({
            success: true,
            message: 'Blog updated successfully',
            data: updatedBlog
        });
    } catch (error) {
        console.error('Update blog error:', error);
        next(error);
    }
};

/**
 * @desc    Publish a blog (separate endpoint)
 * @route   PUT /api/blogs/:id/publish
 * @access  Private (Admin/Editor)
 */
const publishBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to publish this blog'
            });
        }
        
        const publishedBlog = await blogRepository.publish(id);
        
        res.json({
            success: true,
            message: 'Blog published successfully',
            data: publishedBlog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Unpublish a blog (set to draft)
 * @route   PUT /api/blogs/:id/unpublish
 * @access  Private (Admin/Editor)
 */
const unpublishBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to unpublish this blog'
            });
        }
        
        const unpublishedBlog = await blogRepository.unpublish(id);
        
        res.json({
            success: true,
            message: 'Blog unpublished successfully',
            data: unpublishedBlog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete blog
 * @route   DELETE /api/blogs/:id
 * @access  Private (Admin/Editor)
 */
const deleteBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this blog'
            });
        }
        
        if (blog.featured_image) {
            try {
                const publicId = blog.featured_image.split('/').pop().split('.')[0];
                await deleteImage(`blogs/${publicId}`);
            } catch (err) {
                console.error('Error deleting image:', err);
            }
        }
        
        await blogRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get recent blogs
 * @route   GET /api/blogs/recent
 * @access  Public
 */
const getRecentBlogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blogRepository.findRecent(limit);
        
        res.json({
            success: true,
            data: blogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get popular blogs (most viewed)
 * @route   GET /api/blogs/popular
 * @access  Public
 */
const getPopularBlogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blogRepository.findPopular(limit);
        
        res.json({
            success: true,
            data: blogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get blogs by year
 * @route   GET /api/blogs/year/:year
 * @access  Public
 */
const getBlogsByYear = async (req, res, next) => {
    try {
        const { year } = req.params;
        const blogs = await blogRepository.findByYear(parseInt(year));
        
        res.json({
            success: true,
            data: blogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add comment to blog
 * @route   POST /api/blogs/:id/comments
 * @access  Public
 */
const addComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, content } = req.body;
        
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        const comment = {
            user_name: name,
            user_email: email,
            content: content,
            status: 'pending'
        };
        
        blog.comments.push(comment);
        await blog.save();
        
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get related blogs
 * @route   GET /api/blogs/:id/related
 * @access  Public
 */
const getRelatedBlogs = async (req, res, next) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 3;
        
        const blog = await blogRepository.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        const relatedBlogs = await blogRepository.findRelated(id, blog.tags, limit);
        
        res.json({
            success: true,
            data: relatedBlogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get blog statistics for dashboard
 * @route   GET /api/blogs/stats
 * @access  Private (Admin)
 */
const getBlogStats = async (req, res, next) => {
    try {
        const total = await blogRepository.count();
        const published = await blogRepository.count({ status: 'published' });
        const draft = await blogRepository.count({ status: 'draft' });
        const archived = await blogRepository.count({ status: 'archived' });
        const totalViews = await blogRepository.model.aggregate([
            { $group: { _id: null, total: { $sum: '$view_count' } } }
        ]);
        
        res.json({
            success: true,
            data: {
                total,
                published,
                draft,
                archived,
                totalViews: totalViews[0]?.total || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBlogs,
    getAllBlogsAdmin,
    getBlogBySlug,
    getBlogById,
    createBlog,
    updateBlog,
    publishBlog,
    unpublishBlog,
    deleteBlog,
    getRecentBlogs,
    getPopularBlogs,
    getBlogsByYear,
    addComment,
    getRelatedBlogs,
    getBlogStats
};