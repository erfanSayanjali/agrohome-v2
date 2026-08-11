import CmsHomeSections from '../../components/main/cms/CmsHomeSections';
import { getPublishedHomePage, metadataFromSeo } from '../../lib/data/cms';
import '../../styles/home.css';

export default async function Home() {
  const cmsHome = await getPublishedHomePage();

  if (!cmsHome?.blocks?.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center" dir="rtl">
        <h1 className="text-xl font-extrabold">صفحه اصلی از صفحه‌ساز بارگذاری نشد</h1>
        <p className="mt-3 text-sm text-black/60">
          مطمئن شوید API روشن است، صفحه «/» در پنل سکشن دارد، و
          <code className="mx-1 rounded bg-black/5 px-1">NEXT_PUBLIC_API_URL</code>
          درست تنظیم شده است.
        </p>
      </div>
    );
  }

  return <CmsHomeSections blocks={cmsHome.blocks} />;
}

export async function generateMetadata() {
  const cmsHome = await getPublishedHomePage();
  return metadataFromSeo(cmsHome?.seo, {
    title: cmsHome?.title || 'آگروهوم',
    canonical: '/',
  });
}
