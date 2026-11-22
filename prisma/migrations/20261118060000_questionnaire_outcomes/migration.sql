-- AlterTable
ALTER TABLE "question_answers"
ADD COLUMN "note" TEXT,
ALTER COLUMN "status" SET DEFAULT 'unsure';

-- Migrate old questionnaire outcomes
UPDATE "question_answers"
SET "status" = 'unsure'
WHERE "status" IN ('done', 'unconfirmed');

-- AlterTable
ALTER TABLE "alerts"
ADD COLUMN "questionKey" VARCHAR(60);

-- CreateIndex
CREATE UNIQUE INDEX "alerts_investigationId_questionKey_key" ON "alerts"("investigationId", "questionKey");
