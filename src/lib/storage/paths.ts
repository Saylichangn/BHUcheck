import type { AcceptedFileType } from "@/lib/documents/file-types";
import { safeStorageSegment } from "./files";

export function documentStoragePath(input: {
  userId: string;
  investigationId: string;
  documentId: string;
  extension: AcceptedFileType["extension"];
}) {
  return [
    safeStorageSegment(input.userId),
    safeStorageSegment(input.investigationId),
    `${safeStorageSegment(input.documentId)}.${input.extension}`,
  ].join("/");
}

export function reportStoragePath(input: {
  userId: string;
  investigationId: string;
  reportId: string;
}) {
  return [
    safeStorageSegment(input.userId),
    safeStorageSegment(input.investigationId),
    "reports",
    `${safeStorageSegment(input.reportId)}.pdf`,
  ].join("/");
}
