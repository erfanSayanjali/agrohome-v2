import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const targets = await prisma.blog.findMany({
  where: { legacyId: null },
  select: { id: true, title: true, slug: true, createdAt: true },
  orderBy: { createdAt: "asc" },
});

console.log("seed blogs to delete:", targets.length);
for (const b of targets) {
  console.log(`  - ${b.title} (${b.slug})`);
}

const result = await prisma.blog.deleteMany({ where: { legacyId: null } });

const remaining = await prisma.blog.count();
const legacy = await prisma.blog.count({ where: { legacyId: { not: null } } });

console.log("\ndeleted:", result.count);
console.log("remaining blogs:", remaining, "(legacy:", legacy + ")");

await prisma.$disconnect();
