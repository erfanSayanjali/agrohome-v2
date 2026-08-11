import React from 'react';
import ProductPage from '../../../../pages/ProductPage.jsx';
import { notFound } from 'next/navigation.js';
import {
  getProductBySlug,
  getProductSeo,
  getProductSpecifications,
  getSimilarProducts,
} from '../../../../lib/data/stubs';

const getProduct = async (slug) => getProductBySlug(slug);

const Product = async ({ params }) => {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product.content?.[0]) return notFound();

  const [specification, similarProducts] = await Promise.all([
    getProductSpecifications(product.content[0]._id),
    getSimilarProducts(product.content?.[0].category_id?.[0]?.slug),
  ]);

  return (
    <ProductPage
      similarProducts={similarProducts.content}
      specification={specification.content}
      data={product.content[0]}
      slug={decodeURIComponent(slug).split('-').join(' ')}
    />
  );
};

export default Product;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product.content?.[0]) return {};

  const productSeo = await getProductSeo(product.content[0]._id);
  const item = productSeo?.content;
  const title = item?.metaTitle || product.content[0].title || '';

  return {
    title,
    description: item?.metaDescription || product.content[0].shortDescription || '',
    keywords: item?.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item?.canonicalUrl || `/product/${slug}`,
    },
  };
}
