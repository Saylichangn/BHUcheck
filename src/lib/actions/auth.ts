"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, verifyPassword, verifyPlaceholder } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requestIp } from "@/lib/http/request";
import {
  clearLoginFailures,
  loginLimited,
  recordLoginFailure,
  recordRegisterAttempt,
  registerLimited,
} from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

export type AuthState = {
  message?: string;
};

export async function registerAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const ip = await requestIp();
  const limit = await registerLimited(ip);

  if (!limit.allowed) {
    return {
      message: `Too many registration attempts. Try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minutes.`,
    };
  }

  await recordRegisterAttempt(ip);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      message:
        "An account with this email already exists. Sign in or use another email.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        message:
          "An account with this email already exists. Sign in or use another email.",
      };
    }

    throw error;
  }

  await createSession(user.id);
  redirect("/investigations");
}

export async function loginAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const ip = await requestIp();
  const limit = await loginLimited(parsed.data.email, ip);

  if (!limit.allowed) {
    return {
      message: `Too many sign-in attempts. Try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minutes.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });

  const valid = user
    ? await verifyPassword(user.passwordHash, parsed.data.password)
    : await verifyPlaceholder(parsed.data.password);

  if (!user || !valid) {
    await recordLoginFailure(parsed.data.email, ip);
    return { message: "The email or password is incorrect." };
  }

  await clearLoginFailures(parsed.data.email);
  await createSession(user.id);
  redirect("/investigations");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
