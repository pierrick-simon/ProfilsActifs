import { randomUUID } from "crypto";
import type { StorableVideo, VideoProvider, VideoStatusResult } from "./types";

const UNAVAILABLE_MESSAGE =
  "L'instance vidéo ministérielle (PeerTube) n'est pas encore raccordée. Votre vidéo sera disponible dès son ouverture.";

/**
 * Non-functional stand-in for the future PeerTube provider. It exists to prove the
 * abstraction holds and to exercise the degraded-mode path end to end: `store()`
 * accepts uploads (so the rest of the product keeps working), but `status()` always
 * reports the backend as unreachable and `playbackUrl()` never resolves to anything
 * playable. Select it with VIDEO_PROVIDER=peertube-stub.
 */
export class PeerTubeStubProvider implements VideoProvider {
  readonly name = "peertube-stub";

  async store(_file: StorableVideo): Promise<string> {
    return `peertube-stub:${randomUUID()}`;
  }

  async status(_providerId: string): Promise<VideoStatusResult> {
    return { status: "failed", message: UNAVAILABLE_MESSAGE };
  }

  async playbackUrl(_providerId: string): Promise<string | null> {
    return null;
  }

  async delete(_providerId: string): Promise<void> {
    // Nothing is ever persisted by this stub, so there is nothing to remove.
  }
}
