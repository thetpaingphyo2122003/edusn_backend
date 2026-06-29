// src/controllers/blogController.js
const blogRepository = require('../repositories/blogRepository');
const BlogSettings = require('../models/BlogSettings');
const { uploadImage, deleteImage } = require('../services/uploadService');
const NotificationService = require('../services/notificationService');

const parseJsonField = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const VALID_REACTIONS = ['like', 'love', 'celebrate'];

const normalizeReactions = (reactions) => ({
    like: reactions?.like || 0,
    love: reactions?.love || 0,
    celebrate: reactions?.celebrate || 0,
});

const getReactorKey = (req) => {
    const fromBody = req.body?.reactorKey || req.body?.userKey;
    const fromQuery = req.query?.reactorKey || req.query?.userKey;
    if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim();
    if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();
    return null;
};

const countApprovedComments = (comments = []) =>
    (comments || []).filter((comment) => comment.status === 'approved').length;

const sanitizeBlogForList = (blog) => {
    const obj = blog.toObject ? blog.toObject() : { ...blog };
    return {
        _id: obj._id,
        title: obj.title,
        slug: obj.slug,
        excerpt: obj.excerpt,
        featured_image: obj.featured_image,
        author: obj.author,
        category: obj.category,
        tags: obj.tags,
        published_date: obj.published_date,
        createdAt: obj.createdAt,
        view_count: obj.view_count || 0,
        like_count: obj.like_count || 0,
        comment_count: countApprovedComments(obj.comments),
        reactions: normalizeReactions(obj.reactions),
    };
};

const getUserReaction = (target, reactorKey) => {
    if (!reactorKey || !target) return null;

    if (Array.isArray(target.user_reactions)) {
        const entry = target.user_reactions.find((item) => item.user_key === reactorKey);
        if (entry?.reaction) return entry.reaction;
    }

    // Legacy data: reacted_users stored keys without reaction type
    if (Array.isArray(target.reacted_users) && target.reacted_users.includes(reactorKey)) {
        return 'like';
    }

    return null;
};

const getReactionState = (target, reactorKey) => {
    const activeReaction = getUserReaction(target, reactorKey);
    return {
        user_reacted: Boolean(activeReaction),
        active_reaction: activeReaction,
    };
};

const ensureReactionTarget = (target) => {
    if (!target.reactions) {
        target.reactions = { like: 0, love: 0, celebrate: 0 };
    }
    if (!Array.isArray(target.user_reactions)) {
        target.user_reactions = [];
    }
    if (!Array.isArray(target.reacted_users)) {
        target.reacted_users = [];
    }
    return target;
};

const syncLegacyReactedUsers = (target) => {
    target.reacted_users = (target.user_reactions || []).map((item) => item.user_key);
};

const toggleReactionOnTarget = (target, reactorKey, reaction) => {
    ensureReactionTarget(target);

    const existing = getUserReaction(target, reactorKey);

    if (!existing) {
        target.reactions[reaction] = (target.reactions[reaction] || 0) + 1;
        target.user_reactions.push({ user_key: reactorKey, reaction });
        syncLegacyReactedUsers(target);
        return { user_reacted: true, active_reaction: reaction };
    }

    if (existing === reaction) {
        target.reactions[reaction] = Math.max(0, (target.reactions[reaction] || 0) - 1);
        target.user_reactions = target.user_reactions.filter((item) => item.user_key !== reactorKey);
        syncLegacyReactedUsers(target);
        return { user_reacted: false, active_reaction: null };
    }

    target.reactions[existing] = Math.max(0, (target.reactions[existing] || 0) - 1);
    target.reactions[reaction] = (target.reactions[reaction] || 0) + 1;
    const entry = target.user_reactions.find((item) => item.user_key === reactorKey);
    if (entry) {
        entry.reaction = reaction;
    } else {
        target.user_reactions.push({ user_key: reactorKey, reaction });
    }
    syncLegacyReactedUsers(target);
    return { user_reacted: true, active_reaction: reaction };
};

const sanitizeBlogForPublic = (blog, reactorKey = null) => {
    const obj = blog.toObject ? blog.toObject() : { ...blog };
    obj.reactions = normalizeReactions(obj.reactions);
    const postReactionState = getReactionState(obj, reactorKey);
    obj.user_reacted = postReactionState.user_reacted;
    obj.active_reaction = postReactionState.active_reaction;
    obj.comments = (obj.comments || [])
        .filter((comment) => comment.status === 'approved')
        .map((comment) => {
            const commentReactionState = getReactionState(comment, reactorKey);
            return {
                ...comment,
                reactions: normalizeReactions(comment.reactions),
                user_reacted: commentReactionState.user_reacted,
                active_reaction: commentReactionState.active_reaction,
                replies: (comment.replies || [])
                    .filter((reply) => reply.status === 'approved')
                    .map((reply) => {
                        const replyReactionState = getReactionState(reply, reactorKey);
                        return {
                            ...reply,
                            reactions: normalizeReactions(reply.reactions),
                            user_reacted: replyReactionState.user_reacted,
                            active_reaction: replyReactionState.active_reaction,
                        };
                    }),
            };
        });
    return obj;
};

