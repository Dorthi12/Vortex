/*
  Warnings:

  - Made the column `profileImageUrl` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "profileImageUrl" SET NOT NULL,
ALTER COLUMN "profileImageUrl" SET DEFAULT 'https://res.cloudinary.com/djd94qxqr/image/upload/v1772806569/logo_jee7na.png';
