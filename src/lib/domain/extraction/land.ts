export const landClassValues = [
  "agricultural",
  "irrigated",
  "rainfed",
  "forest",
  "grazing",
  "uncultivable",
  "government",
  "institutional",
  "non_agricultural",
] as const;

export type LandClass = (typeof landClassValues)[number];

export const landClassLabels: Record<LandClass, string> = {
  agricultural: "Agricultural",
  irrigated: "Irrigated / bagayat",
  rainfed: "Rainfed / jirayat",
  forest: "Forest",
  grazing: "Grazing",
  uncultivable: "Uncultivable",
  government: "Government",
  institutional: "Institutional / inam",
  non_agricultural: "Non-agricultural",
};

const agriculturalClasses = new Set<LandClass>([
  "agricultural",
  "irrigated",
  "rainfed",
]);

const matchers: Array<{ landClass: LandClass; pattern: RegExp }> = [
  { landClass: "forest", pattern: /forest|वन|जंगल|अभयारण्य/i },
  {
    landClass: "government",
    pattern: /government|govt\.?|सरकारी|शासकीय/i,
  },
  {
    landClass: "non_agricultural",
    pattern:
      /non[\s-]?agricultur|गैर\s*शेती|गैरशेती|बिनशेती|अकृषक|निवासी|रहिवासी|residential|commercial|industrial|व्यापारी|औद्योगिक/i,
  },
  { landClass: "grazing", pattern: /grazing|गायरान|चराई/i },
  {
    landClass: "uncultivable",
    pattern: /uncultivable|uncultivated|पोटखराब|खडकाळ/i,
  },
  {
    landClass: "institutional",
    pattern: /inam|इनाम|देवस्थान|वतन|trust|institution/i,
  },
  { landClass: "irrigated", pattern: /irrigated|बागायत/i },
  {
    landClass: "rainfed",
    pattern: /rain[\s-]?fed|जिरायत|कोरडवाहू|dry\s*crop/i,
  },
  {
    landClass: "agricultural",
    pattern:
      /agricultur|farm(?:ing|land)?|शेती|कृषि|लागवड|भातशेती|paddy|पडीक|खारीक|फळबाग/i,
  },
];

export function classifyLand(value: string): LandClass | null {
  const text = value.trim();

  if (!text) return null;

  for (const matcher of matchers) {
    if (matcher.pattern.test(text)) return matcher.landClass;
  }

  return null;
}

export function isAgriculturalClass(landClass: LandClass | null) {
  return landClass ? agriculturalClasses.has(landClass) : false;
}

export function compareLandClasses(left: LandClass, right: LandClass) {
  if (left === right) return "match" as const;

  if (isAgriculturalClass(left) && isAgriculturalClass(right)) {
    return "possible_variant" as const;
  }

  return "mismatch" as const;
}
