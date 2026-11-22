import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .email("Enter a valid email address.")
      .max(254, "Use an email address of 254 characters or fewer.")
      .transform((value) => value.trim().toLowerCase()),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(128, "Use 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .email("Enter a valid email address.")
    .max(254, "Use an email address of 254 characters or fewer.")
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});
