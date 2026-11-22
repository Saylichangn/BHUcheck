-- AlterTable
ALTER TABLE "alerts"
ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'rule',
ADD COLUMN "claimId" TEXT,
ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "alerts_investigationId_ruleKey_claimId_key" ON "alerts"("investigationId", "ruleKey", "claimId");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;
