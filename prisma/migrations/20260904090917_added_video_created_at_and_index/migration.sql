-- AlterTable
ALTER TABLE "video" ADD COLUMN     "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "video_createdAt_id_idx" ON "video"("createdAt" DESC, "id");
