import { LocalVideoProvider } from "./local-provider";
import { PeerTubeStubProvider } from "./peertube-stub-provider";
import type { VideoProvider } from "./types";

const providers: Record<string, VideoProvider> = {
  local: new LocalVideoProvider(),
  "peertube-stub": new PeerTubeStubProvider(),
};

/** Resolves a provider by its stored name — used to read back videos regardless of which provider was active when they were created. */
export function getVideoProvider(name: string): VideoProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown video provider "${name}"`);
  }
  return provider;
}

/** The provider new uploads go to. Switching VIDEO_PROVIDER only affects videos created after the switch. */
export function getActiveVideoProvider(): VideoProvider {
  return getVideoProvider(process.env.VIDEO_PROVIDER ?? "local");
}
