import { headers } from "next/headers";

export async function requestIp() {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first || store.get("x-real-ip") || "unknown";
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) return true;

  const host = request.headers.get("host");

  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
