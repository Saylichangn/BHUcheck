import { currentUser } from "@/lib/auth/session";
import { contentDisposition } from "@/lib/http/content-disposition";
import { readFile } from "@/lib/storage/files";
import { documentBelongsToUser } from "@/lib/investigations/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    return new Response("Sign in to view this file.", { status: 401 });
  }

  const document = await documentBelongsToUser(user.id, id);

  if (!document) {
    return new Response("Not found.", { status: 404 });
  }

  try {
    const bytes = await readFile(document.storagePath);
    const inline =
      document.mimeType === "application/pdf" ||
      document.mimeType === "image/jpeg" ||
      document.mimeType === "image/png";

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": contentDisposition(
          document.originalName,
          inline,
        ),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("The stored file could not be read.", { status: 404 });
  }
}
