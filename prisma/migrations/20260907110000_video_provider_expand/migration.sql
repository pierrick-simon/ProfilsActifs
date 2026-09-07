/*
  Expand step of the video-provider migration (see scripts/migrate-video-storage.ts).

  Adds the new provider-abstraction columns alongside the legacy `url` column, all
  nullable so this applies cleanly to a table that already has rows. Existing rows are
  backfilled by the data script, then the contract migration
  (20260907110100_video_provider_contract) makes these columns required and drops `url`.
*/

-- CreateEnum
CREATE TYPE "VideoProcessingStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "video" ADD COLUMN "provider" TEXT;
ALTER TABLE "video" ADD COLUMN "providerId" TEXT;
ALTER TABLE "video" ADD COLUMN "status" "VideoProcessingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "video_providerId_key" ON "video"("providerId");
