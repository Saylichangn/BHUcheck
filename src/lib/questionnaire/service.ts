import { prisma } from "@/lib/db";
import {
  isQuestionnaireQuestionKey,
  isQuestionnaireStatus,
  questionnaireQuestions,
} from "@/lib/domain/questionnaire";

export async function saveQuestionnaireAnswer(input: {
  userId: string;
  investigationId: string;
  questionKey: string;
  status: string;
  note?: string | null;
}) {
  if (!isQuestionnaireQuestionKey(input.questionKey)) return false;
  if (!isQuestionnaireStatus(input.status)) return false;

  const note = input.note?.trim() ? input.note.trim().slice(0, 2000) : null;

  const investigation = await prisma.investigation.findFirst({
    where: { id: input.investigationId, userId: input.userId },
    select: { id: true },
  });

  if (!investigation) return false;

  await prisma.questionAnswer.upsert({
    where: {
      investigationId_questionKey: {
        investigationId: input.investigationId,
        questionKey: input.questionKey,
      },
    },
    create: {
      investigationId: input.investigationId,
      questionKey: input.questionKey,
      status: input.status,
      note,
    },
    update: { status: input.status, note },
  });

  const question = questionnaireQuestions.find(
    (item) => item.key === input.questionKey,
  );

  if (!question) return true;

  if (input.status === "problem") {
    await prisma.alert.upsert({
      where: {
        investigationId_questionKey: {
          investigationId: input.investigationId,
          questionKey: input.questionKey,
        },
      },
      create: {
        investigationId: input.investigationId,
        questionKey: input.questionKey,
        ruleKey: `q:${input.questionKey}`,
        title: `Problem found: ${question.text}`,
        level: "medium",
        tag: "unverified_claim",
        explanation: note
          ? `You recorded: ${note}`
          : "You marked this check as a problem. Confirm the detail with the issuing authority.",
        evidenceValue: note,
        sourceLabel: "Questionnaire response",
        whyItMatters:
          "A problem found in this check may affect the decision to proceed. Confirm it with the issuing authority.",
        nextStep: question.action,
        professionalAdvice: "none",
        source: "questionnaire",
      },
      update: {
        title: `Problem found: ${question.text}`,
        explanation: note
          ? `You recorded: ${note}`
          : "You marked this check as a problem. Confirm the detail with the issuing authority.",
        evidenceValue: note,
      },
    });
  } else {
    await prisma.alert.deleteMany({
      where: {
        investigationId: input.investigationId,
        questionKey: input.questionKey,
      },
    });
  }

  return true;
}

export async function saveQuestionLookup(input: {
  userId: string;
  investigationId: string;
  questionKey: string;
  sources: unknown[];
  summary: string | null;
}) {
  if (!isQuestionnaireQuestionKey(input.questionKey)) return;

  const investigation = await prisma.investigation.findFirst({
    where: { id: input.investigationId, userId: input.userId },
    select: { id: true },
  });

  if (!investigation) return;

  await prisma.questionAnswer.upsert({
    where: {
      investigationId_questionKey: {
        investigationId: input.investigationId,
        questionKey: input.questionKey,
      },
    },
    create: {
      investigationId: input.investigationId,
      questionKey: input.questionKey,
      status: "unsure",
      sourcesJson: JSON.stringify(input.sources),
      aiSummary: input.summary,
      lookupAt: new Date(),
    },
    update: {
      sourcesJson: JSON.stringify(input.sources),
      aiSummary: input.summary,
      lookupAt: new Date(),
    },
  });
}
