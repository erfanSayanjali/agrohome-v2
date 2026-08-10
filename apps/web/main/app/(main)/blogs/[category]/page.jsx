import React, { Suspense } from 'react';
import BlogsPage from '../../../../pages/BlogsPage.jsx';
import { notFound } from 'next/navigation';
import {
  getBlogCategoryBySlug,
  getBlogCategorySeo,
  getPublishedBlogCategories,
} from '../../../../lib/data/stubs';

const Page = async ({ params }) => {
  const resolved = await params;
  const slug = resolved.category;

  const [categoriesRes, currentCategoryRes] = await Promise.all([
    getPublishedBlogCategories(),
    getBlogCategoryBySlug(slug),
  ]);

  if (!currentCategoryRes?.content) notFound();

  const parentCategories = (categoriesRes.content || []).filter(
    (item) => item?.parent_id
  );

  return (
    <Suspense fallback={<div></div>}>
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
  const slug = resolved.category;
  const categoryRes = await getBlogCategoryBySlug(slug);
  if (!categoryRes?.content) return {};

  const seoRes = await getBlogCategorySeo(categoryRes.content._id);
  const item = seoRes?.content;
  if (!item) return {};

  return {
    title: item.metaTitle ?? '',
    description: item.metaDescription ?? '',
    keywords: item.metaKeyWords?.join(', ') ?? '',
    alternates: {
      canonical: item.canonicalUrl || undefined,
    },
  };
}
