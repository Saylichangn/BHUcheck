import type { DocumentType } from "@/lib/documents/types";
import type { FieldKey } from "@/lib/domain/fields";
import { fieldKeyValues } from "@/lib/domain/fields";
import type { AreaUnit } from "@/lib/investigations/types";
import { findArea } from "./area";
import { parseDate } from "./dates";
import { classifyLand } from "./land";
import {
  cleanValue,
  foldName,
  normalizeText,
  normalizedIdentifier,
  normalizedRegistration,
  toAsciiDigits,
} from "./normalize";

export type ExtractedFieldCandidate = {
  fieldKey: FieldKey;
  ordinal: number;
  value: string;
  normalizedValue: string | null;
  unit: AreaUnit | null;
  sourceText: string;
};

export type DocumentExtraction = {
  fields: ExtractedFieldCandidate[];
  notes: string[];
};

type LabelKeyword = {
  fieldKey: FieldKey;
  source: string;
};

const labelKeywords: LabelKeyword[] = [
  {
    fieldKey: "village",
    source: String.raw`मौजे|गाव|\bvillage\b`,
  },
  {
    fieldKey: "taluka",
    source: String.raw`तालुका|ता\.|\btaluka\b|\btal\b\.?`,
  },
  {
    fieldKey: "district",
    source: String.raw`जिल्हा|जिल्ला|जि\.|\bdistrict\b|\bdist\b\.?`,
  },
  {
    fieldKey: "survey_no",
    source: String.raw`सर्व्हे\s*(?:क्र\.?|क्रमांक)?|स\.?\s*नं\.?|भूमापन\s*(?:क्र\.?|क्रमांक)?|भूखंड\s*(?:क्र\.?|क्रमांक)?|गट\s*(?:क्र\.?|क्रमांक)?|\bsurvey\s*(?:no\.?|number)?|\bgat\s*(?:no\.?|number)?|\bcts\s*(?:no\.?|number)?|\bplot\s*(?:no\.?|number)?`,
  },
  {
    fieldKey: "area",
    source: String.raw`एकूण\s*क्षेत्र|क्षेत्रफळ|क्षेत्र|\btotal\s*area\b|\barea\b`,
  },
  {
    fieldKey: "owner_name",
    source: String.raw`मालकाचे\s*नाव|भोगवटादाराचे\s*नाव|खातेदाराचे\s*नाव|विक्रेत्याचे\s*नाव|मालक|भोगवटादार|खातेदार|विक्रेता|\bowner(?:'s)?\s*name\b|\bname\s*of\s*(?:the\s*)?owner\b|\bowner\b|\bseller\b`,
  },
  {
    fieldKey: "land_class",
    source: String.raw`भूमि\s*प्रकार|भूमी\s*प्रकार|जमिनीचा\s*प्रकार|जमीन\s*प्रकार|\bland\s*(?:class|type|classification)\b|\bclass\s*of\s*land\b`,
  },
  {
    fieldKey: "registration_no",
    source: String.raw`दस्त\s*नोंदणी\s*(?:क्र\.?|क्रमांक)?|नोंदणी\s*(?:क्र\.?|क्रमांक)|सनद\s*(?:क्र\.?|क्रमांक)?|\bregistration\s*(?:no\.?|number)?|\bregistered\s*document\s*(?:no\.?|number)?|\bdocument\s*(?:no\.?|number)\b`,
  },
  {
    fieldKey: "document_date",
    source: String.raw`दिनांक|दि\.|तारीख|\bdate\b|\bdated\b`,
  },
  {
    fieldKey: "other_rights",
    source: String.raw`इतर\s*हक्क|तसेच\s*हक्क|\bother\s*rights\b|\bencumbrance\b|बोजा`,
  },
];

type LabelHit = {
  fieldKey: FieldKey;
  start: number;
  end: number;
};

