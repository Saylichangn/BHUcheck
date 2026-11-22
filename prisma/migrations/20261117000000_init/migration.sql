-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" VARCHAR(120) NOT NULL,
    "state" VARCHAR(80) NOT NULL DEFAULT 'Maharashtra',
    "district" VARCHAR(120) NOT NULL,
    "taluka" VARCHAR(120),
    "village" VARCHAR(120),
    "surveyNo" VARCHAR(80),
    "intendedUse" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(80) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "pageCount" INTEGER,
    "extractionStatus" VARCHAR(40) NOT NULL DEFAULT 'pending',
    "extractedText" TEXT,
    "extractionNote" TEXT,
    "extractionError" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_fields" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldKey" VARCHAR(40) NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "unit" VARCHAR(20),
    "sourceText" TEXT,
    "provenance" VARCHAR(40) NOT NULL DEFAULT 'document_analysis',
    "userCorrected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "fieldKey" VARCHAR(40) NOT NULL,
    "sourceType" VARCHAR(20) NOT NULL,
    "sourceId" VARCHAR(40),
    "value" TEXT,
    "normalizedValue" TEXT,
    "unit" VARCHAR(20),
    "status" VARCHAR(30) NOT NULL,
    "note" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fieldKey" VARCHAR(40),
    "claimedValue" TEXT,
    "claimedUnit" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'unverified',
    "evidenceDocumentId" TEXT,
    "evidenceFieldId" TEXT,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "ruleKey" VARCHAR(40) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "tag" VARCHAR(60) NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidenceDocumentId" TEXT,
    "evidenceFieldId" TEXT,
    "evidenceValue" TEXT,
    "sourceLabel" VARCHAR(200) NOT NULL,
    "documentDate" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whyItMatters" TEXT NOT NULL,
    "nextStep" TEXT NOT NULL,
    "professionalAdvice" VARCHAR(20) NOT NULL DEFAULT 'none',

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "key" VARCHAR(60) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "authority" VARCHAR(200) NOT NULL,
    "groupLabel" VARCHAR(80) NOT NULL,
    "requirement" VARCHAR(20) NOT NULL,
    "guidanceOnly" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "status" VARCHAR(30) NOT NULL,
    "satisfiedByDocumentId" TEXT,
    "note" TEXT,
    "sourceSlug" VARCHAR(60),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "investigationId" TEXT,
    "action" VARCHAR(40) NOT NULL,
    "entityType" VARCHAR(40) NOT NULL,
    "entityId" VARCHAR(80),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "department" VARCHAR(200) NOT NULL,
    "whatItMayHold" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "automaticAccess" BOOLEAN NOT NULL DEFAULT false,
    "userAction" TEXT NOT NULL,
    "knownLimits" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_windowStart_key" ON "rate_limits"("key", "windowStart");

-- CreateIndex
CREATE INDEX "investigations_userId_updatedAt_idx" ON "investigations"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "documents_investigationId_uploadedAt_idx" ON "documents"("investigationId", "uploadedAt");

-- CreateIndex
CREATE INDEX "extracted_fields_documentId_fieldKey_idx" ON "extracted_fields"("documentId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "extracted_fields_documentId_fieldKey_ordinal_key" ON "extracted_fields"("documentId", "fieldKey", "ordinal");

-- CreateIndex
CREATE INDEX "comparisons_investigationId_fieldKey_idx" ON "comparisons"("investigationId", "fieldKey");

-- CreateIndex
CREATE INDEX "claims_investigationId_createdAt_idx" ON "claims"("investigationId", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_investigationId_level_idx" ON "alerts"("investigationId", "level");

-- CreateIndex
CREATE INDEX "checklist_items_investigationId_sortOrder_idx" ON "checklist_items"("investigationId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_investigationId_key_key" ON "checklist_items"("investigationId", "key");

-- CreateIndex
CREATE INDEX "reports_investigationId_generatedAt_idx" ON "reports"("investigationId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reports_investigationId_version_key" ON "reports"("investigationId", "version");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_investigationId_createdAt_idx" ON "audit_logs"("investigationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_fields" ADD CONSTRAINT "extracted_fields_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_evidenceFieldId_fkey" FOREIGN KEY ("evidenceFieldId") REFERENCES "extracted_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_evidenceFieldId_fkey" FOREIGN KEY ("evidenceFieldId") REFERENCES "extracted_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_satisfiedByDocumentId_fkey" FOREIGN KEY ("satisfiedByDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
