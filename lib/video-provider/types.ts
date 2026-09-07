/**
 * Contract every video backend (local disk today, PeerTube tomorrow) must satisfy.
 * Callers only ever see an opaque `providerId` — never a file path or a provider-specific URL.
 */

export type VideoProcessingStatus = "pending" | "ready" | "failed";

export interface VideoStatusResult {
  status: VideoProcessingStatus;
  /** Human-readable reason, shown to end users when status is not "ready". */
  message?: string;
}

export interface StorableVideo {
  bytes: Buffer;
  mimeType: string;
}

export interface VideoProvider {
  /** Stable key persisted in `video.provider`, used to route back to this implementation. */
  readonly name: string;

  /** Persists the video and returns an opaque identifier. Must not throw for a well-formed input. */
  store(file: StorableVideo): Promise<string>;

  /** Reports processing state. Must resolve even when the underlying backend is unreachable. */
  status(providerId: string): Promise<VideoStatusResult>;

  /** Returns a playable URL, or null when no playback is currently possible. */
  playbackUrl(providerId: string): Promise<string | null>;

  /** Removes the underlying bytes. Idempotent: deleting twice is not an error. */
  delete(providerId: string): Promise<void>;
}
