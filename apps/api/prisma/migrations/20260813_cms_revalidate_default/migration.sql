-- Raise default ISR window for new CMS pages to 1 hour
ALTER TABLE "CmsPage" ALTER COLUMN "revalidateSeconds" SET DEFAULT 3600;
