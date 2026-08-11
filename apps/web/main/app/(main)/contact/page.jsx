import CmsContactSections from '../../../components/main/cms/CmsContactSections';
import { getPublishedContactPage, metadataFromSeo } from '../../../lib/data/cms';
import { getSeoByPath } from '../../../lib/data/stubs';

export default async function Contact() {
  const cmsContact = await getPublishedContactPage();

  if (!cmsContact?.blocks?.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center" dir="rtl">
        <h1 className="text-xl font-extrabold">صفحه تماس از صفحه‌ساز بارگذاری نشد</h1>
        <p className="mt-3 text-sm text-black/60">
          مطمئن شوید API روشن است، صفحه «/contact» در پنل سکشن دارد، و
          <code className="mx-1 rounded bg-black/5 px-1">NEXT_PUBLIC_API_URL</code>
          درست تنظیم شده است.
        </p>
      </div>
    );
  }

  return <CmsContactSections blocks={cmsContact.blocks} />;
}

export async function generateMetadata() {
  const cmsContact = await getPublishedContactPage();
  if (cmsContact?.seo) {
    return metadataFromSeo(cmsContact.seo, {
      title: cmsContact.title || 'تماس با ما',
      canonical: '/contact',
    });
  }

  const seo = await getSeoByPath('/contact');
  const item = seo?.content?.[0];
  return metadataFromSeo(item ?? null, {
    title: 'تماس با ما',
    canonical: '/contact',
  });
}
