import { Button, Notice } from "@/components/ui";
import { formatFileSize } from "@/lib/documents/file-types";
import { formatDateTime } from "@/lib/format";
import type { InvestigationDetail } from "@/lib/investigations/service";

const resultMessages: Record<
  string,
  { tone: "ok" | "danger"; title: string; message: string }
> = {
  ok: {
    tone: "ok",
    title: "Report generated",
    message:
      "The PDF is listed below. It is a snapshot of the investigation at the time it was generated.",
  },
  failed: {
    tone: "danger",
    title: "Report not generated",
    message:
      "The PDF could not be built. Try again. If it keeps failing, check the server log.",
  },
  origin: {
    tone: "danger",
    title: "Request not verified",
    message: "Reload the page before generating a report.",
  },
};

export function ReportsSection({
  investigationId,
  reports,
  result,
}: {
  investigationId: string;
  reports: InvestigationDetail["reports"];
  result: string | null;
}) {
  const notice = result ? resultMessages[result] : undefined;

  return (
    <>
      {notice ? (
        <div className="mb-4">
          <Notice tone={notice.tone} title={notice.title}>
            {notice.message}
          </Notice>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border border-rule-strong bg-sheet p-4">
        <p className="max-w-xl text-sm">
          Generate a dated PDF of the details, documents, comparison, seller
          statements, alerts and checklist. Generate a new version after the
          investigation changes.
        </p>
        <form action={`/api/investigations/${investigationId}/reports`} method="post">
          <Button type="submit" variant="primary">
            Generate PDF report
          </Button>
        </form>
      </div>

      {reports.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No reports generated yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border-t border-ink">
          <table className="data-table min-w-[600px]">
            <thead>
              <tr>
                <th scope="col">Version</th>
                <th scope="col">Generated</th>
                <th scope="col">Size</th>
                <th scope="col">File</th>
                <th scope="col">Download</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="font-mono text-xs">v{report.version}</td>
                  <td>{formatDateTime(report.generatedAt)}</td>
                  <td>{formatFileSize(report.sizeBytes)}</td>
                  <td>{report.fileName}</td>
                  <td>
                    <a
                      href={`/api/reports/${report.id}`}
                      className="btn no-underline"
                    >
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
