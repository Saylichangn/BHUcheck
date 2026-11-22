import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const loginWindow = 15 * 60 * 1000;
const loginEmailLimit = 5;
const loginIpLimit = 20;
const registerWindow = 60 * 60 * 1000;
const registerLimit = 5;
const uploadWindow = 60 * 60 * 1000;
const uploadLimit = 30;
const lookupWindow = 60 * 60 * 1000;
const lookupLimit = 20;
const analysisWindow = 60 * 60 * 1000;
const analysisLimit = 20;

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function hashedKey(scope: string, id: string) {
  return createHash("sha256")
    .update(`${env.RATE_LIMIT_PEPPER}:${scope}:${id}`)
    .digest("hex");
}

function windowStartFor(windowMs: number) {
  return new Date(Math.floor(Date.now() / windowMs) * windowMs);
}

function retryAfter(windowMs: number) {
  const start = windowStartFor(windowMs).getTime();
  return Math.max(1, Math.ceil((start + windowMs - Date.now()) / 1000));
}

async function readCount(scope: string, id: string, windowMs: number) {
  const row = await prisma.rateLimit.findUnique({
    where: {
      key_windowStart: {
        key: hashedKey(scope, id),
        windowStart: windowStartFor(windowMs),
      },
    },
  });

  return row?.count ?? 0;
}

async function record(scope: string, id: string, windowMs: number) {
  const now = Date.now();
  const windowStart = windowStartFor(windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limits" ("id", "key", "windowStart", "count")
    VALUES (${randomUUID()}, ${hashedKey(scope, id)}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET "count" = "rate_limits"."count" + 1
    RETURNING "count"
  `;

  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({
      where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } },
    });
  }

  return rows[0]?.count ?? 1;
}

async function clear(scope: string, id: string) {
  await prisma.rateLimit.deleteMany({
    where: { key: hashedKey(scope, id) },
  });
}

export async function loginLimited(
  email: string,
  ip: string,
): Promise<LimitResult> {
  const [emailCount, ipCount] = await Promise.all([
    readCount("login-email", email, loginWindow),
    readCount("login-ip", ip, loginWindow),
  ]);

  if (emailCount >= loginEmailLimit || ipCount >= loginIpLimit) {
    return {
      allowed: false,
      retryAfterSeconds: retryAfter(loginWindow),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordLoginFailure(email: string, ip: string) {
  await Promise.all([
    record("login-email", email, loginWindow),
    record("login-ip", ip, loginWindow),
  ]);
}

export async function clearLoginFailures(email: string) {
  await clear("login-email", email);
}

export async function registerLimited(ip: string): Promise<LimitResult> {
  const count = await readCount("register-ip", ip, registerWindow);

  if (count >= registerLimit) {
    return {
      allowed: false,
      retryAfterSeconds: retryAfter(registerWindow),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordRegisterAttempt(ip: string) {
  return record("register-ip", ip, registerWindow);
}

export async function uploadLimited(userId: string): Promise<LimitResult> {
  const count = await record("upload-user", userId, uploadWindow);

  return {
    allowed: count <= uploadLimit,
    retryAfterSeconds: retryAfter(uploadWindow),
  };
}

export async function lookupLimited(id: string): Promise<LimitResult> {
  const count = await record("lookup", id, lookupWindow);

  return {
    allowed: count <= lookupLimit,
    retryAfterSeconds: retryAfter(lookupWindow),
  };
}

export async function analysisLimited(userId: string): Promise<LimitResult> {
  const count = await record("analysis-user", userId, analysisWindow);

  return {
    allowed: count <= analysisLimit,
    retryAfterSeconds: retryAfter(analysisWindow),
  };
}