function findLabelHits(line: string): LabelHit[] {
  const hits: LabelHit[] = [];

  for (const keyword of labelKeywords) {
    const pattern = new RegExp(keyword.source, "gi");

    for (const match of line.matchAll(pattern)) {
      if (match.index === undefined) continue;

      hits.push({
        fieldKey: keyword.fieldKey,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  hits.sort(
    (left, right) =>
      left.start - right.start ||
      right.end - right.start - (left.end - left.start),
  );

  const kept: LabelHit[] = [];

  for (const hit of hits) {
    const overlaps = kept.some(
      (existing) => hit.start < existing.end && hit.end > existing.start,
    );

    if (!overlaps) kept.push(hit);
  }

  return kept;
}

function cleanLabelValue(value: string) {
  return cleanValue(value)
    .replace(/^[/,;]+/, "")
    .replace(/[/,;]+$/, "")
    .trim();
}

function hasDigits(value: string) {
  return /[\d०-९]/.test(value);
}

function hasLetters(value: string) {
  return (value.match(/\p{L}/gu) ?? []).length >= 2;
}

function normalizeOtherRights(value: string) {
  const lowered = toAsciiDigits(value).toLowerCase();

  if (
    /^(?:काही\s*नाही|नाही|none|nil|no\s+rights?|not\s+applicable|[-—]+)$/.test(
      lowered,
    )
  ) {
    return "none";
  }

  return lowered;
}

function makeCandidate(
  fieldKey: FieldKey,
  value: string,
  sourceText: string,
  fallbackUnit?: AreaUnit,
): ExtractedFieldCandidate | null {
  const cleaned = cleanLabelValue(value);

  if (!cleaned) return null;

  const base = {
    fieldKey,
    ordinal: 0,
    value: cleaned,
    normalizedValue: null as string | null,
    unit: null as AreaUnit | null,
    sourceText,
  };

  switch (fieldKey) {
    case "area": {
      if (!hasDigits(cleaned)) return null;

      const parsed = findArea(cleaned, fallbackUnit)?.area;

      if (!parsed) return base;

      return {
        ...base,
        value: parsed.raw,
        normalizedValue: String(parsed.squareMetres),
        unit: parsed.unit,
      };
    }
    case "document_date": {
      const parsed = parseDate(cleaned);

      if (!parsed) return null;

      return {
        ...base,
        value: parsed.raw,
        normalizedValue: parsed.iso,
      };
    }
    case "owner_name":
    case "village":
    case "taluka":
    case "district": {
      if (!hasLetters(cleaned)) return null;

      return { ...base, normalizedValue: foldName(cleaned) || null };
    }
    case "survey_no": {
      if (!hasDigits(cleaned)) return null;

      return {
        ...base,
        normalizedValue: normalizedIdentifier(cleaned) || null,
      };
    }
    case "registration_no": {
      if (!hasDigits(cleaned)) return null;

      return {
        ...base,
        normalizedValue: normalizedRegistration(cleaned) || null,
      };
    }
    case "land_class": {
      if (!hasLetters(cleaned)) return null;

      return {
        ...base,
        normalizedValue: classifyLand(cleaned),
      };
    }
    case "other_rights": {
      return {
        ...base,
        normalizedValue: normalizeOtherRights(cleaned),
      };
    }
  }
}

type TableRow = {
  surveyNo: string;
  area: string;
  ownerName: string;
  sourceText: string;
  unit: AreaUnit;
};

type TableResult = {
  headerIndex: number;
  endIndex: number;
  rows: TableRow[];
  skipped: number;
};

function headerAreaUnit(
  header: string,
  documentType: DocumentType,
): AreaUnit | undefined {
  if (/हे\.?\s*आर|hectare|\bha\b/i.test(header)) return "hectare";

  if (/एकर|acre/i.test(header) && !/गुंठा|guntha/i.test(header)) {
    return "acre";
  }

  if (documentType === "7_12" || documentType === "8a") return "hectare";

  return undefined;
}

function detectTable(
  lines: string[],
  documentType: DocumentType,
): TableResult | null {
  const headerIndex = lines.findIndex(
    (line) =>
      /भोगवटादार|खातेदार|\bowner\b/i.test(line) &&
      /क्षेत्र|\barea\b/i.test(line) &&
      /गट|स\.?\s*नं|भूखंड|\bsurvey\b|\bgat\b|\bcts\b|\bplot\b|\bsr\b/i.test(
        line,
      ),
  );

  if (headerIndex < 0) return null;

  const header = lines[headerIndex] ?? "";
  const unit = headerAreaUnit(header, documentType);
  const rows: TableRow[] = [];
  let endIndex = headerIndex;
  let skipped = 0;
  let misses = 0;

  for (
    let index = headerIndex + 1;
    index < lines.length && rows.length < 30;
    index += 1
  ) {
    const line = lines[index] ?? "";

    if (
      /^(?:इतर\s*हक्क|तसेच\s*हक्क|other\s*rights|encumbrance|फेरफार|म्युटेशन|mutation|जमीन\s*महसूल|एकूण\s*क्षेत्र|total\s*area)/i.test(
        line,
      )
    ) {
      break;
    }

    const match = /^\s*(\d{1,3})[).]?\s+(\S+)\s+(.+)$/u.exec(line);

    if (!match) {
      misses += 1;
      if (misses >= 2) break;
      continue;
    }

    const surveyNo = match[2] ?? "";
    const remainder = match[3] ?? "";
    const found = unit ? findArea(remainder, unit) : findArea(remainder);
    const ownerAfter =
      found
        ? cleanLabelValue(remainder.slice(found.index + found.length))
        : "";

    if (!hasDigits(surveyNo) || !found || !hasLetters(ownerAfter)) {
      misses += 1;
      skipped += 1;
      if (misses >= 2) break;
      continue;
    }

    rows.push({
      surveyNo,
      area: found.area.raw,
      ownerName: ownerAfter,
      sourceText: line.trim().slice(0, 1000),
      unit: found.area.unit,
    });

    endIndex = index;
    misses = 0;
  }

  return { headerIndex, endIndex, rows, skipped };
}

function extractFields(
  lines: string[],
  table: TableResult | null,
  documentType: DocumentType,
) {
  const fields: ExtractedFieldCandidate[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (table && index >= table.headerIndex && index <= table.endIndex) {
      continue;
    }

    const line = lines[index] ?? "";
    const hits = findLabelHits(line);

    for (let hitIndex = 0; hitIndex < hits.length; hitIndex += 1) {
      const hit = hits[hitIndex];
      const next = hits[hitIndex + 1];
      let value = cleanLabelValue(
        line.slice(hit.end, next ? next.start : line.length),
      );

      if (!value && hit.fieldKey === "other_rights") {
        const section: string[] = [];

        for (
          let cursor = index + 1;
          cursor < lines.length && section.length < 3;
          cursor += 1
        ) {
          const nextLine = lines[cursor] ?? "";

          if (!nextLine || findLabelHits(nextLine).length) break;
          if (table && cursor >= table.headerIndex && cursor <= table.endIndex) {
            break;
          }

          section.push(nextLine);
        }

        value = cleanLabelValue(section.join(" "));
      }

      if (!value) {
        const nextLine = lines[index + 1] ?? "";
        const inTable =
          table &&
          index + 1 >= table.headerIndex &&
          index + 1 <= table.endIndex;

        if (nextLine && !inTable && !findLabelHits(nextLine).length) {
          value = cleanLabelValue(nextLine);
        }
      }

      if (!value) continue;

      const candidate = makeCandidate(
        hit.fieldKey,
        value,
        line.trim().slice(0, 1000),
      );

      if (candidate) fields.push(candidate);
    }
  }

  if (table) {
    for (const row of table.rows) {
      const survey = makeCandidate(
        "survey_no",
        row.surveyNo,
        row.sourceText,
      );
      const area = makeCandidate("area", row.area, row.sourceText, row.unit);
      const owner = makeCandidate(
        "owner_name",
        row.ownerName,
        row.sourceText,
      );

      if (survey) fields.push(survey);
      if (area) fields.push(area);
      if (owner) fields.push(owner);
    }
  }

  if (
    documentType === "na_order" &&
    /non[\s-]?agricultur|गैर\s*शेती|गैरशेती|अकृषक/i.test(
      lines.join("\n"),
    )
  ) {
    const converted = makeCandidate(
      "land_class",
      "Non-agricultural",
      "Non-agricultural wording in the uploaded order",
    );

    if (converted) fields.push(converted);
  }

  if (documentType === "power_of_attorney") {
    return fields.filter((field) => field.fieldKey !== "owner_name");
  }

  return fields;
}

export function parseDocument(
  documentType: DocumentType,
  input: string,
): DocumentExtraction {
  const text = normalizeText(input);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { fields: [], notes: ["No text was found in this document."] };
  }

  const table = detectTable(lines, documentType);
  const candidates = extractFields(lines, table, documentType);
  const seen = new Set<string>();
  const unique: ExtractedFieldCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.fieldKey}|${
      candidate.normalizedValue ?? candidate.value.toLowerCase()
    }`;

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }

  const order = new Map(fieldKeyValues.map((key, index) => [key, index]));
  unique.sort(
    (left, right) =>
      (order.get(left.fieldKey) ?? 0) - (order.get(right.fieldKey) ?? 0),
  );

  const nextOrdinal = new Map<FieldKey, number>();
  const fields = unique.map((candidate) => {
    const ordinal = nextOrdinal.get(candidate.fieldKey) ?? 0;
    nextOrdinal.set(candidate.fieldKey, ordinal + 1);
    return { ...candidate, ordinal };
  });

  const notes: string[] = [];

  if (table && table.rows.length === 0 && table.skipped === 0) {
    notes.push(
      "The table in this document could not be read automatically. Check the document and add the fields manually.",
    );
  } else if (table && table.skipped > 0) {
    notes.push(
      "Some table rows could not be read. Check the extracted fields against the document.",
    );
  }

  if (fields.length === 0) {
    notes.push(
      "No fields were recognised automatically. Add fields manually or upload a clearer copy.",
    );
  }

  return { fields, notes: [...new Set(notes)] };
}
