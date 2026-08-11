import BlogsPage from '../../../pages/BlogsPage.jsx';
import { getPublishedBlogCategories, getSeoByPath } from '../../../lib/data/stubs';
import { Suspense } from 'react';

const page = async () => {
  const blog_category = await getPublishedBlogCategories();
  const parentCategories = (blog_category.content || []).filter(
    (item) => item?.parent_id
  );

  return (
    <Suspense fallback={<div></div>}>
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