const getTotalReactions = (reactions) => {
    const normalized = normalizeReactions(reactions);
    return normalized.like + normalized.love + normalized.celebrate;
};

const canModifyBlog = (blog, user) => {
    if (['admin', 'super_admin'].includes(user.role)) return true;
    if (blog.created_by && blog.created_by.toString() === user._id.toString()) return true;
    return false;
};

const buildAuthor = (user, authorOverride) => {
    const parsed = parseJsonField(authorOverride, null);
    return {
        name: parsed?.name || user.name || 'EDUSN',
        avatar: parsed?.avatar || user.avatar || null,
        role: parsed?.role || user.role || 'Admin',
    };
};

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
            data: blogs.map((blog) => sanitizeBlogForList(blog)),
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
        const reactorKey = getReactorKey(req);
        
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
        
        // Return published blog without incrementing views (use POST /:id/view)
        res.json({
            success: true,
            data: sanitizeBlogForPublic(blog, reactorKey)
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
        const { title, content, excerpt, category, tags, status, seo, author, gallery_images } = req.body;

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
                processedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
            }
        }

        const parsedSeo = parseJsonField(seo, {});
        const parsedGallery = parseJsonField(gallery_images, []);

        const blog = await blogRepository.create({
            title,
            content,
            excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200),
            category: category || 'general',
            tags: processedTags,
            status: status || 'draft',
            featured_image: featuredImage,
            gallery_images: Array.isArray(parsedGallery) ? parsedGallery : [],
            published_date: status === 'published' ? new Date() : null,
            seo: parsedSeo || {},
            author: buildAuthor(req.user, author),
            created_by: req.user._id,
        });

        if (blog.status === 'published') {
            NotificationService.blogCreated(blog, req.user._id).catch((err) =>
                console.error('Blog notification error:', err)
            );
        }

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
        
        if (!canModifyBlog(blog, req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this blog'
            });
        }
        
        const { title, content, excerpt, category, tags, status, seo, author, gallery_images } = req.body;
        
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
        
        const parsedSeo = parseJsonField(seo, blog.seo || {});
        const parsedGallery = parseJsonField(gallery_images, null);
        const parsedAuthor = parseJsonField(author, null);

        const updateData = {
            title: title || blog.title,
            content: content || blog.content,
            excerpt: excerpt || blog.excerpt,
            category: category || blog.category,
            tags: processedTags,
            seo: parsedSeo || blog.seo,
            featured_image: featuredImage
        };

        if (parsedAuthor) {
            updateData.author = buildAuthor(req.user, parsedAuthor);
        }

        if (Array.isArray(parsedGallery)) {
            updateData.gallery_images = parsedGallery;
        }
        
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
        
        if (!canModifyBlog(blog, req.user)) {
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
        
        if (!canModifyBlog(blog, req.user)) {
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
        
        if (!canModifyBlog(blog, req.user)) {
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

        if (!name?.trim() || !email?.trim() || !content?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and comment are required',
            });
        }
        
        const blog = await blogRepository.findById(id);
        
        if (!blog || blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        const comment = {
            user_name: name.trim(),
            user_email: email.trim(),
            content: content.trim(),
            status: 'approved',
            reactions: { like: 0, love: 0, celebrate: 0 },
            reacted_users: [],
            replies: [],
        };
        
        blog.comments.push(comment);
        await blog.save();
        
        const savedComment = blog.comments[blog.comments.length - 1];
        const publicComment = {
            ...savedComment.toObject(),
            reactions: normalizeReactions(savedComment.reactions),
            replies: [],
        };
        
        res.status(201).json({
            success: true,
            message: 'Comment posted successfully',
            data: publicComment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    React to a blog post
 * @route   POST /api/blogs/:id/react
 * @access  Public
 */
const reactToBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reaction = 'like' } = req.body;
        const reactorKey = getReactorKey(req);

        if (!VALID_REACTIONS.includes(reaction)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reaction type',
            });
        }
        if (!reactorKey) {
            return res.status(400).json({
                success: false,
                message: 'Sign in is required to react',
            });
        }

        const blog = await blogRepository.findById(id);
        if (!blog || blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found',
            });
        }

        if (!blog.reactions) {
            blog.reactions = { like: 0, love: 0, celebrate: 0 };
        }

        const previousReaction = getUserReaction(blog, reactorKey);
        const reactionState = toggleReactionOnTarget(blog, reactorKey, reaction);

        if (reaction === 'like' && previousReaction !== 'like' && reactionState.active_reaction === 'like') {
            blog.like_count = (blog.like_count || 0) + 1;
        } else if (previousReaction === 'like' && reactionState.active_reaction !== 'like') {
            blog.like_count = Math.max(0, (blog.like_count || 0) - 1);
        }

        await blog.save();

        res.json({
            success: true,
            message: reactionState.user_reacted ? 'Reaction recorded' : 'Reaction removed',
            data: {
                reactions: normalizeReactions(blog.reactions),
                like_count: blog.like_count,
                user_reacted: reactionState.user_reacted,
                active_reaction: reactionState.active_reaction,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    React to a comment or reply
 * @route   POST /api/blogs/:id/comments/:commentId/react
 * @access  Public
 */
const reactToComment = async (req, res, next) => {
    try {
        const { id, commentId } = req.params;
        const { reaction = 'like', replyId } = req.body;
        const reactorKey = getReactorKey(req);

        if (!VALID_REACTIONS.includes(reaction)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reaction type',
            });
        }
        if (!reactorKey) {
            return res.status(400).json({
                success: false,
                message: 'Sign in is required to react',
            });
        }

        const blog = await blogRepository.findById(id);
        if (!blog || blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found',
            });
        }

        const comment = blog.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found',
            });
        }

        let target = comment;
        if (replyId) {
            target = comment.replies.id(replyId);
            if (!target) {
                return res.status(404).json({
                    success: false,
                    message: 'Reply not found',
                });
            }
        }

        const reactionState = toggleReactionOnTarget(target, reactorKey, reaction);
        await blog.save();

        res.json({
            success: true,
            message: reactionState.user_reacted ? 'Reaction recorded' : 'Reaction removed',
            data: {
                reactions: normalizeReactions(target.reactions),
                user_reacted: reactionState.user_reacted,
                active_reaction: reactionState.active_reaction,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reply to a blog comment
 * @route   POST /api/blogs/:id/comments/:commentId/replies
 * @access  Public
 */
const addCommentReply = async (req, res, next) => {
    try {
        const { id, commentId } = req.params;
        const { name, email, content } = req.body;

        if (!name?.trim() || !email?.trim() || !content?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and reply are required',
            });
        }

        const blog = await blogRepository.findById(id);
        if (!blog || blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found',
            });
        }

        const comment = blog.comments.id(commentId);
        if (!comment || comment.status !== 'approved') {
            return res.status(404).json({
                success: false,
                message: 'Comment not found',
            });
        }

        const reply = {
            user_name: name.trim(),
            user_email: email.trim(),
            content: content.trim(),
            status: 'approved',
            reactions: { like: 0, love: 0, celebrate: 0 },
            reacted_users: [],
        };

        comment.replies.push(reply);
        await blog.save();

        const savedReply = comment.replies[comment.replies.length - 1];
        const publicReply = {
            ...savedReply.toObject(),
            reactions: normalizeReactions(savedReply.reactions),
        };

        res.status(201).json({
            success: true,
            message: 'Reply posted successfully',
            data: publicReply,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Record a blog view (once per browser session on the client)
 * @route   POST /api/blogs/:id/view
 * @access  Public
 */
const recordBlogView = async (req, res, next) => {
    try {
        const { id } = req.params;

        const blog = await blogRepository.findById(id);
        if (!blog || blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found',
            });
        }

        await blogRepository.incrementViewCount(id);
        const updatedBlog = await blogRepository.findById(id);

        res.json({
            success: true,
            data: {
                view_count: updatedBlog.view_count || 0,
            },
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

const getBlogPageSettings = async (req, res, next) => {
    try {
        let settings = await BlogSettings.findOne();
        if (!settings) {
            settings = await BlogSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateBlogPageSettings = async (req, res, next) => {
    try {
        let settings = await BlogSettings.findOne();
        const payload = {
            breadcrumb_title: req.body.breadcrumb_title,
            detail_breadcrumb_title: req.body.detail_breadcrumb_title,
            homepage_sub_title: req.body.homepage_sub_title,
            homepage_heading_before: req.body.homepage_heading_before,
            homepage_heading_highlight: req.body.homepage_heading_highlight,
            homepage_description: req.body.homepage_description,
            homepage_button_text: req.body.homepage_button_text,
        };

        if (settings) {
            settings = await BlogSettings.findByIdAndUpdate(settings._id, payload, { new: true });
        } else {
            settings = await BlogSettings.create(payload);
        }

        res.json({
            success: true,
            message: 'Blog page settings updated',
            data: settings,
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
    reactToBlog,
    reactToComment,
    addCommentReply,
    recordBlogView,
    getRelatedBlogs,
    getBlogStats,
    getBlogPageSettings,
    updateBlogPageSettings,
};