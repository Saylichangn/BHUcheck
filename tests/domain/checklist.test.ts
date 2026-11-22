import { describe, expect, it } from "vitest";
import type {
  ChecklistDocument,
  ChecklistInput,
} from "@/lib/domain/engine/checklist";
import { buildChecklist, checklistRules } from "@/lib/domain/engine/checklist";
import { checklistStatusValues } from "@/lib/domain/checklist";
import { documentTypeValues } from "@/lib/documents/types";
import { governmentSources } from "@/lib/domain/sources";

function inputWith(
  overrides: Partial<ChecklistInput> = {},
  documents: ChecklistDocument[] = [],
): ChecklistInput {
  return {
    investigation: {
      district: "Pune",
      surveyNo: "123/2",
      intendedUse: "residential",
      propertyType: "plot",
    },
    documents,
    ...overrides,
  };
}

function documentOf(
  type: ChecklistDocument["type"],
  id = `doc-${type}`,
): ChecklistDocument {
  return {
    id,
    type,
    originalName: `${type}.pdf`,
    uploadedAt: new Date("2026-06-01"),
  };
}

function statusOf(input: ChecklistInput, key: string) {
  return buildChecklist(input).find((item) => item.key === key);
}

describe("checklist engine", () => {
  it("lists a missing title document on an empty investigation", () => {
    const sevenTwelve = statusOf(inputWith(), "seven_twelve");
    const saleDeed = statusOf(inputWith(), "sale_deed");
    const litigation = statusOf(inputWith(), "litigation_search");

    expect(sevenTwelve?.status).toBe("missing");
    expect(saleDeed?.status).toBe("missing");
    expect(litigation?.status).toBe("missing");
  });

  it("marks a required document as uploaded and keeps its id", () => {
    const extract = documentOf("7_12", "doc-extract");
    const item = statusOf(inputWith({}, [extract]), "seven_twelve");

    expect(item?.status).toBe("satisfied");
    expect(item?.satisfiedByDocumentId).toBe("doc-extract");
    expect(item?.note).toContain("Uploaded copy: 7_12.pdf");
  });

  it("asks for 8A once a 7/12 is uploaded", () => {
    const withExtract = statusOf(
      inputWith({}, [documentOf("7_12")]),
      "eight_a",
    );
    const withoutExtract = statusOf(inputWith(), "eight_a");

    expect(withExtract?.status).toBe("obtain");
    expect(withoutExtract?.status).toBe("not_applicable");
  });

  it("asks for a mutation entry only after a transfer document is uploaded", () => {
    const withDeed = statusOf(
      inputWith({}, [documentOf("sale_deed")]),
      "mutation_entry",
    );
    const withoutDeed = statusOf(inputWith(), "mutation_entry");

    expect(withDeed?.status).toBe("obtain");
    expect(withoutDeed?.status).toBe("not_applicable");
  });

  it("does not claim an NA order is applicable without knowing the land class", () => {
    expect(statusOf(inputWith(), "na_order")?.status).toBe("unconfirmed");
  });

  it("treats an NA order as not applicable when the intended use is agricultural", () => {
    const input = inputWith({
      investigation: {
        district: "Pune",
        surveyNo: "123/2",
        intendedUse: "agricultural",
        propertyType: "farmland",
      },
    });

    expect(statusOf(input, "na_order")?.status).toBe("not_applicable");
  });

  it("asks for a survey map only when a survey number is entered", () => {
    expect(statusOf(inputWith(), "survey_map")?.status).toBe("obtain");

    const noSurvey = inputWith({
      investigation: {
        district: "Pune",
        surveyNo: null,
        intendedUse: "residential",
        propertyType: "plot",
      },
    });

    expect(statusOf(noSurvey, "survey_map")?.status).toBe("unconfirmed");
  });

  it("adapts requirements by property type", () => {
    const flat = buildChecklist(
      inputWith({
        investigation: {
          district: "Pune",
          surveyNo: null,
          intendedUse: "residential",
          propertyType: "flat",
        },
      }),
    );
    const plot = buildChecklist(
      inputWith({
        investigation: {
          district: "Pune",
          surveyNo: "123/2",
          intendedUse: "residential",
          propertyType: "plot",
        },
      }),
    );

    expect(flat.find((item) => item.key === "society_documents")?.status).toBe(
      "obtain",
    );
    expect(flat.find((item) => item.key === "seven_twelve")?.status).toBe(
      "not_applicable",
    );
    expect(plot.find((item) => item.key === "layout_approval")?.status).toBe(
      "obtain",
    );
  });

  it("leaves a power of attorney conditional until one is uploaded", () => {
    expect(statusOf(inputWith(), "power_of_attorney")?.status).toBe(
      "unconfirmed",
    );
    expect(
      statusOf(
        inputWith({}, [documentOf("power_of_attorney")]),
        "power_of_attorney",
      )?.status,
    ).toBe("satisfied");
  });

  it("never resolves a step done outside BHUcheck", () => {
    const input = inputWith({}, [documentOf("litigation_search")]);
    const search = statusOf(input, "litigation_search");
    const ecourts = statusOf(input, "ecourts_check");
    const siteVisit = statusOf(input, "site_visit");

    expect(search?.status).toBe("satisfied");
    expect(ecourts?.status).toBe("unconfirmed");
    expect(siteVisit?.status).toBe("unconfirmed");
    expect(siteVisit?.note).toContain("not tracked automatically");
  });

  it("uses only defined statuses for every rule", () => {
    const items = buildChecklist(
      inputWith({}, [documentOf("7_12"), documentOf("sale_deed")]),
    );

    for (const item of items) {
      expect(checklistStatusValues).toContain(item.status);
    }
  });

  it("has unique rule keys and valid source slugs", () => {
    const keys = checklistRules.map((rule) => rule.key);
    const slugs = governmentSources.map((source) => source.slug);

    expect(new Set(keys).size).toBe(keys.length);

    for (const rule of checklistRules) {
      if (rule.sourceSlug) expect(slugs).toContain(rule.sourceSlug);

      for (const type of rule.satisfiedBy) {
        expect(documentTypeValues).toContain(type);
      }
    }
  });

  it("orders the checklist deterministically", () => {
    const items = buildChecklist(inputWith());

    expect(items.map((item) => item.sortOrder)).toEqual(
      items.map((_, index) => index),
    );
    expect(items[0]?.groupLabel).toBe("Land record and title");
  });
});
