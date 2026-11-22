"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Badge, Button, Notice } from "@/components/ui";
import {
  addFieldAction,
  deleteFieldAction,
  updateFieldAction,
  type FieldFormState,
} from "@/lib/actions/fields";
import {
  fieldKeyValues,
  fieldLabels,
  type FieldKey,
} from "@/lib/domain/fields";
import {
  areaUnitLabels,
  areaUnitValues,
  type AreaUnit,
} from "@/lib/investigations/types";

const initialState: FieldFormState = {};

function UnitSelect({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <select
      name="unit"
      defaultValue={defaultValue ?? ""}
      className="field-input mt-1"
    >
      <option value="">No unit</option>
      {areaUnitValues.map((unit) => (
        <option key={unit} value={unit}>
          {areaUnitLabels[unit]}
        </option>
      ))}
    </select>
  );
}

export function AddFieldForm({
  investigationId,
  documentId,
}: {
  investigationId: string;
  documentId: string;
}) {
  const [state, formAction, pending] = useActionState(
    addFieldAction,
    initialState,
  );
  const [fieldKey, setFieldKey] = useState<FieldKey>("owner_name");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-5 border border-rule-strong bg-paper p-4"
    >
      <input type="hidden" name="investigationId" value={investigationId} />
      <input type="hidden" name="documentId" value={documentId} />
      <p className="mono-label">Add a value manually</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto] sm:items-end">
        <div>
          <label htmlFor={`fieldKey-${documentId}`} className="mono-label block">
            Field
          </label>
          <select
            id={`fieldKey-${documentId}`}
            name="fieldKey"
            value={fieldKey}
            onChange={(event) => setFieldKey(event.target.value as FieldKey)}
            className="field-input mt-1"
          >
            {fieldKeyValues.map((key) => (
              <option key={key} value={key}>
                {fieldLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`value-${documentId}`} className="mono-label block">
            Value
          </label>
          <input
            id={`value-${documentId}`}
            name="value"
            required
            maxLength={1000}
            className="field-input mt-1"
          />
        </div>
        {fieldKey === "area" ? (
          <div>
            <label htmlFor={`unit-${documentId}`} className="mono-label block">
              Unit
            </label>
            <UnitSelect />
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        <Button
          type="submit"
          disabled={pending}
          className="px-3 py-2 text-[9.5px]"
        >
          {pending ? "Adding…" : "Add value"}
        </Button>
      </div>
      {state.message ? (
        <div className="mt-3" aria-live="polite">
          <Notice tone={state.saved ? "ok" : "danger"}>
            {state.message}
          </Notice>
        </div>
      ) : null}
    </form>
  );
}

export function FieldRow({
  investigationId,
  field,
}: {
  investigationId: string;
  field: {
    id: string;
    fieldKey: string;
    ordinal: number;
    value: string;
    unit: string | null;
    sourceText: string | null;
    userCorrected: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateFieldAction,
    initialState,
  );

  const label =
    field.fieldKey in fieldLabels
      ? fieldLabels[field.fieldKey as FieldKey]
      : field.fieldKey;
  const unit =
    field.unit && (areaUnitValues as readonly string[]).includes(field.unit)
      ? areaUnitLabels[field.unit as AreaUnit]
      : field.unit;

  return (
    <tr>
      <td className="whitespace-nowrap">
        {label}
        {field.ordinal > 0 ? (
          <span className="ml-1 font-mono text-[10px] text-muted">
            #{field.ordinal + 1}
          </span>
        ) : null}
      </td>
      <td>
        {editing ? (
          <form action={formAction} className="space-y-2">
            <input
              type="hidden"
              name="investigationId"
              value={investigationId}
            />
            <input type="hidden" name="fieldId" value={field.id} />
            <input type="hidden" name="fieldKey" value={field.fieldKey} />
            <input
              name="value"
              defaultValue={field.value}
              required
              maxLength={1000}
              className="field-input"
              aria-label={`Value for ${label}`}
            />
            {field.fieldKey === "area" ? (
              <UnitSelect defaultValue={field.unit} />
            ) : null}
            {state.message && !state.saved ? (
              <p className="text-xs text-danger" role="alert">
                {state.message}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={pending}
                className="px-3 py-1.5 text-[9.5px]"
              >
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-[9.5px]"
              >
                Cancel
              </Button>
            </div>
            {state.message ? (
              <p
                className={
                  state.saved ? "text-xs text-ok" : "text-xs text-danger"
                }
                role={state.saved ? "status" : "alert"}
              >
                {state.message}
              </p>
            ) : null}
          </form>
        ) : (
          <span>
            {field.value}
            {unit ? ` ${unit}` : ""}
            {field.userCorrected ? (
              <span className="ml-2">
                <Badge>Corrected</Badge>
              </span>
            ) : null}
          </span>
        )}
      </td>
      <td className="max-w-xs text-xs text-muted">
        {field.sourceText ? `“${field.sourceText}”` : "—"}
      </td>
      <td>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="px-2.5 py-1.5 text-[9.5px]"
            >
              Edit
            </Button>
          ) : null}
          <form action={deleteFieldAction}>
            <input
              type="hidden"
              name="investigationId"
              value={investigationId}
            />
            <input type="hidden" name="fieldId" value={field.id} />
            <Button
              type="submit"
              variant="danger"
              className="px-2.5 py-1.5 text-[9.5px]"
            >
              Remove
            </Button>
          </form>
        </div>
      </td>
    </tr>
  );
}
