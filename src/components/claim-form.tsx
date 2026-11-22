"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { createClaimAction, type ClaimFormState } from "@/lib/actions/claims";
import {
  fieldKeysForClaims,
  fieldLabels,
  type FieldKey,
} from "@/lib/domain/fields";
import { areaUnitLabels, areaUnitValues } from "@/lib/investigations/types";

const initialState: ClaimFormState = {};

export function ClaimForm({ investigationId }: { investigationId: string }) {
  const [state, formAction, pending] = useActionState(
    createClaimAction,
    initialState,
  );
  const [fieldKey, setFieldKey] = useState<FieldKey | "">("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border border-rule-strong bg-sheet p-4"
    >
      <input type="hidden" name="investigationId" value={investigationId} />
      <p className="mono-label">Record a statement from the seller</p>

      <div className="mt-3">
        <label htmlFor="claim-text" className="mono-label block">
          What was stated
        </label>
        <textarea
          id="claim-text"
          name="text"
          required
          minLength={3}
          maxLength={2000}
          rows={3}
          className="field-input mt-1"
          placeholder="For example: The plot is 2,000 sq ft and has no mortgage."
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem] sm:items-start">
        <div>
          <label htmlFor="claim-field" className="mono-label block">
            Compare against
          </label>
          <select
            id="claim-field"
            name="fieldKey"
            value={fieldKey}
            onChange={(event) =>
              setFieldKey(event.target.value as FieldKey | "")
            }
            className="field-input mt-1"
          >
            <option value="">Not linked to a field</option>
            {fieldKeysForClaims.map((key) => (
              <option key={key} value={key}>
                {fieldLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="claim-value" className="mono-label block">
            Value stated
          </label>
          <input
            id="claim-value"
            name="claimedValue"
            maxLength={500}
            className="field-input mt-1"
          />
        </div>
        {fieldKey === "area" ? (
          <div>
            <label htmlFor="claim-unit" className="mono-label block">
              Unit
            </label>
            <select
              id="claim-unit"
              name="claimedUnit"
              defaultValue=""
              className="field-input mt-1"
            >
              <option value="">No unit</option>
              {areaUnitValues.map((unit) => (
                <option key={unit} value={unit}>
                  {areaUnitLabels[unit]}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-muted">
        A statement is checked only against the values extracted from the
        uploaded documents. Supported or contradicted does not establish who is
        right.
      </p>

      <div className="mt-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving and analysing…" : "Save and check statement"}
        </Button>
      </div>

      {state.message ? (
        <div className="mt-3" aria-live="polite">
          <Notice tone={state.saved ? "ok" : "danger"}>{state.message}</Notice>
        </div>
      ) : null}
    </form>
  );
}
