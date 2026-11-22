import PDFDocument from "pdfkit";
import {
  professionalAdviceLabels,
  type ProfessionalAdvice,
} from "@/lib/domain/alerts";
import {
  checklistStatusLabels,
  type ChecklistStatus,
} from "@/lib/domain/checklist";
import { claimStatusLabels, type ClaimStatus } from "@/lib/domain/claims";
import {
  comparisonStatusLabels,
  type ComparisonStatus,
} from "@/lib/domain/engine/compare";
import { fieldLabels, isFieldKey } from "@/lib/domain/fields";
import {
  isQuestionnaireStatus,
  questionnaireQuestions,
  questionnaireStatusLabels,
  type QuestionnaireStatus,
} from "@/lib/domain/questionnaire";
import { governmentSources } from "@/lib/domain/sources";
import { fraudTagLabels, type FraudTag } from "@/lib/domain/tags";
import {
  documentTypeLabels,
  extractionStatusLabels,
  isDocumentType,
  type ExtractionStatus,
} from "@/lib/documents/types";
import { formatFileSize } from "@/lib/documents/file-types";
import { formatDate, formatDateTime } from "@/lib/format";
import type { InvestigationDetail } from "@/lib/investigations/service";
import {
  areaUnitLabels,
  intendedUseLabels,
  type AreaUnit,
} from "@/lib/investigations/types";
import { loadReportFonts } from "./fonts";

const headingFont = "Heading";
const headingDevanagariFont = "HeadingDevanagari";
const bodyFont = "Body";
const monoFont = "Mono";

const ink = "#211e19";
const muted = "#696155";
const rule = "#d8cfc0";
const ruleStrong = "#b4a894";

function registerFonts(
  document: PDFKit.PDFDocument,
  fonts: Awaited<ReturnType<typeof loadReportFonts>>,
) {
  for (const [name, data] of Object.entries(fonts)) {
    document.registerFont(name, data);
  }
}

const devanagariTest = /[\u0900-\u097F\u1CD0-\u1CFF\uA8E0-\uA8FF]/;

function pageBottom(document: PDFKit.PDFDocument) {
  return document.page.height - document.page.margins.bottom;
}

function contentWidth(document: PDFKit.PDFDocument) {
  return (
    document.page.width -
    document.page.margins.left -
    document.page.margins.right
  );
}

function ensureSpace(document: PDFKit.PDFDocument, height: number) {
  if (document.y + height > pageBottom(document)) {
    document.addPage();
  }
}

type MixedOptions = PDFKit.Mixins.TextOptions & {
  fontSize?: number;
  x?: number;
  y?: number;
};

function writeText(
  document: PDFKit.PDFDocument,
  value: string,
  options: MixedOptions = {},
) {
  const text = value.trim() ? value : "—";
  const { fontSize, x, y, ...textOptions } = options;

  document.font(bodyFont, fontSize);

  if (x !== undefined && y !== undefined) {
    document.text(text, x, y, textOptions);
  } else {
    document.text(text, textOptions);
  }
}

function writeHeading(
  document: PDFKit.PDFDocument,
  text: string,
  size: number,
) {
  document
    .font(devanagariTest.test(text) ? headingDevanagariFont : headingFont, size)
    .text(text);
}

function sectionHeading(document: PDFKit.PDFDocument, title: string) {
  ensureSpace(document, 46);
  document.moveDown(0.9);
  document.fillColor(ink);
  document.x = document.page.margins.left;
  writeHeading(document, title, 14);
  document.moveDown(0.2);
  const y = document.y;
  document
    .moveTo(document.page.margins.left, y)
    .lineTo(document.page.width - document.page.margins.right, y)
    .lineWidth(0.8)
    .strokeColor(ink)
    .stroke();
  document.moveDown(0.6);
}

