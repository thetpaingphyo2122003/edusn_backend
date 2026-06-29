const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
    section_key: {
        type: String,
        required: true,
        unique: true,
        enum: ['hero', 'about', 'culture', 'mission', 'statistics', 'attending_virtually', 'cta']
    },
    title: {
        type: String,
        default: null
    },
    content: {
        type: String,
        default: null
    },
    sub_content: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    button_text: {
        type: String,
        default: null
    },
    button_link: {
        type: String,
        default: null
    },
    extra_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: { createdAt: false, updatedAt: true }
});



module.exports = mongoose.model('SiteContent', siteContentSchema);