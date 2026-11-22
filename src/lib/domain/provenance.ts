export const provenanceValues = [
  "official_document",
  "document_analysis",
  "user_provided",
  "user_corrected",
  "ai_assisted",
  "unverified",
  "not_available",
] as const;

export type Provenance = (typeof provenanceValues)[number];

export const provenanceLabels: Record<Provenance, string> = {
  official_document: "Official document (uploaded)",
  document_analysis: "Document analysis",
  user_provided: "User-provided",
  user_corrected: "User-corrected",
  ai_assisted: "AI-assisted observation",
  unverified: "Unverified",
  not_available: "Not available",
};
