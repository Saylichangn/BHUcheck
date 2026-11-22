import { getEnv } from "@/lib/env";
import type { QuestionnaireQuestion } from "@/lib/domain/questionnaire";

export type SourceLink = {
  title: string;
  url: string;
  snippet: string;
};

export type LookupResult = {
  links: SourceLink[];
  summary: string | null;
  message: string | null;
};

const allowedHostSuffixes = [".gov.in", ".nic.in", ".org.in"];
const allowedExactHosts = new Set(["cersai.org.in", "indiacode.nic.in"]);

function allowedHost(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      allowedExactHosts.has(host) ||
      allowedHostSuffixes.some((suffix) => host.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

async function searchGoogle(query: string): Promise<SourceLink[] | null> {
  const { GOOGLE_CSE_KEY, GOOGLE_CSE_CX } = getEnv();
  if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_CX) return null;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_CSE_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_CX);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as { items?: unknown };
  const items = Array.isArray(body.items) ? body.items : [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const link = clean(record.link);

      if (!allowedHost(link)) return null;

      return {
        title: clean(record.title) || "Government source",
        url: link,
        snippet: clean(record.snippet).slice(0, 320),
      };
    })
    .filter((link): link is SourceLink => link !== null)
    .slice(0, 5);
}

async function summarizeWithGemini(
  question: QuestionnaireQuestion,
  links: SourceLink[],
): Promise<string | null> {
  const { GEMINI_API_KEY } = getEnv();
  if (!GEMINI_API_KEY || links.length === 0) return null;

  const sources = links
    .map(
      (link, index) =>
        `[${index + 1}] ${link.title} — ${link.url}\n${link.snippet}`,
    )
    .join("\n\n");

  const prompt = [
    "You are writing short, careful guidance for a property document checklist.",
    "Use only the numbered sources below. Cite them as [1], [2] etc.",
    "Write at most three sentences. Do not give legal advice.",
    "Never say a property is safe, clean or verified.",
    "Never call a document forged or a seller fraudulent.",
    "If the sources do not answer the question, say that the sources are inconclusive and suggest confirming with the issuing authority.",
    "",
    `Question: ${question.text}`,
    "",
    `Action already shown to the user: ${question.action}`,
    "",
    "Sources:",
    sources,
  ].join("\n");

  const url = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  );
  url.searchParams.set("key", GEMINI_API_KEY);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 220, temperature: 0 },
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;

  return typeof text === "string" && text.trim()
    ? text.trim().slice(0, 1200)
    : null;
}

export async function runQuestionLookup(input: {
  question: QuestionnaireQuestion;
  state: string;
}): Promise<LookupResult> {
  const query = `${input.question.text} ${input.state} official government land records`;

  try {
    const links = await searchGoogle(query);

    if (links === null) {
      return {
        links: [],
        summary: null,
        message: "Live lookup is not configured on this server.",
      };
    }

    const summary = await summarizeWithGemini(input.question, links);

    return {
      links,
      summary,
      message:
        links.length === 0
          ? "No official government sources were returned for this question."
          : null,
    };
  } catch {
    return {
      links: [],
      summary: null,
      message: "Sources could not be loaded. The checklist still works.",
    };
  }
}
