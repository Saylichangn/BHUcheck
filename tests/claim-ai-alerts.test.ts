import { describe, expect, it } from "vitest";
import { parseAiAnalysis, severityToLevel } from "@/lib/claims/ai-alerts";

describe("seller statement AI alerts", () => {
  it("maps severities to alert levels", () => {
    expect(severityToLevel("high")).toBe("high");
    expect(severityToLevel("medium")).toBe("medium");
    expect(severityToLevel("low")).toBe("low");
    expect(severityToLevel("informational")).toBe("informational");
  });

  it("parses a valid analysis response", () => {
    const response = JSON.stringify({
      answer:
        "The statement can only be treated as a claim until the record is checked.",
      alerts: [
        {
          title: "Ownership needs confirmation",
          description: "The seller's name is stated without supporting detail.",
          severity: "medium",
          category: "unverified_claim",
          whyItMatters: "Ownership should be checked against the land record.",
          recommendedAction: "Ask for the current land record.",
        },
      ],
    });

    const parsed = parseAiAnalysis(`\`\`\`json\n${response}\n\`\`\``);

    expect(parsed?.alerts).toHaveLength(1);
    expect(parsed?.alerts[0]?.severity).toBe("medium");
    expect(parsed?.answer).toContain("treated as a claim");
  });

  it("rejects an invalid analysis response", () => {
    expect(parseAiAnalysis("not json")).toBeNull();
    expect(parseAiAnalysis("{}")).toBeNull();
  });
});
