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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    "Environment variables are not set. Copy .env.example to .env and fill in the values.",
  );
}

export const env = parsed.data;
