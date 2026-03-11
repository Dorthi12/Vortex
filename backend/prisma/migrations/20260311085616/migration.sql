-- AlterTable
ALTER TABLE "IssueReport" ADD COLUMN     "assignedToId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Department" TEXT;

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
