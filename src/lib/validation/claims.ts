import { z } from "zod";
import { fieldKeyValues, fieldKeysForClaims } from "@/lib/domain/fields";
import { areaUnitValues } from "@/lib/investigations/types";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const claimSchema = z
  .object({
    fieldKey: z.preprocess(
      emptyToNull,
      z.enum(fieldKeysForClaims).nullable(),
    ),
    text: z
      .string()
      .trim()
      .min(3, "Describe the seller's statement.")
      .max(2000, "Use 2000 characters or fewer."),
    claimedValue: z.preprocess(
      emptyToNull,
      z.string().trim().max(500, "Use 500 characters or fewer.").nullable(),
    ),
    claimedUnit: z.preprocess(
      emptyToNull,
      z.enum(areaUnitValues).nullable(),
    ),
  })
  .superRefine((claim, context) => {
    if (claim.fieldKey && !claim.claimedValue) {
      context.addIssue({
        code: "custom",
        message: "Enter the value the seller states, or choose 'Not linked to a field'.",
        path: ["claimedValue"],
      });
    }

    if (claim.fieldKey !== "area" && claim.claimedUnit) {
      context.addIssue({
        code: "custom",
        message: "A unit is only used for area statements.",
        path: ["claimedUnit"],
      });
    }
  });

export const fieldSchema = z
  .object({
    fieldKey: z.enum(fieldKeyValues, {
      message: "Choose the field this value belongs to.",
    }),
    value: z
      .string()
      .trim()
      .min(1, "Enter the value.")
      .max(1000, "Use 1000 characters or fewer."),
    unit: z.preprocess(emptyToNull, z.enum(areaUnitValues).nullable()),
  })
  .superRefine((field, context) => {
    if (field.fieldKey !== "area" && field.unit) {
      context.addIssue({
        code: "custom",
        message: "A unit is only used for an area value.",
        path: ["unit"],
      });
    }
  });
