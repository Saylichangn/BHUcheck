import { currentUser } from "@/lib/auth/session";
import { contentDisposition } from "@/lib/http/content-disposition";
import { getReportFile } from "@/lib/reports/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    return new Response("Sign in to download this report.", { status: 401 });
  }

  const report = await getReportFile(user.id, id);

  if (!report) {
    return new Response("Not found.", { status: 404 });
  }

  return new Response(new Uint8Array(report.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(report.data.byteLength),
      "Content-Disposition": contentDisposition(report.fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
