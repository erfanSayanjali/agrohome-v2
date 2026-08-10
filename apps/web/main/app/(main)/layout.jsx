import React from 'react';
import Header from '../../components/main/header/Header.jsx';
import Footer from '../../components/main/footer/Footer.jsx';
import {
  getFooterWidget,
  getProductCategoriesNested,
} from '../../lib/data/stubs';

const mainLayout = async ({ children }) => {
  const [footer, product_category] = await Promise.all([
    getFooterWidget(),
    getProductCategoriesNested(),
  ]);

  return (
    <div>
      <Header product_category={product_category?.content || []} />
      {children}
      <Footer data={footer.content} />
    </div>
  );
};

export default mainLayout;
