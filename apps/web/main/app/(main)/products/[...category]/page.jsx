import React, { Suspense } from 'react';
import ProductsPage from '../../../../pages/ProductsPage';
import ProductsPageLoading from '../../../../components/main/products/ProductsPageLoading';
import { notFound } from 'next/navigation';
import {
  getCategorySeo,
  getProductCategoriesNested,
  getProductCategoryBySlug,
} from '../../../../lib/data/stubs';
import { lastCategorySlug } from '../../../../utils/paths';

const Page = async ({ params }) => {
  const resolved = await params;
  const slug = lastCategorySlug(resolved.category);

  const [categoriesRes, currentCategoryRes] = await Promise.all([
    getProductCategoriesNested(),
    getProductCategoryBySlug(slug),
  ]);

  if (!currentCategoryRes?.content) notFound();

  return (
    <Suspense fallback={<ProductsPageLoading />}>
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
  const slug = lastCategorySlug(resolved.category);
  const categoryRes = await getProductCategoryBySlug(slug);
  if (!categoryRes?.content) return {};

  const seoRes = await getCategorySeo(
    categoryRes.content._id || categoryRes.content.id
  );
  const item = seoRes?.content;

  return {
    title: item?.metaTitle || categoryRes.content.title || '',
    description: item?.metaDescription || '',
    keywords: item?.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item?.canonicalUrl || `/products/${encodeURIComponent(slug)}`,
    },
  };
}
