/*
  Warnings:

  - You are about to drop the column `City` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Department` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `State` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "City",
DROP COLUMN "Department",
DROP COLUMN "State",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "state" TEXT;
