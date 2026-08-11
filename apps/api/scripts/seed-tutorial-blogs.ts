/**
 * Create one SEO-ready published blog post per tutorial blog category.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type ArticleDef = {
  categorySlug: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  content: string;
};

const ARTICLES: ArticleDef[] = [
  {
    categorySlug: "fazaye-sabz-hayat",
    title: "راهنمای کامل کوددهی چمن و فضای سبز حیاط",
    slug: "rahnamaye-kooddehi-chaman-va-fazaye-sabz",
    metaTitle: "کود چمن و فضای سبز حیاط | راهنمای نگهداری حرفه‌ای | آگروهوم",
    metaDescription:
      "با برنامه کوددهی درست، چمن حیاط را سبز، متراکم و مقاوم نگه دارید. راهنمای فصلی کوددهی چمن، پرچین و فضای سبز خانگی از آگروهوم.",
    keywords: [
      "کود چمن",
      "فضای سبز حیاط",
      "نگهداری چمن",
      "کوددهی چمن",
      "پرچین حیاط",
      "آگروهوم",
    ],
    content: `
<h2>چرا کوددهی چمن حیاط مهم است؟</h2>
<p>چمن و فضای سبز حیاط برای سبز ماندن به تغذیه منظم نیاز دارند. خاک حیاط‌های شهری معمولاً فقیر است و بدون کود مناسب، چمن زرد، تنک و حساس به خشکی می‌شود.</p>
<h2>بهترین زمان کوددهی چمن</h2>
<ul>
<li><strong>بهار:</strong> شروع رشد فعال؛ کود رشد با نیتروژن متعادل</li>
<li><strong>تابستان:</strong> تغذیه سبک‌تر برای مقاومت به گرما</li>
<li><strong>پاییز:</strong> تقویت ریشه برای زمستان‌گذرانی</li>
</ul>
<h2>نکات کاربردی نگهداری فضای سبز</h2>
<ol>
<li>چمن را در ارتفاع مناسب کوتاه کنید تا ریشه قوی‌تر بماند.</li>
<li>آبیاری عمیق و کمتر، بهتر از آبیاری سطحی روزانه است.</li>
<li>کود را بعد از کوتاه کردن و روی چمن خشک پخش کنید، سپس آبیاری ملایم انجام دهید.</li>
<li>برای پرچین و حاشیه سبز، از کود آهسته‌رهش استفاده کنید تا تغذیه یکنواخت بماند.</li>
</ol>
<h2>پیشنهاد آگروهوم</h2>
<p>اگر به دنبال کود بدون بوی بد و مناسب فضای خانگی هستید، محصولات تخصصی آگروهوم برای چمن و گیاهان فضای باز می‌توانند رشد متراکم و رنگ سبز پایدار ایجاد کنند. در انتخاب کود، به نوع خاک، میزان آفتاب و فصل رشد توجه کنید.</p>
<p>با برنامه منظم فصلی، حیاط شما نه فقط زیباتر می‌شود، بلکه نگهداری‌اش هم ساده‌تر و کم‌هزینه‌تر خواهد بود.</p>
`.trim(),
  },
  {
    categorySlug: "derakht-va-derakhtche",
    title: "کوددهی درختان میوه و درختچه‌ها؛ از کاشت تا باردهی",
    slug: "kooddehi-derakhtan-miveh-va-derakhtcheha",
    metaTitle: "کود درختان میوه و درختچه | راهنمای باردهی بهتر | آگروهوم",
    metaDescription:
      "یاد بگیرید درختان میوه و درختچه‌ها را چطور و چه زمانی کود دهید تا رشد ریشه، گلدهی و باردهی بهتری داشته باشند. راهنمای کاربردی آگروهوم.",
    keywords: [
      "کود درختان میوه",
      "کود درختچه",
      "باردهی درخت",
      "کود باغی",
      "تغذیه درخت میوه",
      "آگروهوم",
    ],
    content: `
<h2>نیاز غذایی درختان میوه و درختچه‌ها</h2>
<p>درختان میوه برای رشد شاخه، گل‌دهی و تشکیل میوه به تعادل درشت‌مغذی‌ها (نیتروژن، فسفر، پتاسیم) و ریزمغذی‌ها نیاز دارند. کوددهی نامنظم یا بیش‌ازحد، گلدهی را کم و کیفیت میوه را ضعیف می‌کند.</p>
<h2>برنامه پیشنهادی کوددهی</h2>
<ul>
<li><strong>اوایل بهار:</strong> تقویت رشد رویشی و جوانه‌زنی</li>
<li><strong>قبل و حین گلدهی:</strong> تمرکز روی فسفر و پتاسیم برای گل و میوه</li>
<li><strong>پس از برداشت:</strong> بازیابی درخت برای فصل بعد</li>
</ul>
<h2>اشتباهات رایج</h2>
<ol>
<li>ریختن کود پای تنه بدون آبیاری کافی</li>
<li>استفاده زیاد از نیتروژن که رشد برگ را زیاد و میوه را کم می‌کند</li>
<li>نادیده گرفتن زهکش خاک و فشردگی ریشه</li>
</ol>
<h2>نکته طلایی برای درختچه‌های زینتی و میوه‌ای</h2>
<p>کود را در محدوده سایه‌انداز تاج درخت پخش کنید، نه فقط کنار تنه. ریشه‌های فعال تغذیه‌کننده معمولاً در همین ناحیه هستند. آبیاری بعد از کوددهی جذب را بهتر می‌کند.</p>
<h2>انتخاب کود مناسب با آگروهوم</h2>
<p>برای درختان میوه و درختچه‌های باغچه، کودهای تخصصی فضای باز آگروهوم کمک می‌کنند تغذیه پایدار، رشد سالم و کیفیت بهتر میوه را داشته باشید؛ بدون بوی آزاردهنده و مناسب استفاده خانگی.</p>
`.trim(),
  },
  {
    categorySlug: "gol-zeynati",
    title: "راهنمای کوددهی گل‌های باغچه و زینتی برای گلدهی بیشتر",
    slug: "rahnamaye-kooddehi-golhaye-baghche-va-zeynaty",
    metaTitle: "کود گل باغچه و زینتی | افزایش گلدهی | آگروهوم",
    metaDescription:
      "با انتخاب کود درست، گل‌های باغچه و گیاهان زینتی را پرگل‌تر و بادوام‌تر کنید. راهنمای فصلی کوددهی گل‌های فضای باز از آگروهوم.",
    keywords: [
      "کود گل باغچه",
      "گل زینتی",
      "افزایش گلدهی",
      "کود گل‌های فضای باز",
      "نگهداری گل باغچه",
      "آگروهوم",
    ],
    content: `
<h2>راز گلدهی بهتر در باغچه</h2>
<p>گل‌های باغچه و زینتی برای تولید غنچه و رنگ پایدار به تغذیه منظم نیاز دارند. اگر فقط آبیاری کنید و کود ندهید، گل‌ها کوتاه‌عمر و کم‌تعداد می‌شوند.</p>
<h2>چه کودی برای گل‌های زینتی مناسب است؟</h2>
<ul>
<li>در شروع فصل رشد: کود متعادل برای استقرار گیاه</li>
<li>در دوره غنچه‌دهی: کود با پتاسیم و فسفر بالاتر</li>
<li>بین موج‌های گلدهی: تغذیه سبک برای بازیابی</li>
</ul>
<h2>نکات نگهداری گل باغچه</h2>
<ol>
<li>گل‌های پژمرده را حذف کنید تا انرژی گیاه صرف گل جدید شود.</li>
<li>آبیاری را صبح زود انجام دهید تا از بیماری‌های قارچی کم شود.</li>
<li>از کوددهی روی برگ‌های خیس در آفتاب شدید پرهیز کنید.</li>
<li>خاک باغچه را هر فصل کمی اصلاح کنید تا زهکش و تهویه بهتر شود.</li>
</ol>
<h2>پیشنهاد آگروهوم برای گل‌های زینتی</h2>
<p>محصولات تخصصی آگروهوم برای گل‌های باغچه و گیاهان فضای باز، گلدهی بیشتر و رنگ زنده‌تر ایجاد می‌کنند و برای استفاده خانگی فرموله شده‌اند. با برنامه منظم، باغچه شما در تمام فصل رشد جذاب می‌ماند.</p>
`.trim(),
  },
  {
    categorySlug: "giyah-apartemani",
    title: "مراقبت و کوددهی گیاهان آپارتمانی؛ راهنمای خانگی کامل",
    slug: "moraghebat-va-kooddehi-giyahan-apartemani",
    metaTitle: "کود گیاهان آپارتمانی | راهنمای نگهداری خانگی | آگروهوم",
    metaDescription:
      "یاد بگیرید گیاهان آپارتمانی را چطور آبیاری و کوددهی کنید تا برگ‌ها شاداب، رشد پایدار و بدون سوختگی بمانند. راهنمای عملی آگروهوم.",
    keywords: [
      "کود گیاهان آپارتمانی",
      "نگهداری گیاه آپارتمانی",
      "کود مایع گلدان",
      "زرد شدن برگ",
      "تغذیه گیاهان خانگی",
      "آگروهوم",
    ],
    content: `
<h2>گیاه آپارتمانی بدون تغذیه، رشد نمی‌کند</h2>
<p>خاک گلدان مواد غذایی محدودی دارد. بعد از چند ماه، گیاه برای برگ‌دهی و مقاومت به نور کم خانه به کود مناسب نیاز پیدا می‌کند. کود بیش‌ازحد هم می‌تواند ریشه را بسوزاند؛ پس تعادل مهم است.</p>
<h2>اصول طلایی کوددهی گیاهان خانگی</h2>
<ul>
<li>در فصل رشد (بهار و تابستان) منظم‌تر کود دهید.</li>
<li>در پاییز و زمستان مقدار و دفعات را کم کنید.</li>
<li>کود را روی خاک خشک غلیظ نریزید؛ بهتر است رقیق و بعد از آبیاری سبک باشد.</li>
<li>گیاه تازه تعویض‌گلدان‌شده را چند هفته بدون کود قوی نگه دارید.</li>
</ul>
<h2>علائم کمبود تغذیه</h2>
<ol>
<li>زرد شدن برگ‌های پایین</li>
<li>رشد کند یا فاصله زیاد بین برگ‌ها</li>
<li>کم‌رنگ شدن برگ‌های جدید</li>
<li>ریزش غنچه در گیاهان گل‌دار آپارتمانی</li>
</ol>
<h2>انتخاب کود مناسب با آگروهوم</h2>
<p>کودهای تخصصی گیاهان آپارتمانی آگروهوم بدون بوی بد، مناسب فضای خانه و با فرمولاسیون ملایم برای گلدان طراحی شده‌اند. با تغذیه منظم و نور مناسب، گیاهان خانگی‌تان شاداب‌تر و مقاوم‌تر می‌مانند.</p>
<p>اگر بین چند گیاه مختلف شک دارید، از کود عمومی گیاهان آپارتمانی شروع کنید و بعد برای گونه‌های خاص مثل ارکیده یا سانسوریا به سراغ فرمول تخصصی بروید.</p>
`.trim(),
  },
];

async function main() {
  const parent = await prisma.blogCategory.findFirst({
    where: { slug: "tutorials" },
  });
  if (!parent) throw new Error("parent category tutorials not found");

  const categories = await prisma.blogCategory.findMany({
    where: { parentId: parent.id },
  });
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  for (const article of ARTICLES) {
    const category = bySlug.get(article.categorySlug);
    if (!category) {
      console.warn(`skip missing category ${article.categorySlug}`);
      continue;
    }

    const media =
      category.media && typeof category.media === "object"
        ? (category.media as { url?: string; alt?: string | null })
        : null;

    const blog = await prisma.blog.upsert({
      where: { slug: article.slug },
      create: {
        title: article.title,
        slug: article.slug,
        content: article.content,
        status: "published",
        media: media?.url
          ? { url: media.url, alt: media.alt || article.title }
          : undefined,
        categoryId: category.id,
      },
      update: {
        title: article.title,
        content: article.content,
        status: "published",
        media: media?.url
          ? { url: media.url, alt: media.alt || article.title }
          : undefined,
        categoryId: category.id,
      },
    });

    const targetPath = `/blog/${article.slug}`;
    const existingSeo = await prisma.seo.findFirst({
      where: {
        OR: [
          { targetPath },
          { targetType: "blog", targetLegacyId: blog.id },
        ],
      },
    });

    if (existingSeo) {
      await prisma.seo.update({
        where: { id: existingSeo.id },
        data: {
          targetPath,
          targetType: "blog",
          targetLegacyId: blog.id,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          metaKeyWords: article.keywords,
          canonicalUrl: targetPath,
        },
      });
    } else {
      await prisma.seo.create({
        data: {
          targetPath,
          targetType: "blog",
          targetLegacyId: blog.id,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          metaKeyWords: article.keywords,
          canonicalUrl: targetPath,
        },
      });
    }

    // category SEO too
    const catPath = `/blogs/${category.slug}`;
    const catSeo = await prisma.seo.findFirst({
      where: {
        OR: [
          { targetPath: catPath },
          { targetType: "blog_category", targetLegacyId: category.id },
        ],
      },
    });
    const catMetaTitle = `${category.title} | راهنمای کود و نگهداری | آگروهوم`;
    const catMetaDescription = `مقالات و راهنمای تخصصی ${category.title}. نکات کوددهی، آبیاری و نگهداری از آگروهوم.`;
    if (catSeo) {
      await prisma.seo.update({
        where: { id: catSeo.id },
        data: {
          targetPath: catPath,
          targetType: "blog_category",
          targetLegacyId: category.id,
          metaTitle: catMetaTitle,
          metaDescription: catMetaDescription,
          metaKeyWords: [category.title, "کود", "نگهداری گیاه", "آگروهوم"],
          canonicalUrl: catPath,
        },
      });
    } else {
      await prisma.seo.create({
        data: {
          targetPath: catPath,
          targetType: "blog_category",
          targetLegacyId: category.id,
          metaTitle: catMetaTitle,
          metaDescription: catMetaDescription,
          metaKeyWords: [category.title, "کود", "نگهداری گیاه", "آگروهوم"],
          canonicalUrl: catPath,
        },
      });
    }

    console.log(`OK ${category.slug} -> /blog/${blog.slug}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
