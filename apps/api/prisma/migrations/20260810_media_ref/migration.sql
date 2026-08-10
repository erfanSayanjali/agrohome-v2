-- Migrate string image fields to media JSON { url, alt }
-- Safe to re-run: only copies when media is null and old column exists.

DO $$
BEGIN
  -- User.imageUrl -> media
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'imageUrl'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'media'
    ) THEN
      ALTER TABLE "User" ADD COLUMN "media" JSONB;
    END IF;
    UPDATE "User"
    SET "media" = jsonb_build_object('url', "imageUrl", 'alt', NULL)
    WHERE "imageUrl" IS NOT NULL AND "media" IS NULL;
    ALTER TABLE "User" DROP COLUMN "imageUrl";
  END IF;

  -- Product.thumbnailUrl -> media
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'thumbnailUrl'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Product' AND column_name = 'media'
    ) THEN
      ALTER TABLE "Product" ADD COLUMN "media" JSONB;
    END IF;
    UPDATE "Product"
    SET "media" = jsonb_build_object('url', "thumbnailUrl", 'alt', NULL)
    WHERE "thumbnailUrl" IS NOT NULL AND "media" IS NULL;
    ALTER TABLE "Product" DROP COLUMN "thumbnailUrl";
  END IF;

  -- Blog.thumbnailUrl -> media
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Blog' AND column_name = 'thumbnailUrl'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Blog' AND column_name = 'media'
    ) THEN
      ALTER TABLE "Blog" ADD COLUMN "media" JSONB;
    END IF;
    UPDATE "Blog"
    SET "media" = jsonb_build_object('url', "thumbnailUrl", 'alt', NULL)
    WHERE "thumbnailUrl" IS NOT NULL AND "media" IS NULL;
    ALTER TABLE "Blog" DROP COLUMN "thumbnailUrl";
  END IF;

  -- BlogCategory.thumbnailUrl -> media
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BlogCategory' AND column_name = 'thumbnailUrl'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'BlogCategory' AND column_name = 'media'
    ) THEN
      ALTER TABLE "BlogCategory" ADD COLUMN "media" JSONB;
    END IF;
    UPDATE "BlogCategory"
    SET "media" = jsonb_build_object('url', "thumbnailUrl", 'alt', NULL)
    WHERE "thumbnailUrl" IS NOT NULL AND "media" IS NULL;
    ALTER TABLE "BlogCategory" DROP COLUMN "thumbnailUrl";
  END IF;
END $$;
