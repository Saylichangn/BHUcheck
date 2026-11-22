import { ExtractionBadge } from "@/components/badges";
import { AddFieldForm, FieldRow } from "@/components/field-editors";
import { Badge, Button, Notice } from "@/components/ui";
import { deleteDocumentAction } from "@/lib/actions/documents";
import {
  acceptAttribute,
  formatFileSize,
  maxUploadBytes,
} from "@/lib/documents/file-types";
import {
  documentTypeLabels,
  documentTypeValues,
  isDocumentType,
} from "@/lib/documents/types";
import { formatDateTime } from "@/lib/format";
import type { InvestigationDetail } from "@/lib/investigations/service";

export const uploadMessages: Record<
  string,
  { tone: "ok" | "warn" | "danger"; title: string; message: string }
> = {
  ok: {
    tone: "ok",
    title: "File uploaded",
    message:
      "Text extraction has run. Check the extraction status and the values read below.",
  },
  no_file: {
    tone: "warn",
    title: "No file chosen",
    message: "Choose a PDF, JPG or PNG file before uploading.",
  },
  too_large: {
    tone: "warn",
    title: "File too large",
    message: "The file is larger than 10 MB.",
  },
  bad_type: {
    tone: "warn",
    title: "File not accepted",
    message: "Choose a PDF, JPG or PNG file and select the document type.",
  },
  rate_limited: {
    tone: "warn",
    title: "Upload limit reached",
    message: "This account can upload 30 files per hour. Try again later.",
  },
  origin: {
    tone: "danger",
    title: "Upload not verified",
    message: "Reload the page and try the upload again.",
  },
  failed: {
    tone: "danger",
    title: "Upload failed",
    message:
      "The file could not be stored or read. Check that it opens normally, then try again.",
  },
};

export function UploadNotice({ result }: { result: string | null }) {
  if (!result) return null;

  const notice = uploadMessages[result];

  if (!notice) return null;

  return (
    <div className="mb-5">
      <Notice tone={notice.tone} title={notice.title}>
        {notice.message}
      </Notice>
    </div>
  );
}

export function DocumentsSection({
  investigationId,
  documents,
  uploadResult,
}: {
  investigationId: string;
  documents: InvestigationDetail["documents"];
  uploadResult: string | null;
}) {
  return (
    <>
      <UploadNotice result={uploadResult} />

      <form
        action={`/api/investigations/${investigationId}/documents`}
        method="post"
        encType="multipart/form-data"
        className="border border-ink bg-sheet"
      >
        <div className="border-b border-ink bg-forest px-5 py-3.5">
          <p className="mono-label text-lime">Upload a document</p>
        </div>
        <div className="p-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start">
          <div>
            <label htmlFor="document-type" className="mono-label block">
              Document type
            </label>
            <select
              id="document-type"
              name="type"
              required
              defaultValue=""
              className="field-input mt-1"
            >
              <option value="" disabled>
                Choose one
              </option>
              {documentTypeValues.map((type) => (
                <option key={type} value={type}>
                  {documentTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="document-file" className="mono-label block">
              File (PDF, JPG or PNG, up to 10 MB)
            </label>
            <input
              id="document-file"
              name="file"
              type="file"
              required
              accept={acceptAttribute}
              className="field-input mt-1 bg-sheet text-sm"
            />
          </div>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-rule pt-5">
            <p className="max-w-xl text-xs leading-relaxed text-muted">
              The file type is checked from the file contents, not the file
              name. The limit is {formatFileSize(maxUploadBytes)}. Scanned PDFs
              are read with OCR for up to the first 8 pages.
            </p>
            <Button type="submit" variant="primary">
              Upload and read
            </Button>
          </div>
        </div>
      </form>

      {documents.length === 0 ? (
        <div className="mt-5">
          <Notice title="No documents uploaded">
            Upload the copies you have. A 7/12 extract and the seller&apos;s
            sale deed are the usual starting points.
          </Notice>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto border border-ink bg-sheet">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">File</th>
                <th scope="col">Uploaded</th>
                <th scope="col">Size</th>
                <th scope="col">Text</th>
                <th scope="col">Values</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="whitespace-nowrap">
                    {isDocumentType(document.type)
                      ? documentTypeLabels[document.type]
                      : document.type}
                  </td>
                  <td>
                    <a
                      href={`/api/documents/${document.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {document.originalName}
                    </a>
                    {document.extractionNote ? (
                      <p className="mt-1 max-w-md text-xs text-muted">
                        {document.extractionNote}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDateTime(document.uploadedAt)}
                  </td>
                  <td className="whitespace-nowrap">
                    {formatFileSize(document.sizeBytes)}
                    {document.pageCount
                      ? ` · ${document.pageCount} page${
                          document.pageCount === 1 ? "" : "s"
                        }`
                      : ""}
                  </td>
                  <td>
                    <ExtractionBadge status={document.extractionStatus} />
                  </td>
                  <td>{document.fields.length}</td>
                  <td>
                    <form action={deleteDocumentAction}>
                      <input
                        type="hidden"
                        name="investigationId"
                        value={investigationId}
                      />
                      <input
                        type="hidden"
                        name="documentId"
                        value={document.id}
                      />
                      <Button
                        type="submit"
                        variant="danger"
                        className="px-2.5 py-1.5 text-[9.5px]"
                      >
                        Remove
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {documents.map((document) => (
        <details
          key={document.id}
          className="mt-4 border border-ink bg-sheet"
        >
          <summary className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
            <span className="text-sm font-medium">
              Extracted values ·{" "}
              {isDocumentType(document.type)
                ? documentTypeLabels[document.type]
                : document.type}
            </span>
            <span className="flex items-center gap-2">
              <Badge>{`${document.fields.length} value${
                document.fields.length === 1 ? "" : "s"
              }`}</Badge>
              <span className="text-xs text-muted">
                {document.originalName}
              </span>
            </span>
          </summary>
          <div className="border-t border-rule px-5 pb-5">
            {document.fields.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No values were read from this file. Add the details manually if
                you can see them on the copy.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="data-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th scope="col">Field</th>
                      <th scope="col">Value</th>
                      <th scope="col">Source text</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.fields.map((field) => (
                      <FieldRow
                        key={field.id}
                        investigationId={investigationId}
                        field={field}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AddFieldForm
              investigationId={investigationId}
              documentId={document.id}
            />
          </div>
        </details>
      ))}
    </>
  );
}
