/**
 * Preuve de stabilité du tri du catalogue de profils (recruteur).
 *
 * Parcourt deux fois de suite l'intégralité du catalogue (profils validés,
 * mêmes conditions que GET /api/videos vu par un recruteur) avec l'ORDER BY
 * réellement utilisé en production (voir lib/catalog.ts, mêmes fonctions
 * importées ici — pas une réimplémentation séparée). Écrit la liste des
 * identifiants obtenue à chaque parcours dans un fichier, puis compare les
 * deux : elles doivent être identiques, sans doublon, sans manquant, et
 * compter exactement le nombre de profils validés en base.
 *
 * Usage : npm run verify:catalog-order
 */
import "dotenv/config";
import { writeFile } from "fs/promises";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/prisma/client";
import { CATALOG_ORDER_BY, catalogCursorWhere, type CatalogCursor } from "../lib/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PAGE_SIZE = 20;
const OUTPUT_DIR = path.join(process.cwd(), "docs");

async function walkCatalogOnce(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: CatalogCursor | null = null;

  for (;;) {
    const rows: Array<{ id: string; user: { updatedAt: Date } }> = await prisma.video.findMany({
      where: { validated: true, ...catalogCursorWhere(cursor) },
      orderBy: CATALOG_ORDER_BY,
      take: PAGE_SIZE + 1,
      select: { id: true, user: { select: { updatedAt: true } } },
    });

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    ids.push(...page.map((row) => row.id));

    if (!hasMore) {
      break;
    }
    cursor = { u: page[page.length - 1].user.updatedAt.toISOString(), id: page[page.length - 1].id };
  }

  return ids;
}

async function main() {
  // Deux parcours séquentiels (pas en parallèle) : on veut deux exécutions
  // indépendantes dans le temps, comme le ferait un recruteur qui recharge la
  // page, pas deux requêtes concurrentes sur la même connexion.
  const run1 = await walkCatalogOnce();
  const run2 = await walkCatalogOnce();
  const totalValidated = await prisma.video.count({ where: { validated: true } });

  const file1 = path.join(OUTPUT_DIR, "catalog-order-run-1.txt");
  const file2 = path.join(OUTPUT_DIR, "catalog-order-run-2.txt");
  await writeFile(file1, run1.join("\n") + "\n", "utf8");
  await writeFile(file2, run2.join("\n") + "\n", "utf8");

  const uniqueRun1 = new Set(run1);
  const uniqueRun2 = new Set(run2);
  const sameOrder = run1.length === run2.length && run1.every((id, i) => id === run2[i]);
  const noDuplicates = uniqueRun1.size === run1.length && uniqueRun2.size === run2.length;
  const matchesCount = run1.length === totalValidated && run2.length === totalValidated;

  console.log(`Profils validés en base : ${totalValidated}`);
  console.log(`Parcours 1 : ${run1.length} identifiant(s) -> ${file1}`);
  console.log(`Parcours 2 : ${run2.length} identifiant(s) -> ${file2}`);
  console.log(`Ordre identique entre les deux parcours : ${sameOrder ? "OUI" : "NON"}`);
  console.log(`Aucun doublon dans chaque parcours : ${noDuplicates ? "OUI" : "NON"}`);
  console.log(`Le nombre de profils correspond au COUNT(*) : ${matchesCount ? "OUI" : "NON"}`);

  if (!sameOrder || !noDuplicates || !matchesCount) {
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
