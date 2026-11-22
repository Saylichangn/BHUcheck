import type { FieldKey } from "@/lib/domain/fields";
import type { AreaUnit } from "@/lib/investigations/types";
import { areaUnitValues } from "@/lib/investigations/types";
import { compareAreas, parseArea } from "../extraction/area";
import { parseDate } from "../extraction/dates";
import {
  classifyLand,
  compareLandClasses,
  type LandClass,
} from "../extraction/land";
import {
  cleanValue,
  foldName,
  nameVerdict,
  normalizedIdentifier,
  normalizedRegistration,
  toAsciiDigits,
} from "../extraction/normalize";

export type NormalizedValue = {
  raw: string;
  normalized: string | null;
  unit: AreaUnit | null;
  squareMetres: number | null;
  landClass: LandClass | null;
  dateIso: string | null;
};

export type Agreement = "match" | "possible_variant" | "mismatch" | "unparsed";

const nameFields = new Set<FieldKey>([
  "owner_name",
  "village",
  "taluka",
  "district",
]);

export function isAreaUnit(value: string | null | undefined): value is AreaUnit {
  return Boolean(value && (areaUnitValues as readonly string[]).includes(value));
}

function emptyValue(raw: string): NormalizedValue {
  return {
    raw,
    normalized: null,
    unit: null,
    squareMetres: null,
    landClass: null,
    dateIso: null,
  };
}

export function normalizeFieldValue(
  fieldKey: FieldKey,
  rawValue: string,
  unit?: string | null,
): NormalizedValue {
  const raw = cleanValue(rawValue);

  if (!raw) return emptyValue(raw);

  switch (fieldKey) {
    case "area": {
      const parsed = parseArea(raw, isAreaUnit(unit) ? unit : undefined);

      if (!parsed) return emptyValue(raw);

      return {
        raw,
        normalized: String(parsed.squareMetres),
        unit: parsed.unit,
        squareMetres: parsed.squareMetres,
        landClass: null,
        dateIso: null,
      };
    }
    case "document_date": {
      const parsed = parseDate(raw);

      return {
        raw,
        normalized: parsed?.iso ?? null,
        unit: null,
        squareMetres: null,
        landClass: null,
        dateIso: parsed?.iso ?? null,
      };
    }
    case "land_class": {
      const landClass = classifyLand(raw);

      return {
        raw,
        normalized: landClass,
        unit: null,
        squareMetres: null,
        landClass,
        dateIso: null,
      };
    }
    case "owner_name":
    case "village":
    case "taluka":
    case "district": {
      const folded = foldName(raw);

      return {
        raw,
        normalized: folded || null,
        unit: null,
        squareMetres: null,
        landClass: null,
        dateIso: null,
      };
    }
    case "survey_no": {
      const normalized = normalizedIdentifier(raw);

      return {
        raw,
        normalized: normalized || null,
        unit: null,
        squareMetres: null,
        landClass: null,
        dateIso: null,
      };
    }
    case "registration_no": {
      const normalized = normalizedRegistration(raw);

      return {
        raw,
        normalized: normalized || null,
        unit: null,
        squareMetres: null,
        landClass: null,
        dateIso: null,
      };
    }
    case "other_rights": {
      const normalized = toAsciiDigits(raw).toLowerCase().replace(/\s+/g, " ");

      return {
        raw,
        normalized: normalized || null,
        unit: null,
        squareMetres: null,
        landClass: null,
        dateIso: null,
      };
    }
  }
}

export function compareFieldValues(
  fieldKey: FieldKey,
  left: NormalizedValue,
  right: NormalizedValue,
): Agreement {
  if (fieldKey === "area") {
    if (
      left.squareMetres === null ||
      right.squareMetres === null ||
      !left.unit ||
      !right.unit
    ) {
      return "unparsed";
    }

    return compareAreas(
      {
        value: 0,
        unit: left.unit,
        squareMetres: left.squareMetres,
        raw: left.raw,
      },
      {
        value: 0,
        unit: right.unit,
        squareMetres: right.squareMetres,
        raw: right.raw,
      },
    );
  }

  if (fieldKey === "land_class") {
    if (!left.landClass || !right.landClass) return "unparsed";

    return compareLandClasses(left.landClass, right.landClass);
  }

  if (!left.normalized || !right.normalized) return "unparsed";

  if (nameFields.has(fieldKey)) {
    return nameVerdict(left.raw, right.raw);
  }

  return left.normalized === right.normalized ? "match" : "mismatch";
}
