import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const before = await prisma.blog.groupBy({ by: ["status"], _count: true });
const result = await prisma.blog.updateMany({
  where: { status: "draft" },
  data: { status: "published" },
});
const after = await prisma.blog.groupBy({ by: ["status"], _count: true });

console.log("before", before);
console.log("updated", result.count);
console.log("after", after);

await prisma.$disconnect();
