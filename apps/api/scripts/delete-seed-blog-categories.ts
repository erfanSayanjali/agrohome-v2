import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const SLUGS = [
  "fazaye-sabz-hayat",
  "derakht-va-derakhtche",
  "gol-zeynati",
  "giyah-apartemani",
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const cats = await prisma.blogCategory.findMany({
  where: { slug: { in: SLUGS } },
  select: {
    id: true,
    title: true,
    slug: true,
    legacyId: true,
    _count: { select: { blogs: true, children: true } },
  },
});

console.log("found categories:", cats.length);
for (const c of cats) {
  console.log(`  ${c.slug} blogs=${c._count.blogs} children=${c._count.children} legacyId=${c.legacyId}`);
}

if (!cats.length) {
  console.log("nothing to delete");
  await prisma.$disconnect();
  process.exit(0);
}

const ids = cats.map((c) => c.id);

const unlinked = await prisma.blog.updateMany({
  where: { categoryId: { in: ids } },
  data: { categoryId: null },
});
console.log("unlinked blogs:", unlinked.count);

const deleted = await prisma.blogCategory.deleteMany({
  where: { id: { in: ids } },
});
console.log("deleted categories:", deleted.count);

await prisma.$disconnect();
