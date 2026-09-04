import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOADS_ROOT =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

export const MEDIA_URL_PREFIX = "/api/media";

export type MediaKind = "videos" | "images";

export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MO
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/ogg",
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MO
export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const EXTENSION_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/ogg": "ogv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME).map(([mime, extension]) => [extension, mime]),
);

export function extensionForMimeType(mimeType: string): string | null {
  return EXTENSION_BY_MIME[mimeType] ?? null;
}

export function mimeTypeForExtension(extension: string): string | null {
  return MIME_BY_EXTENSION[extension] ?? null;
}

export class FileTooLargeError extends Error {}
export class UnsupportedMediaTypeError extends Error {}
export class InvalidSourceUrlError extends Error {}
export class SourceFetchFailedError extends Error {}

async function persistBuffer(
  bytes: Buffer,
  mimeType: string,
  kind: MediaKind,
): Promise<{ filename: string; url: string }> {
  const extension = extensionForMimeType(mimeType);
  if (!extension) {
    throw new UnsupportedMediaTypeError(`Unsupported content type: ${mimeType || "unknown"}`);
  }

  const filename = `${randomUUID()}.${extension}`;
  const dir = path.join(UPLOADS_ROOT, kind);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return { filename, url: `${MEDIA_URL_PREFIX}/${kind}/${filename}` };
}

export async function saveUploadedFile(
  file: File,
  kind: MediaKind,
): Promise<{ filename: string; url: string }> {
  return persistBuffer(Buffer.from(await file.arrayBuffer()), file.type, kind);
}

export async function saveFileFromUrl(
  sourceUrl: string,
  kind: MediaKind,
  maxSizeBytes: number,
  allowedMimeTypes: string[],
): Promise<{ filename: string; url: string }> {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new InvalidSourceUrlError("Malformed URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidSourceUrlError("Only http(s) URLs are supported");
  }

  let response: Response;
  try {
    response = await fetch(parsed);
  } catch {
    throw new SourceFetchFailedError("Could not reach the given URL");
  }
  if (!response.ok || !response.body) {
    throw new SourceFetchFailedError(`Source URL returned status ${response.status}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new UnsupportedMediaTypeError(`Unsupported content type: ${mimeType || "unknown"}`);
  }

  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maxSizeBytes) {
    throw new FileTooLargeError();
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxSizeBytes) {
      await reader.cancel();
      throw new FileTooLargeError();
    }
    chunks.push(value);
  }

  return persistBuffer(Buffer.concat(chunks), mimeType, kind);
}

export async function deleteUploadedFileByUrl(url: string | null | undefined) {
  if (!url || !url.startsWith(`${MEDIA_URL_PREFIX}/`)) return;

  const [, , , kind, filename] = url.split("/");
  if (kind !== "videos" && kind !== "images") return;
  if (!filename || filename.includes("..") || filename.includes("/")) return;

  try {
    await unlink(path.join(UPLOADS_ROOT, kind, filename));
  } catch {
    // File already gone or never existed on disk — nothing to clean up.
  }
}
