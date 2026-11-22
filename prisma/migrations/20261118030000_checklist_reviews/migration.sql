-- CreateTable
CREATE TABLE "checklist_reviews" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "requirementKey" VARCHAR(80) NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_reviews_investigationId_requirementKey_key" ON "checklist_reviews"("investigationId", "requirementKey");

-- CreateIndex
CREATE INDEX "checklist_reviews_investigationId_idx" ON "checklist_reviews"("investigationId");

-- AddForeignKey
ALTER TABLE "checklist_reviews" ADD CONSTRAINT "checklist_reviews_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
