/*
  Contract step of the video-provider migration.

  Do not apply this until scripts/migrate-video-storage.ts has been run against this
  database and reports zero remaining rows with a NULL "providerId" — this migration
  makes "provider"/"providerId" required and removes the legacy "url" column entirely.
*/

-- AlterTable
ALTER TABLE "video" ALTER COLUMN "provider" SET NOT NULL;
ALTER TABLE "video" ALTER COLUMN "providerId" SET NOT NULL;
ALTER TABLE "video" DROP COLUMN "url";