function paragraph(
  document: PDFKit.PDFDocument,
  text: string,
  size = 9,
  color = ink,
) {
  const height = document.font(bodyFont, size).heightOfString(text, {
    width: contentWidth(document),
    lineGap: 2,
  });
  const fullPageHeight =
    document.page.height -
    document.page.margins.top -
    document.page.margins.bottom;

  if (height <= fullPageHeight) {
    ensureSpace(document, height);
  }

  document.fillColor(color);
  document.x = document.page.margins.left;
  writeText(document, text, {
    width: contentWidth(document),
    lineGap: 2,
    fontSize: size,
  });
  document.fillColor(color);
  document.moveDown(0.5);
}

type Column = {
  label: string;
  width: number;
};

function tableBodyHeight(
  document: PDFKit.PDFDocument,
  columns: Column[],
  rows: string[][],
  fontSize = 8.5,
) {
  return rows.reduce((total, row) => {
    const heights = row.map((cell, index) => {
      document.font(bodyFont, fontSize);
      return document.heightOfString(cell.trim() ? cell : "—", {
        width: (columns[index]?.width ?? 0) - 6,
        lineGap: 1,
      });
    });

    return total + Math.max(15, ...heights) + 7;
  }, 0);
}

function drawTable(
  document: PDFKit.PDFDocument,
  columns: Column[],
  rows: string[][],
) {
  const left = document.page.margins.left;
  const tableWidth = columns.reduce((total, column) => total + column.width, 0);
  const fontSize = 8.5;
  const tableHeight = tableBodyHeight(document, columns, rows, fontSize) + 17;
  const fullPageHeight =
    document.page.height -
    document.page.margins.top -
    document.page.margins.bottom;

  if (
    tableHeight > pageBottom(document) - document.y &&
    tableHeight <= fullPageHeight
  ) {
    document.addPage();
  }

  const drawHeader = (startY: number) => {
    let x = left;
    let y = startY;

    document.font(monoFont).fontSize(7.2).fillColor(muted);

    for (const column of columns) {
      document.text(column.label.toUpperCase(), x + 3, y, {
        width: column.width - 6,
        lineBreak: false,
      });
      x += column.width;
    }

    y += 12;
    document
      .moveTo(left, y)
      .lineTo(left + tableWidth, y)
      .lineWidth(0.8)
      .strokeColor(ink)
      .stroke();

    return y + 5;
  };

  let y = drawHeader(document.y);

  for (const row of rows) {
    const heights = row.map((cell, index) => {
      document.font(bodyFont, fontSize);
      return document.heightOfString(cell.trim() ? cell : "—", {
        width: (columns[index]?.width ?? 0) - 6,
        lineGap: 1,
      });
    });
    const rowHeight = Math.max(15, ...heights) + 6;

    if (y + rowHeight > pageBottom(document)) {
      document.addPage();
      y = drawHeader(document.page.margins.top);
    }

    let x = left;

    row.forEach((cell, index) => {
      const column = columns[index];

      if (!column) return;

      writeText(document, cell, {
        x: x + 3,
        y: y + 3,
        width: column.width - 6,
        lineGap: 1,
        fontSize,
      });
      x += column.width;
    });

    y += rowHeight;
    document
      .moveTo(left, y)
      .lineTo(left + tableWidth, y)
      .lineWidth(0.4)
      .strokeColor(rule)
      .stroke();
    y += 1;
  }

  document.x = left;
  document.y = y + 6;
}

function unitLabel(unit: string | null) {
  if (!unit) return "";
  return unit in areaUnitLabels ? areaUnitLabels[unit as AreaUnit] : unit;
}

function documentTypeLabel(type: string) {
  return isDocumentType(type) ? documentTypeLabels[type] : type;
}

function extractionLabel(status: string) {
  return status in extractionStatusLabels
    ? extractionStatusLabels[status as ExtractionStatus]
    : "Unknown";
}

function checklistGroups(items: InvestigationDetail["checklist"]) {
  const groups: Array<{
    label: string;
    items: InvestigationDetail["checklist"];
  }> = [];

  for (const item of items) {
    const last = groups[groups.length - 1];

    if (last && last.label === item.groupLabel) {
      last.items.push(item);
    } else {
      groups.push({ label: item.groupLabel, items: [item] });
    }
  }

  return groups;
}

