/*
  Warnings:

  - Added the required column `updatedAt` to the `AnimeAlias` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnimeAliasSource" AS ENUM ('TITLE', 'MANUAL');

-- AlterTable
ALTER TABLE "AnimeAlias" ADD COLUMN     "source" "AnimeAliasSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
