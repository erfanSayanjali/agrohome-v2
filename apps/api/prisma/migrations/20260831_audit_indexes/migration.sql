-- Audit performance indexes

CREATE INDEX IF NOT EXISTS "OtpChallenge_phone_consumed_expiresAt_idx" ON "OtpChallenge"("phone", "consumed", "expiresAt");
CREATE INDEX IF NOT EXISTS "ProductCategory_parentId_publish_idx" ON "ProductCategory"("parentId", "publish");
CREATE INDEX IF NOT EXISTS "ProductTag_tagId_idx" ON "ProductTag"("tagId");
CREATE INDEX IF NOT EXISTS "BlogCategory_parentId_publish_idx" ON "BlogCategory"("parentId", "publish");
CREATE INDEX IF NOT EXISTS "Blog_status_createdAt_idx" ON "Blog"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Blog_categoryId_idx" ON "Blog"("categoryId");
CREATE INDEX IF NOT EXISTS "Comment_productId_publish_idx" ON "Comment"("productId", "publish");
CREATE INDEX IF NOT EXISTS "Comment_blogId_publish_idx" ON "Comment"("blogId", "publish");
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX IF NOT EXISTS "Media_url_idx" ON "Media"("url");

CREATE UNIQUE INDEX IF NOT EXISTS "ProductSpecification_productId_specificationId_key" ON "ProductSpecification"("productId", "specificationId");