const sourceNames = new Map(
  governmentSources.map((source) => [source.slug, source.name]),
);

function tagLabel(tag: string) {
  return tag in fraudTagLabels
    ? fraudTagLabels[tag as FraudTag]
    : tag.replaceAll("_", " ");
}

export type ReportRenderInput = {
  investigation: InvestigationDetail;
  version: number;
  generatedAt: Date;
};

export async function renderReportPdf(
  input: ReportRenderInput,
): Promise<Buffer> {
  const fonts = await loadReportFonts();

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: 46, bottom: 54, left: 48, right: 48 },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    try {
      registerFonts(document, fonts);

      const { investigation, version, generatedAt } = input;

      document.info.Title = `${investigation.nickname} — investigation report v${version}`;
      document.info.Author = "BHUcheck";
      document.info.Subject =
        "Property document investigation report. Not a title certificate.";

      document
        .font(monoFont)
        .fontSize(7.5)
        .fillColor(muted)
        .text("BHUCHECK · INVESTIGATION REPORT");
      document.moveDown(0.4);
      document.fillColor(ink);
      writeHeading(document, investigation.nickname, 22);

      const location = [
        investigation.village,
        investigation.taluka,
        investigation.district,
      ]
        .filter(Boolean)
        .join(", ");

      if (location) {
        document.moveDown(0.2);
        paragraph(document, location, 10, muted);
      }

      document.moveDown(0.2);
      document.font(monoFont).fontSize(8).fillColor(muted);
      document.text(
        `Version ${version} · generated ${formatDateTime(generatedAt)} · ${formatDate(
          investigation.createdAt,
        )} investigation`,
      );

      document.moveDown(0.6);
      const scope =
        "Scope: BHUcheck reads only the files and details entered in this investigation. It does not access government databases and does not certify title, ownership or legality. Every result is limited to the documents and details entered. Confirm any potential inconsistency with the issuing authority and a qualified professional. This report is not a clearance.";
      const scopeTop = document.y;
      document.font(bodyFont).fontSize(8.5);
      const scopeHeight = document.heightOfString(scope, {
        width: contentWidth(document) - 20,
        lineGap: 2,
      });
      document
        .rect(
          document.page.margins.left,
          scopeTop,
          contentWidth(document),
          scopeHeight + 18,
        )
        .lineWidth(0.6)
        .strokeColor(ruleStrong)
        .stroke();
      document
        .font(bodyFont)
        .fontSize(8.5)
        .fillColor(ink)
        .text(scope, document.page.margins.left + 10, scopeTop + 9, {
          width: contentWidth(document) - 20,
          lineGap: 2,
        });
      document.y = scopeTop + scopeHeight + 18;
      document.moveDown(0.6);

      sectionHeading(document, "Investigation details");
      drawTable(
        document,
        [
          { label: "Detail", width: 120 },
          { label: "Value", width: contentWidth(document) - 120 },
        ],
        [
          ["District", investigation.district],
          ["Taluka", investigation.taluka ?? "—"],
          ["Village or locality", investigation.village ?? "—"],
          ["Survey / gat / CTS", investigation.surveyNo ?? "—"],
          [
            "Intended use",
            intendedUseLabels[investigation.intendedUse] ??
              investigation.intendedUse,
          ],
          ["Created", formatDate(investigation.createdAt)],
          ["Last updated", formatDateTime(investigation.updatedAt)],
        ],
      );

      sectionHeading(document, "Documents");
      if (investigation.documents.length === 0) {
        paragraph(document, "No documents were uploaded.", 9, muted);
      } else {
        drawTable(
          document,
          [
            { label: "Type", width: 82 },
            { label: "File", width: 195 },
            { label: "Uploaded", width: 76 },
            { label: "Text", width: 78 },
            { label: "Values", width: 48 },
          ],
          investigation.documents.map((entry) => [
            documentTypeLabel(entry.type),
            `${entry.originalName}\n${formatFileSize(entry.sizeBytes)}${
              entry.pageCount
                ? ` · ${entry.pageCount} page${entry.pageCount === 1 ? "" : "s"}`
                : ""
            }`,
            formatDate(entry.uploadedAt),
            extractionLabel(entry.extractionStatus),
            String(entry.fields.length),
          ]),
        );
      }

      sectionHeading(document, "Comparison table");
      if (investigation.comparisons.length === 0) {
        paragraph(
          document,
          "No comparisons were available. Upload a document with readable values.",
          9,
          muted,
        );
      } else {
        drawTable(
          document,
          [
            { label: "Field", width: 118 },
            { label: "Result", width: 86 },
            { label: "Values found", width: contentWidth(document) - 204 },
          ],
          investigation.comparisons.map((field) => {
            const values = field.observations
              .map((observation) => {
                const normalized =
                  observation.normalizedValue &&
                  observation.normalizedValue !== observation.value
                    ? ` (normalized ${observation.normalizedValue})`
                    : "";

                return `${observation.sourceLabel}: ${observation.value}${
                  observation.unit ? ` ${observation.unit}` : ""
                }${normalized}`;
              })
              .join("\n");

            return [
              field.label,
              comparisonStatusLabels[field.status as ComparisonStatus] ??
                field.status,
              `${values}${field.note ? `\n${field.note}` : ""}`,
            ];
          }),
        );
      }
      paragraph(
        document,
        "A match means the extracted values agree after normalisation. It is not a verification of any document. A variation is a question to confirm with the issuing authority.",
        7.5,
        muted,
      );

      sectionHeading(document, "Seller statements");
      if (investigation.claims.length === 0) {
        paragraph(document, "No seller statements were recorded.", 9, muted);
      } else {
        drawTable(
          document,
          [
            { label: "Statement", width: 168 },
            { label: "Compared with", width: 70 },
            { label: "Stated", width: 70 },
            { label: "Result", width: 55 },
            { label: "Basis", width: contentWidth(document) - 363 },
          ],
          investigation.claims.map((claim) => [
            claim.text,
            claim.fieldKey && isFieldKey(claim.fieldKey)
              ? fieldLabels[claim.fieldKey]
              : "—",
            claim.claimedValue
              ? `${claim.claimedValue} ${unitLabel(claim.claimedUnit)}`.trim()
              : "—",
            claimStatusLabels[claim.status as ClaimStatus] ?? claim.status,
            claim.rationale ?? "No document value to compare.",
          ]),
        );
      }
      paragraph(
        document,
        "Supported means the uploaded documents agree with the statement. Contradicted means an extracted value differs. Neither result decides whether the statement is true.",
        7.5,
        muted,
      );

      sectionHeading(document, "Questionnaire");
      const answeredQuestions = investigation.questionAnswers.filter(
        (answer) => answer.status !== "unsure" || Boolean(answer.note?.trim()),
      );

      if (answeredQuestions.length === 0) {
        paragraph(
          document,
          "No questionnaire outcomes were recorded.",
          9,
          muted,
        );
      } else {
        drawTable(
          document,
          [
            { label: "Question", width: 150 },
            { label: "Outcome", width: 70 },
            { label: "Note", width: contentWidth(document) - 220 },
          ],
          answeredQuestions.map((answer) => {
            const question = questionnaireQuestions.find(
              (item) => item.key === answer.questionKey,
            );
            const status = isQuestionnaireStatus(answer.status)
              ? answer.status
              : "unsure";

            return [
              question?.text ?? answer.questionKey,
              questionnaireStatusLabels[status as QuestionnaireStatus],
              answer.note?.trim() || "—",
            ];
          }),
        );
      }

      sectionHeading(document, "Alerts");
      if (investigation.alerts.length === 0) {
        paragraph(
          document,
          "No alerts are recorded for this investigation. This is not a clearance. It does not establish that the title is clear, that a document is genuine, or that no other interest exists.",
          9,
          ink,
        );
      } else {
        for (const alert of investigation.alerts) {
          ensureSpace(document, 80);
          document
            .font(monoFont)
            .fontSize(7.2)
            .fillColor(muted)
            .text(
              `${alert.level.toUpperCase()} · ${tagLabel(alert.tag)} · ${alert.ruleKey}`,
            );
          document.moveDown(0.2).fillColor(ink);
          writeHeading(document, alert.title, 11);
          document.moveDown(0.2);
          paragraph(document, alert.explanation, 9, ink);

          document.font(monoFont).fontSize(7.2).fillColor(muted);
          document.text("WHY IT MATTERS");
          paragraph(document, alert.whyItMatters, 8.5, ink);

          document.font(monoFont).fontSize(7.2).fillColor(muted);
          document.text("NEXT STEP");
          paragraph(document, alert.nextStep, 8.5, ink);

          if (alert.professionalAdvice !== "none") {
            paragraph(
              document,
              `Professional review: ${
                professionalAdviceLabels[
                  alert.professionalAdvice as ProfessionalAdvice
                ] ?? alert.professionalAdvice
              }`,
              8,
              ink,
            );
          }

          paragraph(
            document,
            `Source: ${alert.sourceLabel}${
              alert.documentDate
                ? ` · document dated ${formatDate(alert.documentDate)}`
                : ""
            }${alert.evidenceValue ? ` · value: ${alert.evidenceValue}` : ""}`,
            7.5,
            muted,
          );

          document
            .moveTo(document.page.margins.left, document.y)
            .lineTo(
              document.page.width - document.page.margins.right,
              document.y,
            )
            .lineWidth(0.4)
            .strokeColor(rule)
            .stroke();
          document.moveDown(0.7);
        }
      }
      paragraph(
        document,
        "These are potential inconsistencies for confirmation with the issuing authority. They are not findings of forgery, fraud or a defective title.",
        7.5,
        muted,
      );

      const groups = checklistGroups(investigation.checklist);
      const checklistColumns: Column[] = [
        { label: "Requirement", width: 145 },
        { label: "Status", width: 64 },
        { label: "Authority", width: 95 },
        { label: "Note", width: contentWidth(document) - 304 },
      ];
      const checklistRows = (items: InvestigationDetail["checklist"]) =>
        items.map((item) => [
          `${item.label}${item.guidanceOnly ? " (guidance step)" : ""}`,
          checklistStatusLabels[item.status as ChecklistStatus] ?? item.status,
          item.authority,
          `${item.note}${
            item.sourceSlug
              ? `\nSource: ${sourceNames.get(item.sourceSlug) ?? item.sourceSlug}`
              : ""
          }`,
        ]);

      if (groups.length === 0) {
        sectionHeading(document, "Document checklist");
        paragraph(document, "The checklist was not built.", 9, muted);
      } else {
        const first = groups[0];

        if (first) {
          ensureSpace(
            document,
            tableBodyHeight(
              document,
              checklistColumns,
              checklistRows(first.items),
            ) + 80,
          );
        }

        sectionHeading(document, "Document checklist");

        for (const group of groups) {
          const rows = checklistRows(group.items);

          ensureSpace(
            document,
            tableBodyHeight(document, checklistColumns, rows) + 40,
          );
          document.fillColor(ink);
          writeHeading(document, group.label, 10.5);
          document.moveDown(0.3);

          drawTable(document, checklistColumns, rows);
        }
        paragraph(
          document,
          "Uploaded means a document of that type is present. It does not mean the document is genuine or sufficient. Guidance steps happen outside BHUcheck and are never marked complete here.",
          7.5,
          muted,
        );
      }

      const range = document.bufferedPageRange();

      for (
        let index = range.start;
        index < range.start + range.count;
        index += 1
      ) {
        document.switchToPage(index);
        const previousBottom = document.page.margins.bottom;
        document.page.margins.bottom = 18;
        document
          .font(monoFont)
          .fontSize(7)
          .fillColor(muted)
          .text(
            `BHUcheck · ${investigation.nickname} · report v${version} · page ${index + 1} of ${range.count}`,
            document.page.margins.left,
            document.page.height - 28,
            {
              width: contentWidth(document),
              align: "center",
              lineBreak: false,
            },
          );
        document.page.margins.bottom = previousBottom;
      }

      document.end();
    } catch (error) {
      reject(error);
    }
  });
}
