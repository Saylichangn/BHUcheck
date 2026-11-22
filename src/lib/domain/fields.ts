export const fieldKeyValues = [
  "owner_name",
  "survey_no",
  "village",
  "taluka",
  "district",
  "area",
  "land_class",
  "registration_no",
  "document_date",
  "other_rights",
] as const;

export type FieldKey = (typeof fieldKeyValues)[number];

export const fieldLabels: Record<FieldKey, string> = {
  owner_name: "Owner name",
  survey_no: "Survey / gat / CTS number",
  village: "Village",
  taluka: "Taluka",
  district: "District",
  area: "Area",
  land_class: "Land classification",
  registration_no: "Registration number",
  document_date: "Document date",
  other_rights: "Other rights (7/12)",
};

export function isFieldKey(value: string): value is FieldKey {
  return (fieldKeyValues as readonly string[]).includes(value);
}

export const comparableFieldKeys = [
  "owner_name",
  "survey_no",
  "village",
  "taluka",
  "district",
  "area",
  "land_class",
  "registration_no",
] as const satisfies readonly FieldKey[];

export const referenceFieldKeys = [
  "document_date",
  "other_rights",
] as const satisfies readonly FieldKey[];

export const fieldKeysForClaims = [
  "owner_name",
  "survey_no",
  "village",
  "taluka",
  "district",
  "area",
  "land_class",
  "registration_no",
] as const satisfies readonly FieldKey[];
