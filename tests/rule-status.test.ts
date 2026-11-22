import { describe, expect, it } from "vitest";
import { describeAlertRules } from "@/lib/domain/engine/rule-status";

const emptyInput = {
  documents: [],
  claims: [],
  comparisons: [],
  intendedUse: "residential",
};

describe("alert rule status", () => {
  it("reports that no rules ran when there is no input", () => {
    const status = describeAlertRules(emptyInput);

    expect(status.every((rule) => rule.status === "skipped")).toBe(true);
    expect(
      status.find((rule) => rule.key === "seven_twelve_checks")?.reason,
    ).toBe("No 7/12 uploaded.");
  });

  it("marks document rules as run when the documents are present", () => {
    const status = describeAlertRules({
      ...emptyInput,
      documents: [{ type: "7_12" }, { type: "sale_deed" }],
    });

    expect(
      status.find((rule) => rule.key === "seven_twelve_checks")?.status,
    ).toBe("ran");
    expect(status.find((rule) => rule.key === "sale_deed_checks")?.status).toBe(
      "ran",
    );
    expect(status.find((rule) => rule.key === "mutation_checks")?.status).toBe(
      "skipped",
    );
  });
});
