import HomeHeader from '../home/HomeHeader';
import About from '../home/About';
import Banner from '../home/Banner';
import BlogsByCategory from '../home/BlogsByCategory';
import NewestProducts from '../home/NewestProducts';
import Comments from '../home/Comments';
import Faq from '../home/Faq';
import NewestBlog from '../home/NewestBlog';
import ContactHero from '../contact/ContactHero';
import ContactIntro from '../contact/ContactIntro';
import ContactFormSection from '../contact/ContactFormSection';
import AboutStory from '../about/AboutStory';
import AboutTrustBanner from '../about/AboutTrustBanner';
import AboutServices from '../about/AboutServices';
import { sanitizeHtml } from '../../../utils/sanitize';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mapProducts(items) {
  return asArray(items).map((p) => {
    const media = p.media || (p.thumbnailUrl ? { url: p.thumbnailUrl, alt: null } : null);
    return {
      ...p,
      media,
      thumbnail_id: media
        ? [{ url: media.url, alt: media.alt }]
        : p.thumbnail_id || [],
      category_id: p.categories?.length
        ? p.categories.map((c) => ({ title: c.category?.title || c.title }))
        : p.category_id || [],
    };
  });
}

function mapBlogCategories(items) {
  return asArray(items).map((c) => {
    const media = c.media || (c.thumbnailUrl ? { url: c.thumbnailUrl, alt: null } : null);
    return {
      ...c,
      _id: c.id || c._id,
      media,
      thumbnail_id: media
        ? [{ url: media.url, alt: media.alt }]
        : c.thumbnail_id || [],
    };
  });
}

function mapBlogs(items) {
  return asArray(items).map((b) => {
    const media = b.media || (b.thumbnailUrl ? { url: b.thumbnailUrl, alt: null } : null);
    return {
      ...b,
      media,
      description: b.content || b.description || '',
      date: b.createdAt || b.date || new Date(),
      thumbnail_id: media
        ? [{ url: media.url, alt: media.alt }]
        : b.thumbnail_id || [],
    };
  });
}

function mapComments(items) {
  return asArray(items)
    .filter((c) => c.showOnHome === true)
    .map((c) => ({
      ...c,
      _id: c.id || c._id,
      rating: c.rating ?? 5,
      content: c.content || '',
    }));
}

function entityFromBlock(block) {
  const payload = block.payload || {};
  if (payload.entity) return String(payload.entity);
  switch (block.type) {
    case 'blog_list':
    case 'blog_grid':
      return 'blog';
    case 'comment_list':
      return 'comment';
    case 'blog_category_grid':
      return 'blog_category';
    case 'product_grid':
    case 'entity_slider':
    default:
      return 'product';
  }
}

function renderEntitySection(block, data) {
  const payload = block.payload || {};
  const entity = entityFromBlock(block);

  switch (entity) {
    case 'blog_category': {
      const categories = mapBlogCategories(data);
      return (
        <BlogsByCategory key={block.id} categories={categories} cms={payload} />
      );
    }
    case 'blog': {
      const blogs = mapBlogs(data);
      return <NewestBlog key={block.id} blogs={blogs} cms={payload} />;
    }
    case 'comment': {
      const comments = mapComments(data);
      return <Comments key={block.id} comments={comments} cms={payload} />;
    }
    case 'product_category':
    case 'product':
    default: {
      const products = mapProducts(data);
      return <NewestProducts key={block.id} products={products} cms={payload} />;
    }
  }
}

function RichText({ block, payload, className }) {
  return (
    <div key={block.id} className={className} dir="rtl">
      {payload.title ? (
        <h2 className="mb-3 text-xl font-extrabold">{payload.title}</h2>
      ) : null}
      {payload.text ? (
        <div
          className="leading-relaxed text-gray-600"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(payload.text)) }}
        />
      ) : null}
    </div>
  );
}

/** رندر همهٔ انواع سکشن صفحه‌ساز */
export default function CmsPageSections({ blocks }) {
  return (
    <div className="min-h-screen overflow-x-clip">
      {blocks.map((block) => {
        const payload = block.payload || {};
        const data = block.resolved;

        switch (block.type) {
          case 'hero':
            return <HomeHeader key={block.id} cms={payload} />;
          case 'about':
            return <About key={block.id} cms={payload} />;
          case 'banner':
            return <Banner key={block.id} cms={payload} />;
          case 'faq':
            return (
              <Faq
                key={block.id}
                faq={{ content: { items: payload.items || [] } }}
                cms={payload}
              />
            );
          case 'page_hero':
            return (
              <div key={block.id} className="w-full md:mx-3 md:max-w-7xl md:my-10 lg:mx-auto">
                <ContactHero cms={payload} />
              </div>
            );
          case 'about_story':
            return <AboutStory key={block.id} cms={payload} />;
          case 'about_banner':
            return <AboutTrustBanner key={block.id} cms={payload} />;
          case 'about_services':
            return <AboutServices key={block.id} cms={payload} />;
          case 'contact_intro':
            return (
              <div key={block.id} className="mx-3 max-w-7xl md:mb-10 md:mt-10 lg:mx-auto">
                <ContactIntro cms={payload} />
              </div>
            );
          case 'contact_form':
            return (
              <div key={block.id} className="mx-3 max-w-7xl md:my-10 lg:mx-auto">
                <ContactFormSection cms={payload} />
              </div>
            );
          case 'rich_text':
            return (
              <RichText
                key={block.id}
                block={block}
                payload={payload}
                className="mx-3 my-6 max-w-7xl px-3 md:px-0 lg:mx-auto"
              />
            );
          case 'entity_slider':
          case 'product_grid':
          case 'blog_list':
          case 'blog_grid':
          case 'comment_list':
          case 'blog_category_grid':
            return renderEntitySection(block, data);
          default:
            return null;
        }
      })}
    </div>
  );
}
