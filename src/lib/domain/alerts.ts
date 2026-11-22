export const alertLevelValues = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
  "review",
  "checked",
] as const;

export type AlertLevel = (typeof alertLevelValues)[number];

export const alertLevelLabels: Record<AlertLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  informational: "Informational",
  review: "Review",
  checked: "Checked",
};

export const professionalAdviceValues = [
  "none",
  "lawyer",
  "surveyor",
  "both",
] as const;

export type ProfessionalAdvice = (typeof professionalAdviceValues)[number];

export const professionalAdviceLabels: Record<ProfessionalAdvice, string> = {
  none: "No professional advice indicated.",
  lawyer: "A lawyer should review this.",
  surveyor: "A surveyor should check this.",
  both: "A lawyer and a surveyor should review this.",
};

export const alertLevelOrder: Record<AlertLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  review: 3,
  low: 4,
  informational: 5,
  checked: 6,
};
