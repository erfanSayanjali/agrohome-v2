import React, { Suspense } from 'react';
import ProductsPage from '../../../pages/ProductsPage';
import { getProductCategories, getSeoByPath } from '../../../lib/data/stubs';

export async function generateMetadata() {
  const seo = await getSeoByPath('/products');
  const item = seo?.content?.[0];
  if (!item) return { title: 'محصولات' };

  return {
    title: item.metaTitle || 'محصولات',
    description: item.metaDescription || '',
    keywords: item.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item.canonicalUrl || '/products',
    },
  };
}

const page = async () => {
  const product_category = await getProductCategories();
  return (
    <Suspense fallback={<div></div>}>
      <ProductsPage product_category={product_category.content} />
    </Suspense>
  );
};

export default page;
