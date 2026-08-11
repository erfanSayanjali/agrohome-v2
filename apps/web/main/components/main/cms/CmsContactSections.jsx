import ContactHero from '../contact/ContactHero';
import ContactIntro from '../contact/ContactIntro';
import ContactFormSection from '../contact/ContactFormSection';

/** رندر سکشن‌های صفحه تماس از snapshot صفحه‌ساز */
export default function CmsContactSections({ blocks }) {
  return (
    <div className="mx-3 min-h-screen max-w-7xl md:my-10 lg:mx-auto">
      {blocks.map((block) => {
        const payload = block.payload || {};
        switch (block.type) {
          case 'page_hero':
            return <ContactHero key={block.id} cms={payload} />;
          case 'contact_intro':
            return <ContactIntro key={block.id} cms={payload} />;
          case 'contact_form':
            return <ContactFormSection key={block.id} cms={payload} />;
          case 'rich_text':
            return (
              <div key={block.id} className="my-6 px-3 md:px-0" dir="rtl">
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
