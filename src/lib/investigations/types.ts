export const intendedUseValues = [
  "agricultural",
  "residential",
  "commercial",
  "industrial",
  "mixed",
  "other",
] as const;

export type IntendedUse = (typeof intendedUseValues)[number];

export const intendedUseLabels: Record<IntendedUse, string> = {
  agricultural: "Agricultural",
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  mixed: "Mixed use",
  other: "Other",
};

export const propertyTypeValues = ["plot", "farmland", "flat"] as const;

export type PropertyType = (typeof propertyTypeValues)[number];

export const propertyTypeLabels: Record<PropertyType, string> = {
  plot: "Plot / land",
  farmland: "Farmland",
  flat: "Flat / apartment",
};

export const areaUnitValues = [
  "sq_ft",
  "sq_m",
  "guntha",
  "are",
  "hectare",
  "acre",
] as const;

export type AreaUnit = (typeof areaUnitValues)[number];

export const areaUnitLabels: Record<AreaUnit, string> = {
  sq_ft: "sq ft",
  sq_m: "sq m",
  guntha: "guntha",
  are: "are",
  hectare: "hectare",
  acre: "acre",
};
