-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Comment_publish_showOnHome_idx" ON "Comment"("publish", "showOnHome");
