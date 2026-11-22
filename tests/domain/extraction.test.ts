import { describe, expect, it } from "vitest";
import { compareAreas, parseArea } from "@/lib/domain/extraction/area";
import {
  isOlderThanMonths,
  parseDate,
} from "@/lib/domain/extraction/dates";
import {
  classifyLand,
  compareLandClasses,
} from "@/lib/domain/extraction/land";
import {
  foldName,
  nameVerdict,
  normalizedIdentifier,
  normalizedRegistration,
} from "@/lib/domain/extraction/normalize";

describe("identifier normalization", () => {
  it("strips English and Marathi survey prefixes", () => {
    expect(normalizedIdentifier("Survey No. 123/2")).toBe("123/2");
    expect(normalizedIdentifier("Gat No 045/1A")).toBe("45/1A");
    expect(normalizedIdentifier("गट क्रमांक १२३/२")).toBe("123/2");
    expect(normalizedIdentifier("स.नं. ०७/३")).toBe("7/3");
    expect(normalizedIdentifier("CTS No. 45/1")).toBe("45/1");
  });

  it("normalizes registration numbers", () => {
    expect(normalizedRegistration("Registration No. pune/1234/2026")).toBe(
      "PUNE/1234/2026",
    );
    expect(normalizedRegistration("दस्त नोंदणी क्रमांक : PUNE/१२३४/२०२६")).toBe(
      "PUNE/1234/2026",
    );
  });
});

describe("name normalization", () => {
  it("matches transliterated names in either order", () => {
    expect(foldName("राम पाटील")).toBe("patil ram");
    expect(nameVerdict("Ram Patil", "राम पाटील")).toBe("match");
  });

  it("marks a close spelling as a possible variant", () => {
    expect(nameVerdict("Ram Patil", "Ram Patel")).toBe("possible_variant");
    expect(nameVerdict("Ram Patil", "Sita Sharma")).toBe("mismatch");
  });
});

describe("area parsing", () => {
  it("reads hectares and ares", () => {
    expect(parseArea("1 hectare 20 are")?.squareMetres).toBe(12000);
    expect(parseArea("१ हे २० आर")?.squareMetres).toBe(12000);
  });

  it("reads acres and gunthas", () => {
    const area = parseArea("1 acre 20 guntha");
    expect(area?.unit).toBe("acre");
    expect(area?.value).toBe(1.5);
  });

  it("reads square feet and square metres", () => {
    expect(parseArea("1,200 sq ft")?.squareMetres).toBeCloseTo(111.48, 1);
    expect(parseArea("100 चौ.मी.")?.squareMetres).toBe(100);
  });

  it("uses a supplied fallback unit only when no unit is written", () => {
    expect(parseArea("1.20", "hectare")?.squareMetres).toBe(12000);
    expect(parseArea("1.20")).toBeNull();
    expect(parseArea("not an area")).toBeNull();
  });

  it("compares areas with a small tolerance", () => {
    const left = parseArea("1.20 hectare");
    const right = parseArea("12000 sq m");

    expect(left && right && compareAreas(left, right)).toBe("match");

    const small = parseArea("1000 sq ft");
    const close = parseArea("1010 sq ft");

    expect(small && close && compareAreas(small, close)).toBe("match");
  });
});

describe("date parsing", () => {
  it("reads numeric, Marathi and English dates", () => {
    expect(parseDate("15/06/2025")?.iso).toBe("2025-06-15");
    expect(parseDate("दिनांक : १५ जून २०२५")?.iso).toBe("2025-06-15");
    expect(parseDate("15 June 2021")?.iso).toBe("2021-06-15");
    expect(parseDate("June 15, 2021")?.iso).toBe("2021-06-15");
    expect(parseDate("2021-06-15")?.iso).toBe("2021-06-15");
  });

  it("rejects impossible dates", () => {
    expect(parseDate("31/02/2025")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });

  it("measures age against a fixed reference date", () => {
    expect(isOlderThanMonths("2024-01-01", 12, new Date("2026-11-17"))).toBe(
      true,
    );
    expect(isOlderThanMonths("2026-06-01", 12, new Date("2026-11-17"))).toBe(
      false,
    );
  });
});

describe("land classification", () => {
  it("classifies common Maharashtra land descriptions", () => {
    expect(classifyLand("जिरायत")).toBe("rainfed");
    expect(classifyLand("बागायत")).toBe("irrigated");
    expect(classifyLand("गैरशेती")).toBe("non_agricultural");
    expect(classifyLand("वन")).toBe("forest");
    expect(classifyLand("Agricultural")).toBe("agricultural");
  });

  it("treats two agricultural descriptions as a variant, not a hard conflict", () => {
    expect(compareLandClasses("agricultural", "irrigated")).toBe(
      "possible_variant",
    );
    expect(compareLandClasses("agricultural", "non_agricultural")).toBe(
      "mismatch",
    );
  });
});
