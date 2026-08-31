import BlogPage from '../../../../pages/BlogPage.jsx';
import {
  getBlogBySlug,
  getBlogSeo,
  getBlogSuggestions,
} from '../../../../lib/data/stubs';
import { notFound } from 'next/navigation';
import { decodePathSegment } from '../../../../utils/paths';

const getBlog = async (slug) => getBlogBySlug(slug);

async function page({ params }) {
  const { slug: rawSlug } = await params;
  const slug = decodePathSegment(rawSlug);
  const blog = await getBlog(slug);
  if (!blog.content) return notFound();

  const blogId = blog.content._id || blog.content.id;
  const categoryId =
    blog.content.categoryId ||
    blog.content.category_id?._id ||
    blog.content.category?.id;
  const suggestions = await getBlogSuggestions(categoryId, blogId);

  return <BlogPage blog={blog.content} Suggestions={suggestions.content || []} />;
}

export default page;

export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params;
  const slug = decodePathSegment(rawSlug);
  const blog = await getBlog(slug);
  if (!blog.content) return {};

  const blogId = blog.content._id || blog.content.id;
  const blogSeo = await getBlogSeo(blogId);
  const item = blogSeo?.content;

  return {
    title: item?.metaTitle || blog.content.title || '',
    description: item?.metaDescription || blog.content.subTitle || '',
    keywords: item?.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item?.canonicalUrl || `/blog/${slug}`,
    },
  };
}
