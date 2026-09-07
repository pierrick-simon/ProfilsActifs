import { readFile, stat, unlink } from "fs/promises";
import path from "path";
import { persistBuffer, mimeTypeForExtension, UPLOADS_ROOT } from "@/lib/storage";
import type { StorableVideo, VideoProvider, VideoStatusResult } from "./types";

const VIDEO_KIND = "videos" as const;

/** Same pattern the old media route used to reject path traversal / unexpected names. */
const PROVIDER_ID_PATTERN = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/;

/**
 * Stores video files on local disk, outside `public/`, under `UPLOADS_ROOT/videos`.
 * Bytes are only ever reachable through `/api/videos/stream/[providerId]`, which
 * re-checks authorization on every request — the providerId itself grants nothing.
 */
export class LocalVideoProvider implements VideoProvider {
  readonly name = "local";

  async store(file: StorableVideo): Promise<string> {
    const { filename } = await persistBuffer(file.bytes, file.mimeType, VIDEO_KIND);
    return filename;
  }

  async status(providerId: string): Promise<VideoStatusResult> {
    if (!PROVIDER_ID_PATTERN.test(providerId)) {
      return { status: "failed", message: "Identifiant de vidéo invalide." };
    }
    try {
      await stat(this.pathFor(providerId));
      return { status: "ready" };
    } catch {
      return { status: "failed", message: "Fichier vidéo introuvable sur le disque." };
    }
  }

  async playbackUrl(providerId: string): Promise<string | null> {
    const result = await this.status(providerId);
    if (result.status !== "ready") {
      return null;
    }
    return `/api/videos/stream/${providerId}`;
  }

  async delete(providerId: string): Promise<void> {
    if (!PROVIDER_ID_PATTERN.test(providerId)) {
      return;
    }
    try {
      await unlink(this.pathFor(providerId));
    } catch {
      // Already gone (or never existed) — delete() is idempotent by contract.
    }
  }

  /** Used only by the stream route, after it has already authorized the request. */
  async readBytes(providerId: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
    if (!PROVIDER_ID_PATTERN.test(providerId)) {
      return null;
    }
    const extension = providerId.split(".").pop()!;
    const mimeType = mimeTypeForExtension(extension);
    if (!mimeType) {
      return null;
    }
    try {
      const bytes = await readFile(this.pathFor(providerId));
      return { bytes, mimeType };
    } catch {
      return null;
    }
  }

  private pathFor(providerId: string): string {
    return path.join(UPLOADS_ROOT, VIDEO_KIND, providerId);
  }
}
