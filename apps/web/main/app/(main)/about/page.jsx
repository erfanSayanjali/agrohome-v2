import React from 'react';
import AboutPage from '../../../pages/AboutPage.jsx';
import { getSeoByPath, getWidgetKadamat } from '../../../lib/data/stubs';

const page = async () => {
  const [kadamat] = await Promise.all([getWidgetKadamat()]);
  return <AboutPage kadamat={kadamat.content} />;
};

export default page;

export async function generateMetadata() {
  const seo = await getSeoByPath('/about');
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
