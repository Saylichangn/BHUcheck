import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  RATE_LIMIT_PEPPER: z.string().min(16),
  STORAGE_DIR: z.string().min(1).default("storage/private"),
  GOOGLE_CSE_KEY: z.string().optional(),
  GOOGLE_CSE_CX: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

/**
 * Validate server environment variables on first use instead of at module load.
 *
 * Next.js imports route modules while collecting page data during `next build`.
 * Reading these values eagerly made every build require runtime secrets such as
 * DATABASE_URL. They are still required before the first database, storage,
 * rate-limit, or AI call, and a missing value fails with a clear message.
 */
export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const invalid = [
      ...new Set(
        parsed.error.issues.map((issue) => issue.path.join(".") || "environment"),
      ),
    ].join(", ");

    throw new Error(
      `Server environment variables are missing or invalid: ${invalid}. Set them in .env locally and in the deployment environment (for example, Vercel Project Settings -> Environment Variables).`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
