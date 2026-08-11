import { FaInstagram } from 'react-icons/fa6';
import { GoMail } from 'react-icons/go';
import { ImPhone } from 'react-icons/im';

const defaultChannels = [
  { type: 'email', title: 'info@codeino.com', href: 'mailto:info@codeino.com' },
  { type: 'phone', title: '021-28428343', href: 'tel:02128428343' },
  {
    type: 'instagram',
    title: 'instagram.com/agrohome',
    href: 'https://www.instagram.com/agrohome',
  },
];

function channelIcon(type) {
  switch (String(type || '').toLowerCase()) {
    case 'phone':
      return <ImPhone fontSize={20} />;
    case 'instagram':
      return <FaInstagram fontSize={20} />;
    case 'email':
    default:
      return <GoMail fontSize={20} />;
  }
}

const SocialMediaLinks = ({ title, link, icon }) => (
  <a href={link || '#'} className="flex items-center gap-2">
    {title}
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#105238] text-white">
      {icon}
    </div>
  </a>
);

const ContactIntro = ({ cms } = {}) => {
  const title = cms?.title || 'لورم ایپسوم متن نمایشی با تولید ساختگی نامفهوم';
  const text =
    cms?.text ||
    'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجـــــله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می‌باشد، کتابهای زیادی در شصت و سه درصد گذشــــــــــــته حال و آینــــده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد، در ایــــــــن صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها، و شرایط سخت تایپ به پایان رسد..';
  const channels =
    Array.isArray(cms?.channels) && cms.channels.length ? cms.channels : defaultChannels;

  return (
    <>
      <h1 className="my-4 px-3 text-xl font-extrabold md:px-0 md:text-2xl">{title}</h1>
      <p className="px-3 text-justify leading-relaxed text-gray-600 md:px-0">{text}</p>
      <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-end">
        {channels.map((ch, i) => (
          <SocialMediaLinks
            key={`${ch.type || 'ch'}-${i}`}
            icon={channelIcon(ch.type)}
            link={ch.href || '#'}
            title={ch.title || ''}
          />
        ))}
      </div>
    </>
  );
};

export default ContactIntro;
