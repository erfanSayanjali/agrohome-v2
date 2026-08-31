/**
 * Removes duplicate home-page CMS blocks, keeping only the 8 canonical blocks from snapshot.
 *
 * Usage: pnpm --filter @agrohome/api reset:home-blocks
 */
import "dotenv/config";
import { notifyCmsPagesRevalidate } from "../src/lib/cms-revalidate";
import { prisma } from "../src/lib/prisma";
import snapshot from "../src/seeds/data/snapshot.json";

const HOME_PAGE_ID = "cmsmx2ei8000170udndvfchlt";

const canonicalIds = snapshot.contentBlocks
  .filter((block) => block.pageId === HOME_PAGE_ID)
  .map((block) => block.id);

async function main() {
  const existing = await prisma.contentBlock.findMany({
    where: { pageId: HOME_PAGE_ID },
    orderBy: { sortOrder: "asc" },
    select: { id: true, type: true, name: true, sortOrder: true },
  });

  const extras = existing.filter((block) => !canonicalIds.includes(block.id));
  if (!extras.length) {
    console.log(`Home page already has ${existing.length} canonical block(s).`);
    return;
  }

  console.log(`Removing ${extras.length} duplicate home block(s):`);
  for (const block of extras) {
    console.log(`  - [${block.sortOrder}] ${block.type} (${block.name}) ${block.id}`);
  }

  await prisma.contentBlock.deleteMany({
    where: {
      pageId: HOME_PAGE_ID,
      id: { notIn: canonicalIds },
    },
  });

  await notifyCmsPagesRevalidate(["/"]);
  console.log(`Done. Home page now has ${canonicalIds.length} block(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
