import { describe, expect, it } from "vitest";
import type { ComparisonInput } from "@/lib/domain/engine/compare";
import { buildComparisons } from "@/lib/domain/engine/compare";
import { evaluateClaims } from "@/lib/domain/engine/claims";
import { buildAlerts } from "@/lib/domain/engine/alerts";

function baseInput(): ComparisonInput {
  return {
    investigation: {
      surveyNo: "123/2",
      village: "Pune",
      taluka: "Haveli",
      district: "Pune",
      intendedUse: "agricultural",
    },
    documents: [
      {
        id: "doc-712",
        type: "7_12",
        originalName: "seven-twelve.pdf",
        uploadedAt: new Date("2026-06-20"),
        fields: [
          {
            id: "f-owner-1",
            fieldKey: "owner_name",
            ordinal: 0,
            value: "राम पाटील",
            unit: null,
            sourceText: "1 123/2 1.20 राम पाटील",
          },
          {
            id: "f-survey-1",
            fieldKey: "survey_no",
            ordinal: 0,
            value: "123/2",
            unit: null,
            sourceText: "1 123/2 1.20 राम पाटील",
          },
          {
            id: "f-village-1",
            fieldKey: "village",
            ordinal: 0,
            value: "पुणे",
            unit: null,
            sourceText: "गाव : पुणे",
          },
          {
            id: "f-area-1",
            fieldKey: "area",
            ordinal: 0,
            value: "1.20",
            unit: "hectare",
            sourceText: "1 123/2 1.20 राम पाटील",
          },
          {
            id: "f-land-1",
            fieldKey: "land_class",
            ordinal: 0,
            value: "Agricultural",
            unit: null,
            sourceText: "भूमि प्रकार : Agricultural",
          },
          {
            id: "f-rights-1",
            fieldKey: "other_rights",
            ordinal: 0,
            value: "काही नाही",
            unit: null,
            sourceText: "इतर हक्क : काही नाही",
          },
          {
            id: "f-date-1",
            fieldKey: "document_date",
            ordinal: 0,
            value: "15/06/2026",
            unit: null,
            sourceText: "दिनांक : १५/०६/२०२६",
          },
        ],
      },
      {
        id: "doc-deed",
        type: "sale_deed",
        originalName: "sale-deed.pdf",
        uploadedAt: new Date("2026-01-11"),
        fields: [
          {
            id: "f-owner-2",
            fieldKey: "owner_name",
            ordinal: 0,
            value: "Ram Patil",
            unit: null,
            sourceText: "Seller: Ram Patil",
          },
          {
            id: "f-survey-2",
            fieldKey: "survey_no",
            ordinal: 0,
            value: "Survey No. 123/2",
            unit: null,
            sourceText: "Survey No.: 123/2",
          },
          {
            id: "f-village-2",
            fieldKey: "village",
            ordinal: 0,
            value: "Pune",
            unit: null,
            sourceText: "Village: Pune",
          },
          {
            id: "f-area-2",
            fieldKey: "area",
            ordinal: 0,
            value: "1 hectare 20 are",
            unit: null,
            sourceText: "Area: 1 hectare 20 are",
          },
          {
            id: "f-land-2",
            fieldKey: "land_class",
            ordinal: 0,
            value: "Agricultural",
            unit: null,
            sourceText: "Land Class: Agricultural",
          },
          {
            id: "f-reg-1",
            fieldKey: "registration_no",
            ordinal: 0,
            value: "PUNE/1234/2026",
            unit: null,
            sourceText: "Registration No.: PUNE/1234/2026",
          },
          {
            id: "f-date-2",
            fieldKey: "document_date",
            ordinal: 0,
            value: "10/01/2026",
            unit: null,
            sourceText: "Date: 10/01/2026",
          },
        ],
      },
    ],
    claims: [],
  };
}

function alertsFor(
  input: ComparisonInput,
  now = new Date("2026-11-17T00:00:00Z"),
) {
  const comparison = buildComparisons(input);
  const claims = evaluateClaims(input, comparison);

  return buildAlerts({
    investigation: input.investigation,
    documents: input.documents,
    claims,
    comparison,
    now,
  });
}

