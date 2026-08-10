import React, { Suspense } from 'react';
import ProductsPage from '../../../../pages/ProductsPage';
import { notFound } from 'next/navigation';
import {
  getCategorySeo,
  getProductCategories,
  getProductCategoryBySlug,
} from '../../../../lib/data/stubs';

const Page = async ({ params }) => {
  const resolved = await params;
  const slug = decodeURIComponent(resolved.category).split(',').at(-1);

  const [categoriesRes, currentCategoryRes] = await Promise.all([
    getProductCategories(),
    getProductCategoryBySlug(slug),
  ]);

  if (!currentCategoryRes?.content) notFound();

  return (
    <Suspense fallback={<div></div>}>
      <ProductsPage
        currentCategory={currentCategoryRes.content}
        product_category={categoriesRes.content}
      />
    </Suspense>
  );
};

export default Page;

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = decodeURIComponent(resolved.category).split(',').at(-1);
  const categoryRes = await getProductCategoryBySlug(slug);
  if (!categoryRes?.content) return {};

  const seoRes = await getCategorySeo(categoryRes.content._id);
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
