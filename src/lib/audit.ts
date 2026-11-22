import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type AuditEntry = {
  userId: string;
  investigationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonObject;
};

export async function writeAuditLog(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        investigationId: entry.investigationId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    console.error(`Audit log write failed for ${entry.action}.`, error);
  }
}
