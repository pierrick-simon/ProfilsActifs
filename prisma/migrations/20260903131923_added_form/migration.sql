/*
  Warnings:

  - You are about to drop the `quiz` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'SELECT', 'RADIO', 'CHECKBOX', 'DATE');

-- CreateEnum
CREATE TYPE "ActivitySector" AS ENUM ('TECHNOLOGY', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'RETAIL', 'MANUFACTURING', 'CONSULTING', 'MEDIA', 'GOVERNMENT', 'OTHER');

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropIndex
DROP INDEX "like_identifier_idx";

-- DropIndex
DROP INDEX "message_identifier_idx";

-- DropIndex
DROP INDEX "video_identifier_idx";

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "accessTokenExpiresAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "refreshTokenExpiresAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "activitySector" "ActivitySector",
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "banExpires" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- DropTable
DROP TABLE "quiz";

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL,
    "options" JSONB,
    "order" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "formResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "userSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_name_key" ON "question"("name");

-- CreateIndex
CREATE INDEX "formResponse_userId_idx" ON "formResponse"("userId");

-- CreateIndex
CREATE INDEX "formResponse_questionId_idx" ON "formResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_name_key" ON "skill"("name");

-- CreateIndex
CREATE INDEX "userSkill_userId_idx" ON "userSkill"("userId");

-- CreateIndex
CREATE INDEX "userSkill_skillId_idx" ON "userSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "userSkill_userId_skillId_key" ON "userSkill"("userId", "skillId");

-- CreateIndex
CREATE INDEX "video_userId_idx" ON "video"("userId");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formResponse" ADD CONSTRAINT "formResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "formResponse" ADD CONSTRAINT "formResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userSkill" ADD CONSTRAINT "userSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "userSkill" ADD CONSTRAINT "userSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
