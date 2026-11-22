import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { analysisLimited } from "@/lib/rate-limit";
import type { AreaUnit } from "@/lib/investigations/types";
import { parseAiAnalysis, severityToLevel, type AiAlert } from "./ai-alerts";

export type AnalysisStatus = "analysed" | "unavailable" | "rate_limited";

export type AnalysisResult = {
  status: AnalysisStatus;
  answer: string | null;
  alerts: number;
};

type LlmResult = {
  answer: string;
  alerts: AiAlert[];
};

function buildPrompt(input: {
  text: string;
  fieldKey: string | null;
  claimedValue: string | null;
  claimedUnit: AreaUnit | null;
}) {
  const compared =
    input.fieldKey && input.claimedValue
      ? `Linked field: ${input.fieldKey}. Value stated: ${input.claimedValue}${
          input.claimedUnit ? ` ${input.claimedUnit}` : ""
        }.`
      : "No linked field was chosen for this statement.";

  return [
    "You review a single statement made by a property seller in India.",
    "Use only the statement and context below. Do not invent documents, facts, dates, approvals, cases, loans, ownership, or government actions.",
    "Never say the seller is fraudulent, the property is safe, clean, or verified, or that a document is forged.",
    "Distinguish a suspicious statement, an unverified claim, and a confirmed fact. Treat the seller's text as a claim, not as fact.",
    "Write a short, cautious answer to the statement in plain language. Say what can and cannot be concluded from the text alone.",
    "If there are no warning signs, return an empty alerts array. Do not invent a warning to fill the list.",
    "Return strict JSON only, with this shape:",
    '{"answer":"string","alerts":[{"title":"string","description":"string","severity":"high|medium|low|informational","category":"suspicious_statement|unverified_claim|confirmed_fact|no_warning","whyItMatters":"string","recommendedAction":"string"}]}',
    "Use at most 5 alerts. Keep every string factual and cautious. Cite no outside sources.",
    "",
    `Seller statement: ${input.text}`,
    compared,
  ].join("\n");
}

async function callDeepSeek(prompt: string): Promise<LlmResult | null> {
  if (!env.DEEPSEEK_API_KEY) return null;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "Return only valid JSON. Do not add commentary or fences.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1200,
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("DeepSeek analysis failed with status", response.status);
    return null;
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = body.choices?.[0]?.message?.content;

  if (typeof text !== "string") return null;

  const parsed = parseAiAnalysis(text);

  if (!parsed) return null;

  return {
    answer: parsed.answer?.trim() || "No answer was returned.",
    alerts: parsed.alerts,
  };
}

async function callGemini(prompt: string): Promise<LlmResult | null> {
  if (!env.GEMINI_API_KEY) return null;

  const url = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  );
  url.searchParams.set("key", env.GEMINI_API_KEY);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") return null;

  const parsed = parseAiAnalysis(text);

  if (!parsed) return null;

  return {
    answer: parsed.answer?.trim() || "No answer was returned.",
    alerts: parsed.alerts,
  };
}

async function saveAlerts(input: {
  userId: string;
  investigationId: string;
  claimId: string;
  statement: string;
  alerts: AiAlert[];
}) {
  const rows = input.alerts.map((alert) => ({
    investigationId: input.investigationId,
    ruleKey: `ai:${alert.category}:${input.claimId}`,
    title: alert.title,
    level: severityToLevel(alert.severity),
    tag: `ai_${alert.category}`,
    explanation: alert.description,
    evidenceValue: input.statement,
    sourceLabel: `Seller statement · ${input.statement.slice(0, 120)}`,
    whyItMatters: alert.whyItMatters,
    nextStep: alert.recommendedAction,
    professionalAdvice: "none",
    source: "ai",
    claimId: input.claimId,
  }));

  if (rows.length === 0) {
    rows.push({
      investigationId: input.investigationId,
      ruleKey: `ai_none:${input.claimId}`,
      title: "No obvious warning signs detected.",
      level: "informational",
      tag: "ai_no_warning",
      explanation:
        "No obvious warning signs were detected in the statement text alone. This is not a conclusion about the seller or the property.",
      evidenceValue: input.statement,
      sourceLabel: `Seller statement · ${input.statement.slice(0, 120)}`,
      whyItMatters:
        "The analysis only reads the words submitted. It cannot check records or verify any claim.",
      nextStep:
        "Confirm the statement against the uploaded documents and the issuing authority.",
      professionalAdvice: "none",
      source: "ai",
      claimId: input.claimId,
    });
  }

  for (const row of rows) {
    await prisma.alert.upsert({
      where: {
        investigationId_ruleKey_claimId: {
          investigationId: row.investigationId,
          ruleKey: row.ruleKey,
          claimId: row.claimId,
        },
      },
      create: row,
      update: {
        title: row.title,
        level: row.level,
        explanation: row.explanation,
        whyItMatters: row.whyItMatters,
        nextStep: row.nextStep,
        evidenceValue: row.evidenceValue,
        sourceLabel: row.sourceLabel,
      },
    });
  }

  await writeAuditLog({
    userId: input.userId,
    investigationId: input.investigationId,
    action: "claim.ai_analyse",
    entityType: "claim",
    entityId: input.claimId,
    metadata: { alerts: rows.length },
  });
}

export async function analyseSellerClaim(input: {
  userId: string;
  investigationId: string;
  claimId: string;
  text: string;
  fieldKey: string | null;
  claimedValue: string | null;
  claimedUnit: AreaUnit | null;
}): Promise<AnalysisResult> {
  const limit = await analysisLimited(input.userId);

  if (!limit.allowed) {
    return { status: "rate_limited", answer: null, alerts: 0 };
  }

  try {
    const prompt = buildPrompt({
      text: input.text,
      fieldKey: input.fieldKey,
      claimedValue: input.claimedValue,
      claimedUnit: input.claimedUnit,
    });
    const result = (await callDeepSeek(prompt)) ?? (await callGemini(prompt));

    if (!result) {
      return { status: "unavailable", answer: null, alerts: 0 };
    }

    await prisma.claim.update({
      where: { id: input.claimId },
      data: { aiAnswer: result.answer.slice(0, 2000) },
    });

    await saveAlerts({
      userId: input.userId,
      investigationId: input.investigationId,
      claimId: input.claimId,
      statement: input.text,
      alerts: result.alerts,
    });

    return {
      status: "analysed",
      answer: result.answer,
      alerts: result.alerts.length,
    };
  } catch {
    return { status: "unavailable", answer: null, alerts: 0 };
  }
}
