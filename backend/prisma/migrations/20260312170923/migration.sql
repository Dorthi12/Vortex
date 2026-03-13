-- CreateTable
CREATE TABLE "SentimentAnalysis" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "text" TEXT,
    "finalIssue" "IssueCategory",
    "confidence" DOUBLE PRECISION,
    "decidedBy" TEXT,
    "sentimentLabel" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "priorityScore" DOUBLE PRECISION,
    "wardNumber" TEXT,
    "assignedToDepartment" TEXT,
    "locations" JSONB,
    "textAnalysis" JSONB,
    "imageAnalysis" JSONB,
    "processedAt" TIMESTAMP(3),
    "nlpProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentimentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentimentAnalysis_postId_idx" ON "SentimentAnalysis"("postId");

-- CreateIndex
CREATE INDEX "SentimentAnalysis_finalIssue_idx" ON "SentimentAnalysis"("finalIssue");

-- CreateIndex
CREATE INDEX "SentimentAnalysis_priorityScore_idx" ON "SentimentAnalysis"("priorityScore");

-- AddForeignKey
ALTER TABLE "SentimentAnalysis" ADD CONSTRAINT "SentimentAnalysis_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
