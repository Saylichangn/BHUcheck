import { currentUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/http/request";
import { saveQuestionnaireAnswer } from "@/lib/questionnaire/service";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Request not verified." }, { status: 403 });
  }

  const user = await currentUser();

  if (!user) {
    return Response.json({ error: "Sign in to save." }, { status: 401 });
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

  const { investigationId, questionKey, status, note } = body as Record<
    string,
    unknown
  >;

  if (
    typeof investigationId !== "string" ||
    typeof questionKey !== "string" ||
    typeof status !== "string" ||
    (note !== undefined && typeof note !== "string")
  ) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof note === "string" && note.length > 2000) {
    return Response.json({ error: "Note is too long." }, { status: 400 });
  }

  const saved = await saveQuestionnaireAnswer({
    userId: user.id,
    investigationId,
    questionKey,
    status,
    note: typeof note === "string" ? note : null,
  });

  if (!saved) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
