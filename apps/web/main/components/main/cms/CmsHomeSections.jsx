import HomeHeader from '../home/HomeHeader';
import About from '../home/About';
import Banner from '../home/Banner';
import BlogsByCategory from '../home/BlogsByCategory';
import NewestProducts from '../home/NewestProducts';
import Comments from '../home/Comments';
import Faq from '../home/Faq';
import NewestBlog from '../home/NewestBlog';

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
  return asArray(items).map((c) => ({
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

/** رندر سکشن‌های صفحه اصلی از snapshot صفحه‌ساز با استایل کامپوننت‌های فعلی */
export default function CmsHomeSections({ blocks }) {
  return (
    <>
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
    </>
  );
}
