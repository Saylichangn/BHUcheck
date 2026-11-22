import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const fontFiles = {
  Heading: {
    file: "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff",
    format: "woff",
  },
  HeadingDevanagari: {
    file: "node_modules/@expo-google-fonts/mukta/600SemiBold/Mukta_600SemiBold.ttf",
    format: "ttf",
  },
  Body: {
    file: "node_modules/@expo-google-fonts/mukta/400Regular/Mukta_400Regular.ttf",
    format: "ttf",
  },
  Mono: {
    file: "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff",
    format: "woff",
  },
} as const;

type ReportFonts = Record<keyof typeof fontFiles, Buffer>;

function woffToTtf(woff: Buffer) {
  if (woff.length < 44 || woff.readUInt32BE(0) !== 0x774f4646) {
    throw new Error("The report font is not a WOFF file.");
  }

  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const entries: Array<{
    tag: number;
    origLength: number;
    checksum: number;
    data: Buffer;
  }> = [];

  for (let index = 0; index < numTables; index += 1) {
    const base = 44 + index * 20;

    if (base + 20 > woff.length) {
      throw new Error("The report font is truncated.");
    }

    const tag = woff.readUInt32BE(base);
    const offset = woff.readUInt32BE(base + 4);
    const compLength = woff.readUInt32BE(base + 8);
    const origLength = woff.readUInt32BE(base + 12);
    const checksum = woff.readUInt32BE(base + 16);
    const raw = woff.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : Buffer.from(raw);

    if (data.length !== origLength) {
      throw new Error("The report font has an unexpected table length.");
    }

    entries.push({ tag, origLength, checksum, data });
  }

  entries.sort((left, right) => left.tag - right.tag);

  let power = 1;
  let selector = 0;

  while (power * 2 <= numTables) {
    power *= 2;
    selector += 1;
  }

  const searchRange = power * 16;
  const rangeShift = numTables * 16 - searchRange;
  const header = Buffer.alloc(12);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(selector, 8);
  header.writeUInt16BE(rangeShift, 10);

  let tableOffset = 12 + numTables * 16;
  const records: Buffer[] = [];
  const tableData: Buffer[] = [];

  for (const entry of entries) {
    const paddedLength = (entry.origLength + 3) & ~3;
    const record = Buffer.alloc(16);
    record.writeUInt32BE(entry.tag, 0);
    record.writeUInt32BE(entry.checksum, 4);
    record.writeUInt32BE(tableOffset, 8);
    record.writeUInt32BE(entry.origLength, 12);
    records.push(record);

    const padded = Buffer.alloc(paddedLength);
    entry.data.copy(padded);
    tableData.push(padded);
    tableOffset += paddedLength;
  }

  return Buffer.concat([header, ...records, ...tableData]);
}

let cachedFonts: Promise<ReportFonts> | null = null;

export function loadReportFonts(): Promise<ReportFonts> {
  if (!cachedFonts) {
    cachedFonts = (async () => {
      const entries = await Promise.all(
        (
          Object.entries(fontFiles) as Array<
            [keyof typeof fontFiles, (typeof fontFiles)[keyof typeof fontFiles]]
          >
        ).map(async ([name, source]) => {
          const data = await readFile(
            path.resolve(
              /* turbopackIgnore: true */ process.cwd(),
              source.file,
            ),
          );
          return [
            name,
            source.format === "woff" ? woffToTtf(data) : data,
          ] as const;
        }),
      );

      return Object.fromEntries(entries) as ReportFonts;
    })().catch((error: unknown) => {
      cachedFonts = null;
      throw error;
    });
  }

  return cachedFonts;
}
