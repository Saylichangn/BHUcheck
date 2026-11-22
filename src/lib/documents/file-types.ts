export const maxUploadBytes = 10 * 1024 * 1024;

export type AcceptedMimeType = "application/pdf" | "image/jpeg" | "image/png";

export type AcceptedFileType = {
  mimeType: AcceptedMimeType;
  extension: "pdf" | "jpg" | "png";
  label: string;
};

export const acceptedFileTypes: AcceptedFileType[] = [
  { mimeType: "application/pdf", extension: "pdf", label: "PDF" },
  { mimeType: "image/jpeg", extension: "jpg", label: "JPG" },
  { mimeType: "image/png", extension: "png", label: "PNG" },
];

export const acceptAttribute = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

const pdfHeader = "%PDF-";
const jpegHeader = [0xff, 0xd8, 0xff];
const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;

  return signature.every((value, index) => bytes[index] === value);
}

export function detectFileType(bytes: Uint8Array): AcceptedFileType | null {
  const prefix = new TextDecoder("latin1").decode(
    bytes.subarray(0, Math.min(bytes.length, 1024)),
  );

  if (prefix.includes(pdfHeader)) {
    return acceptedFileTypes[0] ?? null;
  }

  if (startsWith(bytes, jpegHeader)) {
    return acceptedFileTypes[1] ?? null;
  }

  if (startsWith(bytes, pngHeader)) {
    return acceptedFileTypes[2] ?? null;
  }

  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
