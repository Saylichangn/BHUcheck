import { describe, expect, it } from "vitest";
import {
  isQuestionnaireQuestionKey,
  isQuestionnaireStatus,
  questionnaireQuestions,
} from "@/lib/domain/questionnaire";

describe("questionnaire questions", () => {
  it("contains the 31 questions in order", () => {
    expect(questionnaireQuestions).toHaveLength(31);
    expect(questionnaireQuestions.map((item) => item.number)).toEqual(
      Array.from({ length: 31 }, (_, index) => index + 1),
    );
  });

  it("has a unique key and a non-empty action for every question", () => {
    const keys = questionnaireQuestions.map((item) => item.key);

    expect(new Set(keys).size).toBe(keys.length);

    for (const question of questionnaireQuestions) {
      expect(question.text.length).toBeGreaterThan(10);
      expect(question.action.length).toBeGreaterThan(10);
    }
  });

  it("validates question keys and statuses", () => {
    const first = questionnaireQuestions[0];

    expect(first && isQuestionnaireQuestionKey(first.key)).toBe(true);
    expect(isQuestionnaireQuestionKey("unknown_question")).toBe(false);
    expect(isQuestionnaireStatus("no_problem")).toBe(true);
    expect(isQuestionnaireStatus("problem")).toBe(true);
    expect(isQuestionnaireStatus("unsure")).toBe(true);
    expect(isQuestionnaireStatus("done")).toBe(false);
    expect(isQuestionnaireStatus("yes")).toBe(false);
  });
});
