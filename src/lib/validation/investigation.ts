import { z } from "zod";
import { isMaharashtraDistrict } from "@/lib/domain/districts";
import {
  intendedUseValues,
  propertyTypeValues,
} from "@/lib/investigations/types";

const trimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer for the ${label}.`);

export const investigationSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "Give the investigation a name of at least 2 characters.")
    .max(120, "Use 120 characters or fewer for the name."),
  state: z.literal("Maharashtra"),
  district: z
    .string()
    .trim()
    .refine(
      isMaharashtraDistrict,
      "Choose a Maharashtra district from the list.",
    ),
  taluka: trimmed(120, "taluka").optional(),
  village: trimmed(120, "village").optional(),
  surveyNo: trimmed(80, "survey number").optional(),
  intendedUse: z.enum(intendedUseValues, {
    message: "Choose the intended use.",
  }),
  propertyType: z.enum(propertyTypeValues, {
    message: "Choose the property type.",
  }),
});

export const investigationUpdateSchema = investigationSchema;

export type InvestigationInput = z.infer<typeof investigationSchema>;
