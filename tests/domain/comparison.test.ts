import { describe, expect, it } from "vitest";
import type { ComparisonInput } from "@/lib/domain/engine/compare";
import { buildComparisons } from "@/lib/domain/engine/compare";

const baseInput: ComparisonInput = {
  investigation: {
    surveyNo: "123/2",
    village: "Pune",
    taluka: "Haveli",
    district: "Pune",
    intendedUse: "residential",
  },
  documents: [
    {
      id: "doc-712",
      type: "7_12",
      originalName: "seven-twelve.pdf",
      uploadedAt: new Date("2026-01-01"),
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
          id: "f-area-1",
          fieldKey: "area",
          ordinal: 0,
          value: "1.20",
          unit: "hectare",
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
          id: "f-survey-1",
          fieldKey: "survey_no",
          ordinal: 0,
          value: "123/2",
          unit: null,
          sourceText: "1 123/2 1.20 राम पाटील",
        },
        {
          id: "f-land-1",
          fieldKey: "land_class",
          ordinal: 0,
          value: "जिरायत",
          unit: null,
          sourceText: "भूमि प्रकार : जिरायत",
        },
      ],
    },
    {
      id: "doc-deed",
      type: "sale_deed",
      originalName: "sale-deed.pdf",
      uploadedAt: new Date("2026-01-02"),
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
          id: "f-area-2",
          fieldKey: "area",
          ordinal: 0,
          value: "1 hectare 20 are",
          unit: null,
          sourceText: "Area: 1 hectare 20 are",
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
          id: "f-survey-2",
          fieldKey: "survey_no",
          ordinal: 0,
          value: "Survey No. 123/2",
          unit: null,
          sourceText: "Survey No.: 123/2",
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
      ],
    },
  ],
  claims: [],
};

describe("comparison engine", () => {
  it("matches names across scripts and survey formats", () => {
    const result = buildComparisons(baseInput);

    expect(result.byField.get("owner_name")?.status).toBe("match");
    expect(result.byField.get("survey_no")?.status).toBe("match");
    expect(result.byField.get("village")?.status).toBe("match");
  });

  it("matches equivalent area values", () => {
    const result = buildComparisons(baseInput);

    expect(result.byField.get("area")?.status).toBe("match");
  });

  it("flags agricultural descriptions that differ", () => {
    const result = buildComparisons(baseInput);

    expect(result.byField.get("land_class")?.status).toBe(
      "possible_inconsistency",
    );
  });

  it("shows one-source and unavailable fields honestly", () => {
    const result = buildComparisons(baseInput);

    expect(result.byField.get("taluka")?.status).toBe("insufficient_data");
    expect(result.byField.get("district")?.status).toBe("insufficient_data");
    expect(result.byField.get("registration_no")?.status).toBe(
      "insufficient_data",
    );
  });

  it("turns a seller claim into a comparison source", () => {
    const result = buildComparisons({
      ...baseInput,
      claims: [
        {
          id: "claim-1",
          text: "The seller says the plot is 20 guntha.",
          fieldKey: "area",
          claimedValue: "20",
          claimedUnit: "guntha",
        },
      ],
    });

    const area = result.byField.get("area");
    const claim = area?.observations.find(
      (observation) => observation.sourceType === "claim",
    );

    expect(claim?.normalized.squareMetres).toBeCloseTo(2023.43, 1);
    expect(area?.status).toBe("inconsistency");
    expect(area?.note).toContain("does not match");
  });

  it("reports a field with no observations as unavailable", () => {
    const result = buildComparisons({
      ...baseInput,
      investigation: {
        ...baseInput.investigation,
        surveyNo: null,
        village: null,
        taluka: null,
        district: null,
      },
      documents: [],
      claims: [],
    });

    expect(result.byField.get("owner_name")?.status).toBe("not_available");
    expect(result.byField.get("area")?.status).toBe("not_available");
  });
});
