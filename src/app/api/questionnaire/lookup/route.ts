import { currentUser } from "@/lib/auth/session";
import {
  isQuestionnaireQuestionKey,
  questionnaireQuestions,
} from "@/lib/domain/questionnaire";
import { requestIp, sameOrigin } from "@/lib/http/request";
import { lookupLimited } from "@/lib/rate-limit";
import { runQuestionLookup } from "@/lib/questionnaire/lookup";
import { saveQuestionLookup } from "@/lib/questionnaire/service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Request not verified." }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { questionKey, state, investigationId } = body as Record<
    string,
    unknown
  >;

  if (
    typeof questionKey !== "string" ||
    !isQuestionnaireQuestionKey(questionKey)
  ) {
    return Response.json({ error: "Unknown question." }, { status: 400 });
  }

  const question = questionnaireQuestions.find(
    (item) => item.key === questionKey,
  );

  if (!question) {
    return Response.json({ error: "Unknown question." }, { status: 400 });
  }

  const user = await currentUser();
  const ip = await requestIp();
  const limitId = user?.id ?? ip;
  const limit = await lookupLimited(limitId);

  if (!limit.allowed) {
    return Response.json(
      { error: "Lookup limit reached. Try again later." },
      { status: 429 },
    );
  }

  const safeState =
    typeof state === "string" && /^[\p{L}\p{M} .'-]{0,60}$/u.test(state)
      ? state.trim() || "India"
      : "India";

  const result = await runQuestionLookup({ question, state: safeState });

  if (user && typeof investigationId === "string") {
    await saveQuestionLookup({
      userId: user.id,
      investigationId,
      questionKey,
      sources: result.links,
      summary: result.summary,
    });
  }

  return Response.json(result);
}
