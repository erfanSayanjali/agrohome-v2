import React, { Suspense } from 'react';
import ProductPage from '../../../../pages/ProductPage.jsx';
import { notFound, redirect } from 'next/navigation.js';
import {
  getProductBySlug,
  getProductCategoryBySlug,
  getProductSeo,
  getSimilarProducts,
} from '../../../../lib/data/stubs';
import { decodePathSegment } from '../../../../utils/paths';

const Product = async ({ params }) => {
  const { slug: rawSlug } = await params;
  const slug = decodePathSegment(rawSlug);
  const product = await getProductBySlug(slug);
  if (!product.content?.[0]) {
    const category = await getProductCategoryBySlug(slug);
    if (category.content?.slug) {
      redirect(`/products/${encodeURIComponent(category.content.slug)}`);
    }
    return notFound();
  }

  const item = product.content[0];
  const similarProducts = await getSimilarProducts(item.category_id?.[0]?.slug);

  return (
    <Suspense fallback={<div></div>}>
      <ProductPage
        similarProducts={similarProducts.content}
        specification={item.specs || []}
        data={item}
        slug={item.title || slug}
      />
    </Suspense>
  );
};

export default Product;

export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params;
  const slug = decodePathSegment(rawSlug);
  const product = await getProductBySlug(slug);
  if (!product.content?.[0]) return {};

  const productSeo = await getProductSeo(product.content[0]._id || product.content[0].id);
  const item = productSeo?.content;
  const title = item?.metaTitle || product.content[0].title || '';

  return {
    title,
    description: item?.metaDescription || product.content[0].subTitle || product.content[0].shortDescription || '',
    keywords: item?.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item?.canonicalUrl || `/product/${slug}`,
    },
  };
}
