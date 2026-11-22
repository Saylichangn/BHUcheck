import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth/session";
import { isDocumentType } from "@/lib/documents/types";
import { maxUploadBytes } from "@/lib/documents/file-types";
import { uploadDocument } from "@/lib/documents/service";
import { sameOrigin } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { uploadLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

function backTo(
  request: Request,
  investigationId: string,
  result: string,
  status = 303,
) {
  const url = new URL(
    `/investigations/${investigationId}?upload=${result}#documents`,
    request.url,
  );

  return Response.redirect(url, status);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: investigationId } = await params;
  const user = await currentUser();

  if (!user) {
    return Response.redirect(new URL("/login", request.url), 303);
  }

  if (!sameOrigin(request)) {
    return backTo(request, investigationId, "origin", 403);
  }

  const limit = await uploadLimited(user.id);

  if (!limit.allowed) {
    return backTo(request, investigationId, "rate_limited", 429);
  }

  const investigation = await prisma.investigation.findFirst({
    where: { id: investigationId, userId: user.id },
    select: { id: true },
  });

  if (!investigation) {
    return new Response("Not found.", { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type");

  if (!(file instanceof File) || file.size === 0) {
    return backTo(request, investigationId, "no_file");
  }

  if (file.size > maxUploadBytes) {
    return backTo(request, investigationId, "too_large");
  }

  if (typeof type !== "string" || !isDocumentType(type)) {
    return backTo(request, investigationId, "bad_type");
  }

  try {
    const data = new Uint8Array(await file.arrayBuffer());

    await uploadDocument({
      userId: user.id,
      investigationId,
      documentType: type,
      originalName: file.name || "document",
      data,
    });
  } catch (error) {
    console.error("Document upload failed.", error);
    return backTo(request, investigationId, "failed");
  }

  revalidatePath(`/investigations/${investigationId}`);
  return backTo(request, investigationId, "ok");
}
