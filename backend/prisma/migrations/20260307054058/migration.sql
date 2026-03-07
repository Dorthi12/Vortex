-- CreateEnum
CREATE TYPE "AIContentType" AS ENUM ('POST', 'ISSUE_REPORT', 'COMMENT');

-- CreateEnum
CREATE TYPE "AIModelType" AS ENUM ('SENTIMENT', 'PRIORITY', 'TOXICITY', 'CATEGORY_CLASSIFICATION', 'LANGUAGE_DETECTION', 'DUPLICATE_DETECTION', 'ENTITY_EXTRACTION', 'MISINFORMATION_DETECTION');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('WATER_SUPPLY', 'ROAD_DAMAGE', 'ELECTRICITY', 'STREET_LIGHTS', 'DRAINAGE_AND_SEWAGE', 'FLOODING', 'GARBAGE_COLLECTION', 'PUBLIC_TOILETS', 'HEALTHCARE', 'EDUCATION', 'PUBLIC_SAFETY', 'PUBLIC_TRANSPORT', 'AIR_POLLUTION', 'WATER_POLLUTION', 'CORRUPTION', 'GOVERNMENT_SCHEMES', 'AGRICULTURE', 'OTHERS');

-- CreateTable
CREATE TABLE "IssueReport" (
    "id" TEXT NOT NULL,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "contentType" "AIContentType" NOT NULL,
    "modelType" "AIModelType" NOT NULL,
    "postId" TEXT,
    "issueReportId" TEXT,
    "commentId" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "priorityScore" DOUBLE PRECISION,
    "toxicityScore" DOUBLE PRECISION,
    "urgencyScore" DOUBLE PRECISION,
    "impactScore" DOUBLE PRECISION,
    "detectedLanguage" TEXT,
    "issueCategory" "IssueCategory",
    "confidence" DOUBLE PRECISION,
    "extractedEntities" JSONB,
    "summary" TEXT,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIAnalysis_contentType_idx" ON "AIAnalysis"("contentType");

-- CreateIndex
CREATE INDEX "AIAnalysis_modelType_idx" ON "AIAnalysis"("modelType");

-- CreateIndex
CREATE INDEX "AIAnalysis_postId_idx" ON "AIAnalysis"("postId");

-- CreateIndex
CREATE INDEX "AIAnalysis_issueReportId_idx" ON "AIAnalysis"("issueReportId");

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_issueReportId_fkey" FOREIGN KEY ("issueReportId") REFERENCES "IssueReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
