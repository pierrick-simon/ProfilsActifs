import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOADS_ROOT =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

export const MEDIA_URL_PREFIX = "/api/media";

export type MediaKind = "videos" | "images";

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

export async function saveUploadedFile(
  file: File,
  kind: MediaKind,
): Promise<{ filename: string; url: string }> {
  const extension = extensionForMimeType(file.type);
  const filename = `${randomUUID()}.${extension}`;
  const dir = path.join(UPLOADS_ROOT, kind);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return { filename, url: `${MEDIA_URL_PREFIX}/${kind}/${filename}` };
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
