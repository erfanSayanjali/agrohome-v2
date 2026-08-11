-- Drop CMS regions and add singleton SiteSettings

-- ContentBlock: drop region relation
ALTER TABLE "ContentBlock" DROP CONSTRAINT IF EXISTS "ContentBlock_regionId_fkey";
DROP INDEX IF EXISTS "ContentBlock_regionId_sortOrder_idx";
ALTER TABLE "ContentBlock" DROP COLUMN IF EXISTS "regionId";

-- Drop CmsRegion table
DROP TABLE IF EXISTS "CmsRegion";

-- Narrow BlockOwnerType to PAGE only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'BlockOwnerType'
  ) THEN
    CREATE TYPE "BlockOwnerType_new" AS ENUM ('PAGE');
    ALTER TABLE "ContentBlock"
      ALTER COLUMN "ownerType" DROP DEFAULT,
      ALTER COLUMN "ownerType" TYPE "BlockOwnerType_new"
        USING ('PAGE'::"BlockOwnerType_new");
    DROP TYPE "BlockOwnerType";
    ALTER TYPE "BlockOwnerType_new" RENAME TO "BlockOwnerType";
    ALTER TABLE "ContentBlock"
      ALTER COLUMN "ownerType" SET DEFAULT 'PAGE'::"BlockOwnerType";
  END IF;
END $$;

-- Site settings singleton
CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "id" TEXT NOT NULL,
  "logoUrl" TEXT,
  "faviconUrl" TEXT,
  "footerText" TEXT,
  "socialLinks" JSONB NOT NULL DEFAULT '[]',
  "footerLinkGroups" JSONB NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
