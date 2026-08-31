import CmsPageScreen, { cmsPageMetadata } from '../../../components/main/cms/CmsPageScreen';

export const revalidate = 3600;

export default async function About() {
  return <CmsPageScreen slug="/about" fallbackTitle="درباره ما" />;
}

export async function generateMetadata() {
  return cmsPageMetadata('/about', 'درباره ما');
}
