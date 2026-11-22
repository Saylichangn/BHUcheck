import type { AreaUnit } from "@/lib/investigations/types";
import { normalizeText, toAsciiDigits } from "./normalize";

export const squareMetresPerUnit: Record<AreaUnit, number> = {
  sq_ft: 0.09290304,
  sq_m: 1,
  guntha: 101.17141056,
  are: 100,
  hectare: 10000,
  acre: 4046.8564224,
};

const numberPattern = String.raw`\d+(?:[.,]\d+)?`;

const unitMatchers: Array<{ unit: AreaUnit; source: string }> = [
  {
    unit: "sq_ft",
    source: String.raw`(?:sq\.?\s*ft\.?|sqft|square\s*(?:fe{1,2}t|foot)|चौ\.?\s*फू\.?|चौरस\s*फूट)`,
  },
  {
    unit: "sq_m",
    source: String.raw`(?:sq\.?\s*m\.?|sqm|square\s*met(?:er|re)s?|चौ\.?\s*मी\.?|चौरस\s*मीटर)`,
  },
  {
    unit: "hectare",
    source: String.raw`(?:hectares?|hect\.?|\bha\b\.?|हेक्टर|हे\.?\s*आर\.?|हे)`,
  },
  { unit: "acre", source: String.raw`(?:acres?|एकर)` },
  { unit: "guntha", source: String.raw`(?:gunthas?|gunta|गुंठा|गुंठे)` },
  { unit: "are", source: String.raw`(?:ares?|आर)` },
];

const hectareArePattern = new RegExp(
  String.raw`(${numberPattern})\s*(?:hectares?|hect\.?|\bh\b\.?|हेक्टर|हे)\.?\s*(${numberPattern})\s*(?:ares?|\br\b\.?|आर)\.?`,
  "i",
);

const acreGunthaPattern = new RegExp(
  String.raw`(${numberPattern})\s*(?:acres?|एकर|\ba\b\.?)\s*(${numberPattern})\s*(?:gunthas?|gunta|गुंठा|गुंठे|\bg\b\.?)\s*\.?`,
  "i",
);

export type ParsedArea = {
  value: number;
  unit: AreaUnit;
  squareMetres: number;
  raw: string;
};

export type FoundArea = {
  area: ParsedArea;
  index: number;
  length: number;
};

function toNumber(value: string) {
  return Number(value.replace(/,/g, ""));
}

function buildArea(value: number, unit: AreaUnit, raw: string): ParsedArea | null {
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000) {
    return null;
  }

  const squareMetres = value * squareMetresPerUnit[unit];

  return {
    value,
    unit,
    squareMetres,
    raw,
  };
}

export function findArea(
  input: string,
  fallbackUnit?: AreaUnit,
): FoundArea | null {
  const text = toAsciiDigits(normalizeText(input));

  if (!text) return null;

  const hectareAre = hectareArePattern.exec(text);

  if (hectareAre) {
    const value =
      toNumber(hectareAre[1] ?? "0") + toNumber(hectareAre[2] ?? "0") / 100;
    const area = buildArea(value, "hectare", hectareAre[0]);

    if (area) {
      return { area, index: hectareAre.index, length: hectareAre[0].length };
    }
  }

  const acreGuntha = acreGunthaPattern.exec(text);

  if (acreGuntha) {
    const value =
      toNumber(acreGuntha[1] ?? "0") +
      toNumber(acreGuntha[2] ?? "0") / 40;

    const area = buildArea(value, "acre", acreGuntha[0]);

    if (area) {
      return { area, index: acreGuntha.index, length: acreGuntha[0].length };
    }
  }

  for (const matcher of unitMatchers) {
    const follows = new RegExp(
      `(${numberPattern})\\s*(?:${matcher.source})`,
      "i",
    ).exec(text);

    if (follows) {
      const area = buildArea(
        toNumber(follows[1] ?? "0"),
        matcher.unit,
        follows[0],
      );

      if (area) {
        return { area, index: follows.index, length: follows[0].length };
      }
    }

    const precedes = new RegExp(
      `(?:${matcher.source})\\s*[:\\-]?\\s*(${numberPattern})`,
      "i",
    ).exec(text);

    if (precedes) {
      const valueIndex = precedes[0].lastIndexOf(precedes[1] ?? "");

      if (valueIndex >= 0) {
        const area = buildArea(
          toNumber(precedes[1] ?? "0"),
          matcher.unit,
          precedes[0],
        );

        if (area) {
          return {
            area,
            index: precedes.index,
            length: precedes[0].length,
          };
        }
      }
    }
  }

  if (!fallbackUnit) return null;

  const bare = new RegExp(numberPattern).exec(text);

  if (!bare) return null;

  const area = buildArea(toNumber(bare[0]), fallbackUnit, bare[0]);

  return area ? { area, index: bare.index, length: bare[0].length } : null;
}

export function parseArea(input: string, fallbackUnit?: AreaUnit) {
  return findArea(input, fallbackUnit)?.area ?? null;
}

export function compareAreas(left: ParsedArea, right: ParsedArea) {
  const largest = Math.max(left.squareMetres, right.squareMetres);
  const difference = Math.abs(left.squareMetres - right.squareMetres);
  const matchTolerance = Math.max(0.5, largest * 0.01);
  const variantTolerance = Math.max(1, largest * 0.05);

  if (difference <= matchTolerance) return "match" as const;
  if (difference <= variantTolerance) return "possible_variant" as const;
  return "mismatch" as const;
}
