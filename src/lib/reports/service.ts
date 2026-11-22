import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getInvestigationDetail } from "@/lib/investigations/service";
import { renderReportPdf } from "@/lib/reports/pdf";
import { deleteFile, readFile, saveFile, sha256Of } from "@/lib/storage/files";
import { reportStoragePath } from "@/lib/storage/paths";

export type ReportSummary = {
  id: string;
  version: number;
  fileName: string;
  sizeBytes: number;
  generatedAt: Date;
};

function reportFileName(nickname: string, version: number) {
  const base =
    nickname
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140) || "investigation";

  return `${base} report v${version}.pdf`;
}

export async function generateReport(input: {
  userId: string;
  investigationId: string;
}): Promise<ReportSummary | null> {
  const investigation = await getInvestigationDetail(
    input.userId,
    input.investigationId,
  );

  if (!investigation) return null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latest = await prisma.report.aggregate({
      where: { investigationId: investigation.id },
      _max: { version: true },
    });
    const version = (latest._max.version ?? 0) + 1;
    const id = randomUUID();
    const generatedAt = new Date();
    const pdf = await renderReportPdf({
      investigation,
      version,
      generatedAt,
    });
    const storagePath = reportStoragePath({
      userId: input.userId,
      investigationId: investigation.id,
      reportId: id,
    });

    await saveFile(storagePath, pdf);

    try {
      const report = await prisma.report.create({
        data: {
          id,
          investigationId: investigation.id,
          version,
          fileName: reportFileName(investigation.nickname, version),
          storagePath,
          sizeBytes: pdf.byteLength,
          sha256: sha256Of(pdf),
          generatedAt,
        },
        select: {
          id: true,
          version: true,
          fileName: true,
          sizeBytes: true,
          generatedAt: true,
        },
      });

      await writeAuditLog({
        userId: input.userId,
        investigationId: investigation.id,
        action: "report.generate",
        entityType: "report",
        entityId: report.id,
        metadata: { version, sizeBytes: pdf.byteLength },
      });

      return report;
    } catch (error) {
      await deleteFile(storagePath);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("A report version could not be assigned.");
}

export async function getReportFile(userId: string, reportId: string) {
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      investigation: { userId },
    },
    select: {
      fileName: true,
      storagePath: true,
    },
  });

  if (!report) return null;

  try {
    const data = await readFile(report.storagePath);

    return { ...report, data };
  } catch {
    return null;
  }
}
