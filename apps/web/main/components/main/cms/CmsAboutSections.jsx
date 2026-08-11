import ContactHero from '../contact/ContactHero';
import AboutStory from '../about/AboutStory';
import AboutTrustBanner from '../about/AboutTrustBanner';
import AboutServices from '../about/AboutServices';

/** رندر سکشن‌های صفحه درباره ما از snapshot صفحه‌ساز */
export default function CmsAboutSections({ blocks }) {
  return (
    <div className="min-h-screen">
      {blocks.map((block) => {
        const payload = block.payload || {};
        switch (block.type) {
          case 'page_hero':
            return (
              <div key={block.id} className="mx-3 max-w-7xl md:my-10 lg:mx-auto">
                <ContactHero cms={payload} />
              </div>
            );
          case 'about_story':
            return <AboutStory key={block.id} cms={payload} />;
          case 'about_banner':
            return <AboutTrustBanner key={block.id} cms={payload} />;
          case 'about_services':
            return <AboutServices key={block.id} cms={payload} />;
          case 'rich_text':
            return (
              <div key={block.id} className="mx-3 my-6 max-w-7xl px-3 md:px-0 lg:mx-auto" dir="rtl">
                {payload.title ? (
                  <h2 className="mb-3 text-xl font-extrabold">{payload.title}</h2>
                ) : null}
                {payload.text ? (
                  <div
                    className="leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: String(payload.text) }}
                  />
                ) : null}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
