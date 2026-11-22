import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { pdf } from "pdf-to-img";
import type { AcceptedMimeType } from "./file-types";
import { recognizeImage } from "./ocr";

const maxOcrPages = 8;
const minTextLayerCharacters = 80;

export type ExtractionStatus = "extracted" | "ocr" | "empty";

export type ExtractionResult = {
  text: string;
  pageCount: number | null;
  status: ExtractionStatus;
  note: string | null;
};

function countedCharacters(value: string) {
  return (value.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

async function readPdfTextLayer(data: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const require = createRequire(import.meta.url);
  const pdfjsUrl = pathToFileURL(require.resolve("pdfjs-dist/package.json"));
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
    standardFontDataUrl: `${fileURLToPath(new URL("standard_fonts", pdfjsUrl))}/`,
    wasmUrl: `${fileURLToPath(new URL("wasm", pdfjsUrl))}/`,
  });
  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) =>
          "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "",
        )
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
      pages.push(text);
      page.cleanup();
    }

    return { text: pages.join("\n\n"), pageCount: document.numPages };
  } finally {
    await loadingTask.destroy();
  }
}

async function readPdfPages(data: Uint8Array) {
  const document = await pdf(Buffer.from(data), { scale: 2 });
  const pageCount = document.length;
  const pagesToRead = Math.min(pageCount, maxOcrPages);
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const image = await document.getPage(pageNumber);
      pages.push(await recognizeImage(image));
    }
  } finally {
    await document.destroy();
  }

  return { text: pages.join("\n\n"), pageCount, pagesToRead };
}

function ocrPageNote(pageCount: number, pagesToRead: number) {
  if (pageCount > pagesToRead) {
    return `The file has ${pageCount} pages. Only the first ${pagesToRead} were read with OCR. Upload the remaining pages separately if they matter.`;
  }

  return "The text was read with OCR. Check the extracted fields against the uploaded copy.";
}

export async function extractDocumentText(input: {
  mimeType: AcceptedMimeType;
  data: Uint8Array;
}): Promise<ExtractionResult> {
  if (input.mimeType === "application/pdf") {
    try {
      const layer = await readPdfTextLayer(input.data);

      if (countedCharacters(layer.text) >= minTextLayerCharacters) {
        return {
          text: layer.text,
          pageCount: layer.pageCount,
          status: "extracted",
          note: null,
        };
      }
    } catch {
      // A PDF without a readable text layer is handled by OCR below.
    }

    const ocr = await readPdfPages(input.data);

    if (countedCharacters(ocr.text) === 0) {
      return {
        text: "",
        pageCount: ocr.pageCount,
        status: "empty",
        note: "No text could be read from this PDF. Upload a clearer copy or add the fields manually.",
      };
    }

    return {
      text: ocr.text,
      pageCount: ocr.pageCount,
      status: "ocr",
      note: ocrPageNote(ocr.pageCount, ocr.pagesToRead),
    };
  }

  const text = await recognizeImage(input.data);

  if (countedCharacters(text) === 0) {
    return {
      text: "",
      pageCount: 1,
      status: "empty",
      note: "No text could be read from this image. Upload a clearer copy or add the fields manually.",
    };
  }

  return {
    text,
    pageCount: 1,
    status: "ocr",
    note: "The text was read with OCR. Check the extracted fields against the uploaded copy.",
  };
}
