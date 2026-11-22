-- CreateTable
CREATE TABLE "question_answers" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "questionKey" VARCHAR(60) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'unconfirmed',
    "sourcesJson" TEXT,
    "aiSummary" TEXT,
    "lookupAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_answers_investigationId_questionKey_key" ON "question_answers"("investigationId", "questionKey");

-- CreateIndex
CREATE INDEX "question_answers_investigationId_idx" ON "question_answers"("investigationId");

-- AddForeignKey
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
