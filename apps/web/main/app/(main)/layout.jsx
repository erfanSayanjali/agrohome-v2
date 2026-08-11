import React from 'react';
import Header from '../../components/main/header/Header.jsx';
import Footer from '../../components/main/footer/Footer.jsx';
import { getProductCategoriesNested } from '../../lib/data/stubs';
import { getSiteSettings } from '../../lib/data/cms';

const mainLayout = async ({ children }) => {
  const [settings, product_category] = await Promise.all([
    getSiteSettings(),
    getProductCategoriesNested(),
  ]);

  return (
    <div>
      <Header
        product_category={product_category?.content || []}
        logoUrl={settings.logoUrl || '/logo.png'}
      />
      {children}
      <Footer data={settings} />
    </div>
  );
};

export default mainLayout;
