-- AlterEnum
ALTER TYPE "ThemePreference" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "themePreference" SET DEFAULT 'SYSTEM';
