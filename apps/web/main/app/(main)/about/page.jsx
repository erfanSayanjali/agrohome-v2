import CmsAboutSections from '../../../components/main/cms/CmsAboutSections';
import { getPublishedAboutPage } from '../../../lib/data/cms';

export default async function About() {
  const cmsAbout = await getPublishedAboutPage();

  if (!cmsAbout?.blocks?.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center" dir="rtl">
        <h1 className="text-xl font-extrabold">صفحه درباره ما از صفحه‌ساز بارگذاری نشد</h1>
        <p className="mt-3 text-sm text-black/60">
          مطمئن شوید API روشن است، صفحه «/about» در پنل سکشن دارد، و
          <code className="mx-1 rounded bg-black/5 px-1">NEXT_PUBLIC_API_URL</code>
          درست تنظیم شده است.
        </p>
      </div>
    );
  }

  return <CmsAboutSections blocks={cmsAbout.blocks} />;
}

export async function generateMetadata() {
  const cmsAbout = await getPublishedAboutPage();
  if (!cmsAbout?.title) return { title: 'درباره ما' };

  return {
    title: cmsAbout.title,
    alternates: {
      canonical: '/about',
    },
  };
}
