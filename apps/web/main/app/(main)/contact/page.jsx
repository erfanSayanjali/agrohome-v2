import CmsPageScreen, { cmsPageMetadata } from '../../../components/main/cms/CmsPageScreen';

export const revalidate = 3600;

export default async function Contact() {
  return <CmsPageScreen slug="/contact" fallbackTitle="تماس با ما" />;
}

export async function generateMetadata() {
  return cmsPageMetadata('/contact', 'تماس با ما');
}
