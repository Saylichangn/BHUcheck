import { z } from "zod";
import type { AlertLevel } from "@/lib/domain/alerts";

export const aiSeverityValues = [
  "high",
  "medium",
  "low",
  "informational",
] as const;

export const aiCategoryValues = [
  "suspicious_statement",
  "unverified_claim",
  "confirmed_fact",
  "no_warning",
] as const;

export const aiAlertSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(1200),
  severity: z.enum(aiSeverityValues),
  category: z.enum(aiCategoryValues),
  whyItMatters: z.string().trim().min(10).max(1200),
  recommendedAction: z.string().trim().min(10).max(1200),
});

export const aiAnalysisSchema = z.object({
  answer: z.string().trim().max(2000).optional(),
  alerts: z.array(aiAlertSchema).max(5),
});

export type AiAlert = z.infer<typeof aiAlertSchema>;

export function severityToLevel(severity: AiAlert["severity"]): AlertLevel {
  switch (severity) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    case "informational":
      return "informational";
  }
}

export function parseAiAnalysis(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start < 0 || end < start) return null;

  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    const result = aiAnalysisSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
