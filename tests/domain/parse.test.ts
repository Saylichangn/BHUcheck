import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ExtractedFieldCandidate } from "@/lib/domain/extraction/parse";
import { parseDocument } from "@/lib/domain/extraction/parse";
import type { FieldKey } from "@/lib/domain/fields";

function fixture(name: string) {
  return readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

function fieldsOf(
  fields: ExtractedFieldCandidate[],
  key: FieldKey,
): ExtractedFieldCandidate[] {
  return fields.filter((field) => field.fieldKey === key);
}

function firstField(
  fields: ExtractedFieldCandidate[],
  key: FieldKey,
): ExtractedFieldCandidate | undefined {
  return fieldsOf(fields, key)[0];
}

describe("Marathi 7/12 extract", () => {
  const result = parseDocument("7_12", fixture("seven-twelve-mr.txt"));

  it("reads the village, taluka and district", () => {
    expect(firstField(result.fields, "village")?.normalizedValue).toBe("pune");
    expect(firstField(result.fields, "taluka")?.normalizedValue).toBe("haveli");
    expect(firstField(result.fields, "district")?.normalizedValue).toBe("pune");
  });

  it("reads the table row", () => {
    expect(firstField(result.fields, "survey_no")?.normalizedValue).toBe(
      "123/2",
    );
    expect(firstField(result.fields, "area")?.normalizedValue).toBe("12000");
    expect(firstField(result.fields, "area")?.unit).toBe("hectare");
    expect(firstField(result.fields, "owner_name")?.normalizedValue).toBe(
      "patil ram",
    );
  });

  it("reads the date and the other-rights entry", () => {
    expect(firstField(result.fields, "document_date")?.normalizedValue).toBe(
      "2025-06-15",
    );
    expect(firstField(result.fields, "other_rights")?.normalizedValue).toBe(
      "none",
    );
  });

  it("does not treat the table header as an owner entry", () => {
    expect(fieldsOf(result.fields, "owner_name")).toHaveLength(1);
  });
});

describe("English 7/12 extract", () => {
  const result = parseDocument("7_12", fixture("seven-twelve-en.txt"));

  it("reads the same fields as the Marathi extract", () => {
    expect(firstField(result.fields, "village")?.normalizedValue).toBe("pune");
    expect(firstField(result.fields, "taluka")?.normalizedValue).toBe("haveli");
    expect(firstField(result.fields, "survey_no")?.normalizedValue).toBe(
      "123/2",
    );
    expect(firstField(result.fields, "area")?.normalizedValue).toBe("12000");
    expect(firstField(result.fields, "owner_name")?.normalizedValue).toBe(
      "patil ram",
    );
    expect(firstField(result.fields, "document_date")?.normalizedValue).toBe(
      "2025-06-15",
    );
  });
});

describe("sale deeds", () => {
  it("reads an English sale deed", () => {
    const result = parseDocument("sale_deed", fixture("sale-deed-en.txt"));

    expect(firstField(result.fields, "owner_name")?.normalizedValue).toBe(
      "patil ram",
    );
    expect(firstField(result.fields, "survey_no")?.normalizedValue).toBe(
      "123/2",
    );
    expect(firstField(result.fields, "area")?.normalizedValue).toBe("12000");
    expect(firstField(result.fields, "document_date")?.normalizedValue).toBe(
      "2026-01-10",
    );
    expect(
      firstField(result.fields, "registration_no")?.normalizedValue,
    ).toBe("PUNE/1234/2026");
    expect(firstField(result.fields, "land_class")?.normalizedValue).toBe(
      "agricultural",
    );
  });

  it("reads a Marathi sale deed", () => {
    const result = parseDocument("sale_deed", fixture("sale-deed-mr.txt"));

    expect(firstField(result.fields, "village")?.normalizedValue).toBe(
      "vagholi",
    );
    expect(firstField(result.fields, "owner_name")?.normalizedValue).toBe(
      "patil ram",
    );
    expect(firstField(result.fields, "area")?.normalizedValue).toBe("12000");
    expect(firstField(result.fields, "land_class")?.normalizedValue).toBe(
      "irrigated",
    );
    expect(
      firstField(result.fields, "registration_no")?.normalizedValue,
    ).toBe("PUNE/1234/2026");
  });
});

describe("unreadable input", () => {
  it("explains when no text can be parsed", () => {
    const result = parseDocument("other", "");

    expect(result.fields).toHaveLength(0);
    expect(result.notes[0]).toContain("No text");
  });

  it("reports an unreadable table", () => {
    const result = parseDocument(
      "7_12",
      "Village: Pune\nSr. No.  Gat No.  Area (Hectare)  Owner / Khatedar\n",
    );

    expect(result.fields.some((field) => field.fieldKey === "owner_name")).toBe(
      false,
    );
    expect(result.notes.join(" ")).toContain("could not be read");
  });
});
