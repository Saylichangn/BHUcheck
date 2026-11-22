import { currentUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/http/request";
import { generateReport } from "@/lib/reports/service";

export const runtime = "nodejs";
export const maxDuration = 120;

function backTo(request: Request, investigationId: string, result: string) {
  return Response.redirect(
    new URL(
      `/investigations/${investigationId}?report=${result}#reports`,
      request.url,
    ),
    303,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    return Response.redirect(new URL("/login", request.url), 303);
  }

  if (!sameOrigin(request)) {
    return backTo(request, id, "origin");
  }

  try {
    const report = await generateReport({
      userId: user.id,
      investigationId: id,
    });

    if (!report) {
      return new Response("Not found.", { status: 404 });
    }

    return backTo(request, id, "ok");
  } catch (error) {
    console.error("Report generation failed.", error);
    return backTo(request, id, "failed");
  }
}
