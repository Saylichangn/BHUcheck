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
        className="border border-ink bg-sheet"
      >
        <div className="border-b border-ink bg-forest px-5 py-3.5">
          <p className="mono-label text-lime">Upload a document</p>
        </div>
        <div className="p-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start">
            <div>
              <label htmlFor="upload-document-type" className="mono-label block">
                Document type
              </label>
              <select
                id="upload-document-type"
                name="type"
                required
                defaultValue=""
                className="field-input mt-1.5"
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
              <label
                htmlFor="upload-document-file"
                className="mono-label block"
              >
                File (PDF, JPG or PNG, up to 10 MB)
              </label>
              <input
                id="upload-document-file"
                name="file"
                type="file"
                required
                accept={acceptAttribute}
                className="field-input mt-1.5 bg-sheet text-sm"
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

      <p className="mt-4 text-sm">
        {documentCount === 0
          ? "No documents uploaded yet. Start with a 7/12 if you have one."
          : `${documentCount} document${documentCount === 1 ? "" : "s"} uploaded.`}
      </p>
    </>
  );
}