describe("alert rules", () => {
  it("marks only fields that actually matched as checked", () => {
    const alerts = alertsFor(baseInput());

    expect(alerts.some((alert) => alert.level === "high")).toBe(false);
    expect(alerts.some((alert) => alert.level === "critical")).toBe(false);
    expect(alerts.some((alert) => alert.ruleKey === "owner_name_consistent")).toBe(
      true,
    );
    expect(alerts.some((alert) => alert.ruleKey === "no_rights_entry")).toBe(
      true,
    );
  });

  it("does not check a field that has only one source", () => {
    const input = baseInput();
    input.documents = [];
    const alerts = alertsFor(input);

    expect(alerts.some((alert) => alert.ruleKey === "survey_no_consistent")).toBe(
      false,
    );
    expect(
      alerts.some((alert) => alert.ruleKey === "owner_name_consistent"),
    ).toBe(false);
  });

  it("raises a high alert for an owner mismatch", () => {
    const input = baseInput();
    const deed = input.documents[1]!;
    deed.fields = deed.fields.map((field) =>
      field.fieldKey === "owner_name"
        ? { ...field, value: "Sita Sharma" }
        : field,
    );

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "owner_name_mismatch",
    );

    expect(alert?.level).toBe("high");
    expect(alert?.tag).toBe("ownership_mismatch");
    expect(alert?.explanation).toContain(
      "Potential inconsistency. Confirm with the issuing authority.",
    );
  });

  it("raises a critical alert for a mortgage entry", () => {
    const input = baseInput();
    const extract = input.documents[0]!;
    extract.fields = extract.fields.map((field) =>
      field.fieldKey === "other_rights"
        ? { ...field, value: "बँकेचे तारण" }
        : field,
    );

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "mortgage_entry",
    );

    expect(alert?.level).toBe("critical");
    expect(alert?.tag).toBe("hidden_mortgage");
    expect(alert?.explanation).toContain("बँकेचे तारण");
  });

  it("raises a high alert for agricultural land without an NA order", () => {
    const input = baseInput();
    input.investigation.intendedUse = "residential";
    const extract = input.documents[0]!;
    extract.fields = extract.fields.map((field) =>
      field.fieldKey === "land_class"
        ? { ...field, value: "जिरायत" }
        : field,
    );

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "agricultural_without_na",
    );

    expect(alert?.level).toBe("high");
    expect(alert?.tag).toBe("agricultural_land_without_na");
    expect(alert?.explanation).toContain(
      "Potential inconsistency. Confirm with the issuing authority.",
    );
  });

  it("turns the same rule into a checked result when an NA order is uploaded", () => {
    const input = baseInput();
    input.investigation.intendedUse = "residential";
    const extract = input.documents[0]!;
    extract.fields = extract.fields.map((field) =>
      field.fieldKey === "land_class"
        ? { ...field, value: "जिरायत" }
        : field,
    );
    input.documents.push({
      id: "doc-na",
      type: "na_order",
      originalName: "na-order.pdf",
      uploadedAt: new Date("2026-03-01"),
      fields: [
        {
          id: "f-na-date",
          fieldKey: "document_date",
          ordinal: 0,
          value: "01/03/2026",
          unit: null,
          sourceText: "Date: 01/03/2026",
        },
      ],
    });

    const alerts = alertsFor(input);

    expect(
      alerts.some((alert) => alert.ruleKey === "agricultural_without_na"),
    ).toBe(false);
    expect(alerts.some((alert) => alert.ruleKey === "na_order_uploaded")).toBe(
      true,
    );
  });

  it("reviews a 7/12 extract older than 12 months", () => {
    const input = baseInput();
    const extract = input.documents[0]!;
    extract.fields = extract.fields.map((field) =>
      field.fieldKey === "document_date"
        ? { ...field, value: "01/01/2020" }
        : field,
    );

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "stale_712",
    );

    expect(alert?.level).toBe("review");
    expect(alert?.tag).toBe("mutation_not_updated");
  });

  it("reviews a power of attorney without a registration number", () => {
    const input = baseInput();
    input.documents.push({
      id: "doc-poa",
      type: "power_of_attorney",
      originalName: "poa.pdf",
      uploadedAt: new Date("2026-02-01"),
      fields: [],
    });

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "poa_without_registration",
    );

    expect(alert?.level).toBe("review");
    expect(alert?.tag).toBe("poa_misuse");
  });

  it("raises a high alert when the seller's statement conflicts", () => {
    const input = baseInput();
    input.claims = [
      {
        id: "claim-1",
        text: "The seller says the plot is 20 guntha.",
        fieldKey: "area",
        claimedValue: "20",
        claimedUnit: "guntha",
      },
    ];

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "claim_contradiction",
    );

    expect(alert?.level).toBe("high");
    expect(alert?.explanation).toContain("seller's statement");
    expect(alert?.explanation).toContain(
      "Potential inconsistency. Confirm with the issuing authority.",
    );
  });

  it("marks a supported seller statement as checked", () => {
    const input = baseInput();
    input.claims = [
      {
        id: "claim-1",
        text: "The seller says the owner is Ram Patil.",
        fieldKey: "owner_name",
        claimedValue: "Ram Patil",
        claimedUnit: null,
      },
    ];

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "claim_supported",
    );

    expect(alert?.level).toBe("checked");
  });

  it("raises a high alert for forest land", () => {
    const input = baseInput();
    const extract = input.documents[0]!;
    extract.fields = extract.fields.map((field) =>
      field.fieldKey === "land_class" ? { ...field, value: "वन" } : field,
    );

    const alert = alertsFor(input).find(
      (entry) => entry.ruleKey === "government_or_forest_land",
    );

    expect(alert?.level).toBe("high");
    expect(alert?.tag).toBe("government_forest_land");
  });
});
