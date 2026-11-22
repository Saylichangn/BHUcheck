export type RuleStatusItem = {
  key: string;
  label: string;
  status: "ran" | "skipped";
  reason: string | null;
};

type RuleInput = {
  documents: Array<{ type: string }>;
  claims: Array<{ id: string }>;
  comparisons: Array<{
    fieldKey: string;
    observations: Array<{ sourceId: string | null; sourceType: string }>;
  }>;
  intendedUse: string;
};

type RuleDefinition = {
  key: string;
  label: string;
  ready: (input: RuleInput) => boolean;
  reason: string;
};

const ruleDefinitions: RuleDefinition[] = [
  {
    key: "owner_name_comparison",
    label: "Owner name comparison",
    ready: (input) => comparisonReady(input, "owner_name"),
    reason: "Needs owner names from at least two sources.",
  },
  {
    key: "survey_number_comparison",
    label: "Survey number comparison",
    ready: (input) => comparisonReady(input, "survey_no"),
    reason:
      "Needs a survey number from a document and the investigation details.",
  },
  {
    key: "area_comparison",
    label: "Area comparison",
    ready: (input) => comparisonReady(input, "area"),
    reason: "Needs area values from at least two sources.",
  },
  {
    key: "registration_comparison",
    label: "Registration number comparison",
    ready: (input) => comparisonReady(input, "registration_no"),
    reason: "Needs registration numbers from at least two sources.",
  },
  {
    key: "seven_twelve_checks",
    label: "7/12 checks (freshness, other rights, land class)",
    ready: (input) => hasType(input, "7_12"),
    reason: "No 7/12 uploaded.",
  },
  {
    key: "eight_a_checks",
    label: "8A checks",
    ready: (input) => hasType(input, "8a"),
    reason: "No 8A uploaded.",
  },
  {
    key: "sale_deed_checks",
    label: "Sale deed checks",
    ready: (input) => hasType(input, "sale_deed"),
    reason: "No sale deed uploaded.",
  },
  {
    key: "mutation_checks",
    label: "Mutation after sale",
    ready: (input) =>
      hasType(input, "sale_deed") && hasType(input, "mutation_entry"),
    reason: "Needs a sale deed and a mutation entry.",
  },
  {
    key: "na_order_checks",
    label: "NA order checks",
    ready: (input) =>
      input.intendedUse === "agricultural" &&
      (hasType(input, "7_12") || hasType(input, "8a")),
    reason: "Needs agricultural land details from a 7/12 or 8A.",
  },
  {
    key: "power_of_attorney_checks",
    label: "Power of attorney checks",
    ready: (input) => hasType(input, "power_of_attorney"),
    reason: "No power of attorney uploaded.",
  },
  {
    key: "litigation_checks",
    label: "Litigation entry checks",
    ready: (input) => hasType(input, "litigation_search"),
    reason: "No litigation search uploaded.",
  },
  {
    key: "encumbrance_checks",
    label: "Encumbrance checks",
    ready: (input) => hasType(input, "encumbrance_certificate"),
    reason: "No encumbrance certificate uploaded.",
  },
  {
    key: "seller_statement_checks",
    label: "Seller statement checks",
    ready: (input) => input.claims.length > 0,
    reason: "No seller statement recorded.",
  },
];

function hasType(input: RuleInput, type: string) {
  return input.documents.some((document) => document.type === type);
}

function comparisonReady(input: RuleInput, fieldKey: string) {
  const field = input.comparisons.find((item) => item.fieldKey === fieldKey);

  if (!field) return false;

  return (
    new Set(
      field.observations
        .map((observation) => observation.sourceId)
        .filter((value): value is string => Boolean(value)),
    ).size >= 2
  );
}

export function describeAlertRules(input: RuleInput): RuleStatusItem[] {
  return ruleDefinitions.map((rule) => ({
    key: rule.key,
    label: rule.label,
    status: rule.ready(input) ? "ran" : "skipped",
    reason: rule.ready(input) ? null : rule.reason,
  }));
}
