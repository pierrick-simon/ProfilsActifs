/*
  Warnings:

  - Added the required column `localisation` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "localisation" TEXT NOT NULL;
