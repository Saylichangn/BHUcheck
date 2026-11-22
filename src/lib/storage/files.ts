import { createHash } from "node:crypto";
import {
  mkdir,
  readFile as readFileFromDisk,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";

function storageRoot() {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    getEnv().STORAGE_DIR,
  );
}

export function safeStorageSegment(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid storage path segment.");
  }

  return value;
}

function absolutePath(relativePath: string) {
  const root = storageRoot();
  const target = path.resolve(
    /* turbopackIgnore: true */ root,
    ...relativePath.split("/"),
  );

  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage path.");
  }

  return target;
}

export function sha256Of(buffer: Uint8Array) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function saveFile(relativePath: string, data: Uint8Array) {
  const target = absolutePath(relativePath);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data, { flag: "wx" });
}

export async function readFile(relativePath: string) {
  return readFileFromDisk(absolutePath(relativePath));
}

export async function deleteFile(relativePath: string) {
  await rm(absolutePath(relativePath), { force: true });
}

export async function deleteInvestigationStorage(
  userId: string,
  investigationId: string,
) {
  const relativePath = `${safeStorageSegment(userId)}/${safeStorageSegment(
    investigationId,
  )}`;

  await rm(absolutePath(relativePath), { recursive: true, force: true });
}

export async function deleteUserStorage(userId: string) {
  await rm(absolutePath(safeStorageSegment(userId)), {
    recursive: true,
    force: true,
  });
}
