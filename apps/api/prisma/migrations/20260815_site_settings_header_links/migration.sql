-- Header nav links on SiteSettings singleton
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "headerLinks" JSONB NOT NULL DEFAULT '[]';

UPDATE "SiteSettings"
SET "headerLinks" = '[
  {"title":"صفحه اصلی","href":"/"},
  {"title":"محصولات","href":"/products"},
  {"title":"وبلاگ","href":"/blogs"},
  {"title":"درباره ما","href":"/about"},
  {"title":"تماس با ما","href":"/contact"}
]'::jsonb
WHERE "id" = 'default'
  AND (
    "headerLinks" IS NULL
    OR "headerLinks" = '[]'::jsonb
  );
