import { Button } from "@/components/ui";
import {
  acceptAttribute,
  formatFileSize,
  maxUploadBytes,
} from "@/lib/documents/file-types";
import { documentTypeLabels, documentTypeValues } from "@/lib/documents/types";
import { UploadNotice } from "./documents-section";

export function UploadSection({
  investigationId,
  uploadResult,
  documentCount,
}: {
  investigationId: string;
  uploadResult: string | null;
  documentCount: number;
}) {
  return (
    <>
      <UploadNotice result={uploadResult} />

      <form
        action={`/api/investigations/${investigationId}/documents`}
        method="post"
        encType="multipart/form-data"
        className="border border-rule-strong bg-sheet p-4"
      >
        <p className="mono-label">Upload a document</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label htmlFor="upload-document-type" className="mono-label block">
              Document type
            </label>
            <select
              id="upload-document-type"
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
            <label htmlFor="upload-document-file" className="mono-label block">
              File (PDF, JPG or PNG, up to 10 MB)
            </label>
            <input
              id="upload-document-file"
              name="file"
              type="file"
              required
              accept={acceptAttribute}
              className="field-input mt-1 bg-sheet text-sm"
            />
          </div>
          <Button type="submit" variant="primary">
            Upload and read
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          The file type is checked from the file contents, not the file name.
          The limit is {formatFileSize(maxUploadBytes)}. Scanned PDFs are read
          with OCR for up to the first 8 pages.
        </p>
      </form>

      <p className="mt-3 text-sm">
        {documentCount === 0
          ? "No documents uploaded yet. Start with a 7/12 if you have one."
          : `${documentCount} document${documentCount === 1 ? "" : "s"} uploaded.`}
      </p>
    </>
  );
}
