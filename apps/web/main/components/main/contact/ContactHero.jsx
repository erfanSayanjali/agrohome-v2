import PagesTitle from '../cards/PagesTitle';
import { mediaAlt, mediaUrl } from '../../../lib/data/stubs';

const ContactHero = ({ cms } = {}) => {
  const title = cms?.title || 'تماس با آگروهوم';
  const accent = cms?.titleAccent || 'آگروهوم';
  const accentColor = cms?.accentColor || '#F4C111';
  const image = mediaUrl(cms?.image) || '/c.jpg';
  const imageAlt = mediaAlt(cms?.image, cms?.imageAlt || 'تماس با ما');
  const parts = accent ? title.split(accent) : [title];

  return (
    <PagesTitle
      imagePosition={cms?.imagePosition || ''}
      image={image}
      alt={imageAlt}
      title={
        <p>
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span style={{ color: accentColor }}>{accent}</span>
              {parts.slice(1).join(accent)}
            </>
          ) : (
            title
          )}
        </p>
      }
    />
  );
};

export default ContactHero;
