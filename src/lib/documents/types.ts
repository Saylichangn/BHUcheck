export const documentTypeValues = [
  "7_12",
  "8a",
  "property_card",
  "mutation_entry",
  "sale_deed",
  "index_ii",
  "na_order",
  "power_of_attorney",
  "encumbrance_certificate",
  "search_report",
  "tax_receipt",
  "layout_approval",
  "building_permission",
  "occupancy_certificate",
  "society_documents",
  "heirship_certificate",
  "survey_map",
  "zoning_certificate",
  "rera_registration",
  "litigation_search",
  "other",
] as const;

export type DocumentType = (typeof documentTypeValues)[number];

export const documentTypeLabels: Record<DocumentType, string> = {
  "7_12": "7/12",
  "8a": "8A",
  property_card: "Property card",
  mutation_entry: "Mutation entry",
  sale_deed: "Sale deed",
  index_ii: "Index II",
  na_order: "NA order",
  power_of_attorney: "Power of Attorney",
  encumbrance_certificate: "Encumbrance certificate",
  search_report: "Title search report",
  tax_receipt: "Property tax receipt",
  layout_approval: "Layout approval",
  building_permission: "Building permission",
  occupancy_certificate: "Occupancy certificate",
  society_documents: "Society documents",
  heirship_certificate: "Heirship / succession document",
  survey_map: "Survey map",
  zoning_certificate: "Zoning / reservation certificate",
  rera_registration: "RERA registration",
  litigation_search: "Litigation search",
  other: "Other",
};

export function documentLabel(type: DocumentType) {
  return documentTypeLabels[type];
}

export function isDocumentType(value: string): value is DocumentType {
  return (documentTypeValues as readonly string[]).includes(value);
}

export const extractionStatusValues = [
  "pending",
  "extracted",
  "ocr",
  "empty",
  "failed",
] as const;

export type ExtractionStatus = (typeof extractionStatusValues)[number];

export const extractionStatusLabels: Record<ExtractionStatus, string> = {
  pending: "Processing",
  extracted: "Text read",
  ocr: "Read with OCR",
  empty: "No text read",
  failed: "Text not read",
};
