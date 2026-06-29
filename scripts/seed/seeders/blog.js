const fs = require('fs');
const Blog = require('../../../src/models/Blog');
const BlogSettings = require('../../../src/models/BlogSettings');
const { loadHtml } = require('../lib/html');
const { staticFile } = require('../lib/paths');
const { slugify, cleanText, normalizeAssetPath } = require('../lib/utils');

const parseDate = (value = '') => {
  const cleaned = cleanText(value);
  if (!cleaned) return new Date();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const loadDetailContent = (href = '') => {
  if (!href) return null;
  const fileName = href.split('/').pop();
  const filePath = staticFile(fileName);
  if (!fs.existsSync(filePath)) return null;

  const $ = loadHtml(fileName);
  const details = $('.blog-details');
  if (!details.length) return null;
  return details.html();
};

const seedBlog = async () => {
  await BlogSettings.create({
    breadcrumb_title: 'Our Blog',
    detail_breadcrumb_title: 'Blog',
    homepage_sub_title: 'News & Blog',
    homepage_heading_before: 'Latest News & ',
    homepage_heading_highlight: 'Blog',
    homepage_description:
      'Keep up with the latest news, tips and inspiration from EDUSN International School',
    homepage_button_text: 'View More Our Blogs',
  });

  const $ = loadHtml('Blog.html');
  const docs = [];

  $('.blog-area .blog-item').each((index, el) => {
    const item = $(el);
    const title = cleanText(item.find('.blog-title a').text());
    if (!title) return;

    const detailHref = item.find('.blog-title a').attr('href') || '';
    const dateText = cleanText(item.find('.blog-item-meta li').eq(1).text());
    const featuredImage = normalizeAssetPath(item.find('.blog-item-img img').attr('src'));
    const content = loadDetailContent(detailHref);
    const slug = slugify(title) || `blog-post-${index + 1}`;
    const publishedDate = parseDate(dateText);

    docs.push({
      title,
      slug,
      excerpt: title.length > 160 ? `${title.slice(0, 157)}...` : title,
      content: content || `<p>${title}</p>`,
      featured_image: featuredImage,
      author: { name: 'EDUSN', avatar: null, role: 'Admin' },
      category: 'general',
      tags: ['EDUSN'],
      status: 'published',
      published_date: publishedDate,
      view_count: 0,
      like_count: 0,
      reactions: { like: 0, love: 0, celebrate: 0 },
      comments: [],
    });
  });

  await Blog.insertMany(docs);
  console.log(`  blog posts: ${docs.length}`);
};

module.exports = seedBlog;
