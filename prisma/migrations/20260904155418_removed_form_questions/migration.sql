/*
  Warnings:

  - You are about to drop the column `archived` on the `formResponse` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `formResponse` table. All the data in the column will be lost.
  - You are about to drop the `question` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `formVersionId` to the `formResponse` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "formResponse" DROP CONSTRAINT "formResponse_questionId_fkey";

-- AlterTable
ALTER TABLE "formResponse" DROP COLUMN "archived",
DROP COLUMN "updatedAt",
ADD COLUMN     "formVersionId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "question";
