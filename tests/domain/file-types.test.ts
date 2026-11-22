import { describe, expect, it } from "vitest";
import {
  detectFileType,
  formatFileSize,
  maxUploadBytes,
} from "@/lib/documents/file-types";

function bytesOf(...values: number[]) {
  return Uint8Array.from(values);
}

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

describe("uploaded file types", () => {
  it("recognises a PDF from its header, not its name", () => {
    expect(detectFileType(textBytes("%PDF-1.7\n"))?.mimeType).toBe(
      "application/pdf",
    );
    expect(
      detectFileType(textBytes("some leading bytes\n%PDF-1.4\n"))?.mimeType,
    ).toBe("application/pdf");
  });

  it("recognises JPEG and PNG signatures", () => {
    expect(detectFileType(bytesOf(0xff, 0xd8, 0xff, 0xe0))?.extension).toBe(
      "jpg",
    );
    expect(
      detectFileType(
        bytesOf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00),
      )?.extension,
    ).toBe("png");
  });

  it("rejects anything else, including a renamed text file", () => {
    expect(detectFileType(textBytes("This is not a document."))).toBeNull();
    expect(detectFileType(new Uint8Array())).toBeNull();
  });

  it("keeps the upload limit at 10 MB", () => {
    expect(maxUploadBytes).toBe(10 * 1024 * 1024);
  });

  it("formats sizes for the upload list", () => {
    expect(formatFileSize(900)).toBe("900 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
