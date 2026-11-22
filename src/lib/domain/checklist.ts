export const checklistRequirementValues = ["always", "depends"] as const;

export type ChecklistRequirement = (typeof checklistRequirementValues)[number];

export const checklistStatusValues = [
  "satisfied",
  "missing",
  "obtain",
  "not_applicable",
  "unconfirmed",
] as const;

export type ChecklistStatus = (typeof checklistStatusValues)[number];

export const checklistStatusLabels: Record<ChecklistStatus, string> = {
  satisfied: "Uploaded",
  missing: "Missing",
  obtain: "Obtain and upload",
  not_applicable: "Not applicable",
  unconfirmed: "Unconfirmed",
};

export const checklistStatusNotes: Record<ChecklistStatus, string> = {
  satisfied: "A copy is uploaded.",
  missing: "Not uploaded.",
  obtain: "Needed on the details entered and not uploaded.",
  not_applicable: "Not applicable on the details entered.",
  unconfirmed: "Whether this applies has not been established.",
};
