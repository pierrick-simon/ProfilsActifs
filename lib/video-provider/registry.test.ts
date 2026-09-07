import { describe, it, expect, afterEach } from "vitest";
import { getVideoProvider, getActiveVideoProvider } from "./registry";
import { LocalVideoProvider } from "./local-provider";
import { PeerTubeStubProvider } from "./peertube-stub-provider";

describe("video provider registry", () => {
  afterEach(() => {
    delete process.env.VIDEO_PROVIDER;
  });

  it("resolves providers by their stored name, independently of the active one", () => {
    expect(getVideoProvider("local")).toBeInstanceOf(LocalVideoProvider);
    expect(getVideoProvider("peertube-stub")).toBeInstanceOf(PeerTubeStubProvider);
  });

  it("rejects an unknown provider name instead of silently falling back", () => {
    expect(() => getVideoProvider("does-not-exist")).toThrow();
  });

  it("defaults the active provider to local when VIDEO_PROVIDER is unset", () => {
    delete process.env.VIDEO_PROVIDER;
    expect(getActiveVideoProvider()).toBeInstanceOf(LocalVideoProvider);
  });

  it("switches the active provider via the VIDEO_PROVIDER env var — this is the whole point: a config change, not a code change", () => {
    process.env.VIDEO_PROVIDER = "peertube-stub";
    expect(getActiveVideoProvider()).toBeInstanceOf(PeerTubeStubProvider);
  });
});
