/*
  Warnings:

  - You are about to drop the column `url` on the `Media` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Media" DROP COLUMN "url",
ADD COLUMN     "awsS3ObjectKey" TEXT;
