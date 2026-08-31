import React, { Suspense } from 'react';
import BlogsPage from '../../../../pages/BlogsPage.jsx';
import BlogsPageLoading from '../../../../components/main/blog/BlogsPageLoading';
import { notFound } from 'next/navigation';
import { decodePathSegment } from '../../../../utils/paths';
import {
  getBlogCategoryBySlug,
  getBlogCategorySeo,
  getPublishedBlogCategories,
} from '../../../../lib/data/stubs';
import { nestCategories } from '../../../../utils/categories';

const Page = async ({ params }) => {
  const resolved = await params;
  const slug = decodePathSegment(resolved.category);

  const [categoriesRes, currentCategoryRes] = await Promise.all([
    getPublishedBlogCategories(),
    getBlogCategoryBySlug(slug),
  ]);

  if (!currentCategoryRes?.content) notFound();

  const parentCategories = nestCategories(categoriesRes.content || []);

  return (
    <Suspense fallback={<BlogsPageLoading />}>
      <BlogsPage
        currentCategory={currentCategoryRes.content}
        parentCategories={parentCategories}
      />
    </Suspense>
  );
};

export default Page;

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = decodePathSegment(resolved.category);
  const categoryRes = await getBlogCategoryBySlug(slug);
  if (!categoryRes?.content) return {};

  const seoRes = await getBlogCategorySeo(
    categoryRes.content._id || categoryRes.content.id
  );
  const item = seoRes?.content;

  return {
    title: item?.metaTitle || categoryRes.content.title || '',
    description: item?.metaDescription || '',
    keywords: item?.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item?.canonicalUrl || `/blogs/${slug}`,
    },
  };
}
