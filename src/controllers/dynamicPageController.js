const dynamicPageRepository = require('../repositories/dynamicPageRepository');

/**
 * @desc    Get all pages
 * @route   GET /api/dynamic-pages
 * @access  Private (Admin)
 */
const getAllPages = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        let pages;
        
        if (search) {
            pages = await dynamicPageRepository.searchPages(search);
        } else if (status) {
            pages = await dynamicPageRepository.findByStatus(status);
        } else {
            pages = await dynamicPageRepository.findAll({}, { sort: { createdAt: -1 } });
        }
        
        res.json({
            success: true,
            count: pages.length,
            data: pages
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get published pages (for frontend)
 * @route   GET /api/dynamic-pages/published
 * @access  Public
 */
const getPublishedPages = async (req, res, next) => {
    try {
        const pages = await dynamicPageRepository.getPublishedPages();
        
        res.json({
            success: true,
            count: pages.length,
            data: pages
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single page by slug
 * @route   GET /api/dynamic-pages/slug/:slug
 * @access  Public
 */
const getPageBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const page = await dynamicPageRepository.findBySlug(slug);
        
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single page by id
 * @route   GET /api/dynamic-pages/:id
 * @access  Private (Admin)
 */
const getPageById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = await dynamicPageRepository.findById(id);
        
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new page
 * @route   POST /api/dynamic-pages
 * @access  Private (Admin)
 */
const createPage = async (req, res, next) => {
    try {
        const { name, slug, seo, template, status } = req.body;
        
        // Check if slug exists
        const existingPage = await dynamicPageRepository.findOne({ slug });
        if (existingPage) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists. Please choose a different URL.'
            });
        }
        
        const page = await dynamicPageRepository.create({
            name,
            slug: slug.toLowerCase().replace(/\s+/g, '-'),
            seo: seo || {},
            sections: [],
            template: template || 'default',
            status: status || 'draft',
            created_by: req.user._id
        });
        
        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update page
 * @route   PUT /api/dynamic-pages/:id
 * @access  Private (Admin)
 */
const updatePage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, seo, template, status, sections } = req.body;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        // Check slug uniqueness
        if (slug && slug !== page.slug) {
            const existingPage = await dynamicPageRepository.findOne({ slug });
            if (existingPage) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug already exists. Please choose a different URL.'
                });
            }
        }
        
        const updateData = {
            name: name || page.name,
            slug: slug || page.slug,
            seo: seo || page.seo,
            template: template || page.template,
            status: status || page.status,
            sections: sections !== undefined ? sections : page.sections
        };
        
        const updatedPage = await dynamicPageRepository.updateById(id, updateData);
        
        res.json({
            success: true,
            message: 'Page updated successfully',
            data: updatedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete page
 * @route   DELETE /api/dynamic-pages/:id
 * @access  Private (Admin)
 */
const deletePage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        await dynamicPageRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Publish page
 * @route   PUT /api/dynamic-pages/:id/publish
 * @access  Private (Admin)
 */
const publishPage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        const publishedPage = await dynamicPageRepository.publishPage(id);
        
        res.json({
            success: true,
            message: 'Page published successfully',
            data: publishedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Unpublish page
 * @route   PUT /api/dynamic-pages/:id/unpublish
 * @access  Private (Admin)
 */
const unpublishPage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        const unpublishedPage = await dynamicPageRepository.updateById(id, { 
            status: 'draft',
            published_at: null
        });
        
        res.json({
            success: true,
            message: 'Page unpublished successfully',
            data: unpublishedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Duplicate page
 * @route   POST /api/dynamic-pages/:id/duplicate
 * @access  Private (Admin)
 */
const duplicatePage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Name and slug are required'
            });
        }
        
        // Check if slug exists
        const existingPage = await dynamicPageRepository.findOne({ slug });
        if (existingPage) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists. Please choose a different URL.'
            });
        }
        
        const duplicatedPage = await dynamicPageRepository.duplicatePage(id, name, slug);
        
        if (!duplicatedPage) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Page duplicated successfully',
            data: duplicatedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update page sections (reorder)
 * @route   PUT /api/dynamic-pages/:id/sections
 * @access  Private (Admin)
 */
const updatePageSections = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sections } = req.body;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        // Update order of sections
        const updatedSections = sections.map((section, index) => ({
            ...section,
            order: index
        }));
        
        const updatedPage = await dynamicPageRepository.updateSections(id, updatedSections);
        
        res.json({
            success: true,
            message: 'Sections updated successfully',
            data: updatedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add section to page
 * @route   POST /api/dynamic-pages/:id/sections
 * @access  Private (Admin)
 */
const addSection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type, props } = req.body;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        const newSection = {
            id: Date.now().toString(),
            type,
            order: page.sections.length,
            props: props || {},
            status: 'active'
        };
        
        const updatedSections = [...page.sections, newSection];
        const updatedPage = await dynamicPageRepository.updateSections(id, updatedSections);
        
        res.status(201).json({
            success: true,
            message: 'Section added successfully',
            data: updatedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update single section
 * @route   PUT /api/dynamic-pages/:id/sections/:sectionId
 * @access  Private (Admin)
 */
const updateSection = async (req, res, next) => {
    try {
        const { id, sectionId } = req.params;
        const { props, status } = req.body;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        const updatedSections = page.sections.map(section => 
            section.id === sectionId 
                ? { ...section, props: props || section.props, status: status || section.status }
                : section
        );
        
        const updatedPage = await dynamicPageRepository.updateSections(id, updatedSections);
        
        res.json({
            success: true,
            message: 'Section updated successfully',
            data: updatedPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete section from page
 * @route   DELETE /api/dynamic-pages/:id/sections/:sectionId
 * @access  Private (Admin)
 */
const deleteSection = async (req, res, next) => {
    try {
        const { id, sectionId } = req.params;
        
        const page = await dynamicPageRepository.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        const updatedSections = page.sections.filter(section => section.id !== sectionId);
        const updatedPage = await dynamicPageRepository.updateSections(id, updatedSections);
        
        res.json({
            success: true,
            message: 'Section deleted successfully',
            data: updatedPage
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPages,
    getPublishedPages,
    getPageBySlug,
    getPageById,
    createPage,
    updatePage,
    deletePage,
    publishPage,
    unpublishPage,
    duplicatePage,
    updatePageSections,
    addSection,
    updateSection,
    deleteSection
};