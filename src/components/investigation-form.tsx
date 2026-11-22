"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Notice } from "@/components/ui";
import {
  createInvestigationAction,
  updateInvestigationAction,
  type InvestigationFormState,
} from "@/lib/actions/investigations";
import {
  intendedUseLabels,
  intendedUseValues,
  propertyTypeLabels,
  propertyTypeValues,
  type IntendedUse,
  type PropertyType,
} from "@/lib/investigations/types";
import { maharashtraDistricts } from "@/lib/domain/districts";

const initialState: InvestigationFormState = {};

export type InvestigationFormValues = {
  id?: string;
  nickname?: string;
  district?: string;
  taluka?: string | null;
  village?: string | null;
  surveyNo?: string | null;
  intendedUse?: IntendedUse;
  propertyType?: PropertyType;
};

export function InvestigationForm({
  mode,
  values = {},
}: {
  mode: "create" | "edit";
  values?: InvestigationFormValues;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createInvestigationAction : updateInvestigationAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-5">
      {state.message ? (
        <Notice tone="danger" title="Could not save">
          {state.message}
        </Notice>
      ) : null}

      <div className="border border-ink bg-sheet">
        <div className="space-y-7 p-5 sm:p-7">
          {values.id ? (
            <input type="hidden" name="investigationId" value={values.id} />
          ) : null}
          <input type="hidden" name="state" value="Maharashtra" />

          <div>
            <label htmlFor="nickname" className="mono-label block">
              Investigation name
            </label>
            <input
              id="nickname"
              name="nickname"
              required
              minLength={2}
              maxLength={120}
              defaultValue={values.nickname}
              className="field-input mt-1.5"
              placeholder="For example: Kothrud plot, seller Mr Deshmukh"
            />
          </div>

          <div className="grid gap-6 border-t border-rule pt-7 sm:grid-cols-2">
            <div>
              <label htmlFor="district" className="mono-label block">
                District
              </label>
              <select
                id="district"
                name="district"
                required
                defaultValue={values.district ?? ""}
                className="field-input mt-1.5"
              >
                <option value="" disabled>
                  Choose a district
                </option>
                {maharashtraDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="taluka" className="mono-label block">
                Taluka{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="taluka"
                name="taluka"
                maxLength={120}
                defaultValue={values.taluka ?? ""}
                className="field-input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="village" className="mono-label block">
                Village or locality{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="village"
                name="village"
                maxLength={120}
                defaultValue={values.village ?? ""}
                className="field-input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="surveyNo" className="mono-label block">
                Survey / gat / CTS number{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="surveyNo"
                name="surveyNo"
                maxLength={80}
                defaultValue={values.surveyNo ?? ""}
                className="field-input mt-1.5"
              />
            </div>
          </div>

          <div className="grid gap-6 border-t border-rule pt-7 sm:grid-cols-2">
            <div>
              <label htmlFor="propertyType" className="mono-label block">
                Property type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                required
                defaultValue={values.propertyType ?? "plot"}
                className="field-input mt-1.5"
              >
                {propertyTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {propertyTypeLabels[value]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="intendedUse" className="mono-label block">
                Intended use
              </label>
              <select
                id="intendedUse"
                name="intendedUse"
                required
                defaultValue={values.intendedUse ?? ""}
                className="field-input mt-1.5"
              >
                <option value="" disabled>
                  Choose one
                </option>
                {intendedUseValues.map((value) => (
                  <option key={value} value={value}>
                    {intendedUseLabels[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="border-t border-rule pt-5 text-xs leading-relaxed text-muted">
            State is fixed to Maharashtra in this version. The details you enter
            are used in the comparison table and checklist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink bg-paper px-5 py-4 sm:px-7">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create investigation"
                : "Save changes"}
          </Button>
          <Link
            href={
              mode === "edit" && values.id
                ? `/investigations/${values.id}`
                : "/investigations"
            }
            className="btn no-underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
