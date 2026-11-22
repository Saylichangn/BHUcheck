import { currentUser } from "@/lib/auth/session";
import { saveChecklistReview } from "@/lib/checklist/service";
import { sameOrigin } from "@/lib/http/request";

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

  const { investigationId, requirementKey, checked } = body as Record<
    string,
    unknown
  >;

  if (
    typeof investigationId !== "string" ||
    typeof requirementKey !== "string" ||
    typeof checked !== "boolean"
  ) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const saved = await saveChecklistReview({
    userId: user.id,
    investigationId,
    requirementKey,
    checked,
  });

  if (!saved) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
