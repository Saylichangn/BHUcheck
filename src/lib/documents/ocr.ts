import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { createWorker, OEM, type Worker } from "tesseract.js";

const require = createRequire(import.meta.url);
const dataVersion = "4.0.0";

function packageDirectory(name: string) {
  return path.dirname(
    require.resolve(`@tesseract.js-data/${name}/package.json`),
  );
}

function toPosixPath(value: string) {
  return value.replaceAll("\\", "/");
}

async function prepareLanguageData() {
  const languageDirectory = path.join(
    os.tmpdir(),
    `bhucheck-tesseract-${dataVersion}`,
  );

  await mkdir(languageDirectory, { recursive: true });

  for (const language of ["eng", "mar"]) {
    const source = path.join(
      packageDirectory(language),
      dataVersion,
      `${language}.traineddata.gz`,
    );
    const target = path.join(
      languageDirectory,
      `${language}.traineddata.gz`,
    );

    try {
      await copyFile(source, target);
    } catch {
      // Another request may have written the file already.
    }
  }

  return toPosixPath(languageDirectory);
}

type OcrState = {
  worker: Promise<Worker> | null;
  queue: Promise<unknown>;
};

const globalForOcr = globalThis as typeof globalThis & {
  bhucheckOcr?: OcrState;
};

const state: OcrState =
  globalForOcr.bhucheckOcr ?? { worker: null, queue: Promise.resolve() };

if (process.env.NODE_ENV !== "production") {
  globalForOcr.bhucheckOcr = state;
}

async function getWorker() {
  if (!state.worker) {
    state.worker = (async () => {
      const langPath = await prepareLanguageData();

      return createWorker(["eng", "mar"], OEM.LSTM_ONLY, {
        langPath,
        cachePath: langPath,
        gzip: true,
      });
    })().catch((error: unknown) => {
      state.worker = null;
      throw error;
    });
  }

  return state.worker;
}

export async function recognizeImage(image: Uint8Array) {
  const run = state.queue.then(async () => {
    const worker = await getWorker();
    const result = await worker.recognize(Buffer.from(image));
    return result.data.text;
  });

  state.queue = run.catch(() => undefined);

  return run;
}

export async function disposeOcrWorker() {
  if (!state.worker) return;

  const worker = await state.worker.catch(() => null);
  state.worker = null;

  await worker?.terminate();
}
