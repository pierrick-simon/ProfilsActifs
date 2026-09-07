/**
 * Backfills legacy `video.url` rows (from before the video-provider abstraction) into
 * `provider` + `providerId` + `status`. Safe to run more than once: only rows where
 * `providerId IS NULL` are touched, so a second run is a no-op that still reports counts.
 *
 * Usage: npm run migrate:video-storage
 *
 * Must run after the expand migration (20260907110000_video_provider_expand) and before
 * the contract migration (20260907110100_video_provider_contract), while `url` still
 * exists and `provider`/`providerId` are still nullable. It talks to Postgres with raw
 * SQL on purpose: the generated Prisma Client is typed against the *final* schema (no
 * `url` field), which would make a normal Prisma query against the transitional column
 * shape impossible to express.
 */
import "dotenv/config";
import { stat } from "fs/promises";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/prisma/client";
import { UPLOADS_ROOT } from "../lib/storage";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const LEGACY_URL_PREFIX = "/api/media/videos/";

type LegacyRow = { id: string; url: string };

async function countRows() {
  const [{ total }] = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT count(*)::bigint AS total FROM "video"
  `;
  const [{ migrated }] = await prisma.$queryRaw<{ migrated: bigint }[]>`
    SELECT count(*)::bigint AS migrated FROM "video" WHERE "providerId" IS NOT NULL
  `;
  return { total: Number(total), migrated: Number(migrated) };
}

async function main() {
  const before = await countRows();
  console.log(
    `Avant migration : ${before.total} vidéo(s) au total, ${before.migrated} déjà migrée(s), ${
      before.total - before.migrated
    } à traiter.`,
  );

  const legacyRows = await prisma.$queryRaw<LegacyRow[]>`
    SELECT "id", "url" FROM "video" WHERE "providerId" IS NULL
  `;

  let migratedCount = 0;
  let skippedCount = 0;

  for (const row of legacyRows) {
    if (!row.url.startsWith(LEGACY_URL_PREFIX)) {
      console.warn(`  ! ${row.id}: url inattendue ("${row.url}"), ligne ignorée.`);
      skippedCount += 1;
      continue;
    }

    const filename = row.url.slice(LEGACY_URL_PREFIX.length);
    const onDisk = await stat(path.join(UPLOADS_ROOT, "videos", filename))
      .then(() => true)
      .catch(() => false);
    const status = onDisk ? "READY" : "FAILED";
    if (!onDisk) {
      console.warn(`  ! ${row.id}: fichier "${filename}" introuvable sur le disque, statut mis à FAILED.`);
    }

    await prisma.$executeRaw`
      UPDATE "video"
      SET "provider" = 'local', "providerId" = ${filename}, "status" = ${status}::"VideoProcessingStatus"
      WHERE "id" = ${row.id}
    `;
    migratedCount += 1;
  }

  const after = await countRows();
  console.log(
    `Après migration : ${after.total} vidéo(s) au total, ${after.migrated} migrée(s) (${migratedCount} traitée(s) à l'instant, ${skippedCount} ignorée(s)).`,
  );

  if (after.total - after.migrated > 0) {
    console.warn(
      `${after.total - after.migrated} ligne(s) restent non migrées — corrigez-les avant d'appliquer la migration 20260907110100_video_provider_contract.`,
    );
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
