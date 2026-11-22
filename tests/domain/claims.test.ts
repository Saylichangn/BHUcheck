import { describe, expect, it } from "vitest";
import type { ComparisonInput } from "@/lib/domain/engine/compare";
import { evaluateClaims } from "@/lib/domain/engine/claims";

function inputWith(
  overrides: Partial<ComparisonInput> = {},
): ComparisonInput {
  return {
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
        ],
      },
    ],
    claims: [],
    ...overrides,
  };
}

describe("seller claim evaluation", () => {
  it("supports a statement that matches the documents", () => {
    const [claim] = evaluateClaims(
      inputWith({
        claims: [
          {
            id: "claim-1",
            text: "The seller says the owner is Ram Patil.",
            fieldKey: "owner_name",
            claimedValue: "Ram Patil",
            claimedUnit: null,
          },
        ],
      }),
    );

    expect(claim?.status).toBe("supported");
    expect(claim?.evidenceDocumentId).toBe("doc-712");
  });

  it("contradicts a claim that differs from the documents", () => {
    const [claim] = evaluateClaims(
      inputWith({
        claims: [
          {
            id: "claim-1",
            text: "The seller says the plot is 20 guntha.",
            fieldKey: "area",
            claimedValue: "20",
            claimedUnit: "guntha",
          },
        ],
      }),
    );

    expect(claim?.status).toBe("contradicted");
    expect(claim?.rationale).toContain("does not match");
    expect(claim?.rationale).toContain("1.20");
  });

  it("does not call a statement supported when the documents disagree", () => {
    const input = inputWith();
    const deed = input.documents[1]!;

    deed.fields = deed.fields.map((field) =>
      field.fieldKey === "owner_name"
        ? { ...field, value: "Sita Sharma" }
        : field,
    );

    const [claim] = evaluateClaims({
      ...input,
      claims: [
        {
          id: "claim-1",
          text: "The seller says the owner is Ram Patil.",
          fieldKey: "owner_name",
          claimedValue: "Ram Patil",
          claimedUnit: null,
        },
      ],
    });

    expect(claim?.status).toBe("unverified");
    expect(claim?.rationale).toContain("One source agrees");
  });

  it("leaves an unmapped statement unverified", () => {
    const [claim] = evaluateClaims(
      inputWith({
        claims: [
          {
            id: "claim-1",
            text: "The seller says there is no dispute.",
            fieldKey: null,
            claimedValue: null,
            claimedUnit: null,
          },
        ],
      }),
    );

    expect(claim?.status).toBe("unverified");
    expect(claim?.rationale).toContain("not linked");
  });

  it("explains when no document provides the field", () => {
    const [claim] = evaluateClaims(
      inputWith({
        documents: [],
        claims: [
          {
            id: "claim-1",
            text: "The seller says the owner is Ram Patil.",
            fieldKey: "owner_name",
            claimedValue: "Ram Patil",
            claimedUnit: null,
          },
        ],
      }),
    );

    expect(claim?.status).toBe("unverified");
    expect(claim?.rationale).toContain("No uploaded document");
  });
});
