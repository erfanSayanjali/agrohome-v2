import BlogsPage from '../../../pages/BlogsPage.jsx';
import { getPublishedBlogCategories, getSeoByPath } from '../../../lib/data/stubs';
import { nestCategories } from '../../../utils/categories';
import { Suspense } from 'react';

const page = async () => {
  const blog_category = await getPublishedBlogCategories();
  const parentCategories = nestCategories(blog_category.content || []);

  return (
    <Suspense fallback={null}>
      <BlogsPage parentCategories={parentCategories} />
    </Suspense>
  );
};

export default page;

export async function generateMetadata() {
  const seo = await getSeoByPath('/blogs');
  const item = seo?.content?.[0];
  if (!item) return { title: 'وبلاگ' };

  return {
    title: item.metaTitle || 'وبلاگ',
    description: item.metaDescription || '',
    keywords: item.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item.canonicalUrl || '/blogs',
    },
  };
}
