import { currentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sameOrigin } from "@/lib/http/request";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Request not verified." }, { status: 403 });
  }

  const user = await currentUser();

  if (!user) {
    return Response.json(
      { error: "Sign in to update alerts." },
      { status: 401 },
    );
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

  const { action, value } = body as Record<string, unknown>;

  if (action !== "resolved" && action !== "reviewed") {
    return Response.json({ error: "Unknown action." }, { status: 400 });
  }

  const { id } = await params;
  const alert = await prisma.alert.findFirst({
    where: { id, investigation: { userId: user.id } },
    select: {
      id: true,
      investigationId: true,
      resolved: true,
      reviewedAt: true,
    },
  });

  if (!alert) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const data =
    action === "resolved"
      ? { resolved: typeof value === "boolean" ? value : !alert.resolved }
      : { reviewedAt: alert.reviewedAt ? null : new Date() };

  await prisma.alert.update({ where: { id: alert.id }, data });

  await writeAuditLog({
    userId: user.id,
    investigationId: alert.investigationId,
    action: `alert.${action}`,
    entityType: "alert",
    entityId: alert.id,
  });

  return Response.json({ ok: true, ...data });
}
