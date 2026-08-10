import BlogPage from '../../../../pages/BlogPage.jsx';
import {
  getBlogBySlug,
  getBlogSeo,
  getBlogSuggestions,
} from '../../../../lib/data/stubs';
import { notFound } from 'next/navigation';

const getBlog = async (slug) => getBlogBySlug(slug);

async function page({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog.content) return notFound();

  const Suggestions = await getBlogSuggestions(blog.content.category_id?._id);

  return <BlogPage blog={blog.content} Suggestions={Suggestions.content} />;
}

export default page;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog.content) return {};

  const blogSeo = await getBlogSeo(blog.content._id);
  if (!blogSeo?.content) return {};

  const item = blogSeo.content;
  return {
    title: item.metaTitle || '',
    description: item.metaDescription || '',
    keywords: item.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item.canonicalUrl || undefined,
    },
  };
}
