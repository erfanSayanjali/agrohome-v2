import CmsPageScreen, { cmsPageMetadata } from '../../components/main/cms/CmsPageScreen';
import '../../styles/home.css';

export const revalidate = 3600;

export default async function Home() {
  return <CmsPageScreen slug="/" fallbackTitle="صفحه اصلی" />;
}

export async function generateMetadata() {
  return cmsPageMetadata('/', 'آگروهوم');
}
