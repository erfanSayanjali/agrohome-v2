import CmsPageSections from './CmsPageSections';
import { getPublishedPage, metadataFromSeo } from '../../../lib/data/cms';

export async function cmsPageMetadata(slug, fallbackTitle) {
  const page = await getPublishedPage(slug);
  return metadataFromSeo(page?.seo, {
    title: page?.title || fallbackTitle,
    canonical: slug === '/' ? '/' : slug,
  });
}

export default async function CmsPageScreen({ slug, fallbackTitle }) {
  const page = await getPublishedPage(slug);

  if (!page?.blocks?.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center" dir="rtl">
        <h1 className="text-xl font-extrabold">
          {fallbackTitle ? `${fallbackTitle} از صفحه‌ساز بارگذاری نشد` : 'صفحه از صفحه‌ساز بارگذاری نشد'}
        </h1>
        <p className="mt-3 text-sm text-black/60">
          مطمئن شوید API روشن است، صفحه «{slug}» در پنل سکشن دارد، و
          <code className="mx-1 rounded bg-black/5 px-1">NEXT_PUBLIC_API_URL</code>
          درست تنظیم شده است.
        </p>
      </div>
    );
  }

  return <CmsPageSections blocks={page.blocks} />;
}
