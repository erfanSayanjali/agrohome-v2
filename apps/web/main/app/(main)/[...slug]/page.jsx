import { notFound } from 'next/navigation';
import {
  getPublishedPage,
  metadataFromSeo,
} from '../../../lib/data/cms';
import CmsPageSections from '../../../components/main/cms/CmsPageSections';
import { isCmsCatchAllSlug, normalizeCmsSlug } from '@agrohome/shared';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function slugFromParams(segments) {
  if (typeof segments === 'string') return normalizeCmsSlug(segments);
  const parts = Array.isArray(segments) ? segments : [];
  return normalizeCmsSlug(`/${parts.join('/')}`);
}

export async function generateMetadata({ params }) {
  const { slug: segments } = await params;
  const slug = slugFromParams(segments);
  if (!isCmsCatchAllSlug(slug)) return {};
  const page = await getPublishedPage(slug);
  if (!page) return {};
  return metadataFromSeo(page.seo, {
    title: page.title,
    canonical: slug,
  });
}

export default async function CmsCatchAllPage({ params }) {
  const { slug: segments } = await params;
  const slug = slugFromParams(segments);
  if (!isCmsCatchAllSlug(slug)) notFound();

  const page = await getPublishedPage(slug);
  if (!page?.blocks?.length) notFound();

  return <CmsPageSections blocks={page.blocks} />;
}
