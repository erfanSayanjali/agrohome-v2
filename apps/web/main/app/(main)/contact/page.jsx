import React from 'react';
import ContactPage from '../../../pages/ContactPage.jsx';
import { getSeoByPath } from '../../../lib/data/stubs';

const page = () => {
  return <ContactPage />;
};

export default page;

export async function generateMetadata() {
  const seo = await getSeoByPath('/contact');
  const item = seo?.content?.[0];
  if (!item) return {};

  return {
    title: item.metaTitle || '',
    description: item.metaDescription || '',
    keywords: item.metaKeyWords?.join(', ') || '',
    alternates: {
      canonical: item.canonicalUrl || undefined,
    },
  };
}
