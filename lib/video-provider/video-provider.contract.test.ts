import { describe, it, expect, beforeEach } from "vitest";
import { LocalVideoProvider } from "./local-provider";
import { PeerTubeStubProvider } from "./peertube-stub-provider";
import type { VideoProvider } from "./types";

/**
 * One suite, run against every VideoProvider implementation. It proves the abstraction
 * itself holds — not just that one implementation happens to work — by asserting the
 * behavior every caller is allowed to rely on, including what "unavailable" must look
 * like. If a case here only makes sense for one provider, that's a sign the interface
 * leaked an implementation detail and needs revisiting, not a sign the test is wrong.
 */

const sampleVideo = { bytes: Buffer.from("not-really-a-video-but-thats-fine"), mimeType: "video/mp4" };

type Scenario = {
  name: string;
  createProvider: () => VideoProvider;
  /** Whether a video stored through this provider is expected to ever become playable. */
  isFunctional: boolean;
};

const scenarios: Scenario[] = [
  { name: "LocalVideoProvider", createProvider: () => new LocalVideoProvider(), isFunctional: true },
  {
    name: "PeerTubeStubProvider (fournisseur indisponible par construction)",
    createProvider: () => new PeerTubeStubProvider(),
    isFunctional: false,
  },
];

describe.each(scenarios)("VideoProvider contract — $name", ({ createProvider, isFunctional }) => {
  let provider: VideoProvider;

  beforeEach(() => {
    provider = createProvider();
  });

  it("expose un nom de fournisseur stable et non vide", () => {
    expect(provider.name).toBeTruthy();
  });

  it("store() renvoie un identifiant opaque non vide", async () => {
    const providerId = await provider.store(sampleVideo);
    expect(typeof providerId).toBe("string");
    expect(providerId.length).toBeGreaterThan(0);
  });

  it("delete() est idempotent : un second appel ne lève pas d'exception", async () => {
    const providerId = await provider.store(sampleVideo);
    await provider.delete(providerId);
    await expect(provider.delete(providerId)).resolves.not.toThrow();
  });

  it("status() sur un identifiant inconnu ne lève pas d'exception", async () => {
    await expect(provider.status("does-not-exist.mp4")).resolves.toBeDefined();
  });

  it("playbackUrl() sur un identifiant inconnu ne lève pas d'exception", async () => {
    await expect(provider.playbackUrl("does-not-exist.mp4")).resolves.toBeDefined();
  });

  if (isFunctional) {
    it("après store(), status() devient ready et playbackUrl() renvoie une URL exploitable", async () => {
      const providerId = await provider.store(sampleVideo);

      const status = await provider.status(providerId);
      expect(status.status).toBe("ready");

      const url = await provider.playbackUrl(providerId);
      expect(url).toBeTruthy();
    });

    it("delete() fait réellement disparaître la vidéo : status() et playbackUrl() basculent ensuite en échec", async () => {
      const providerId = await provider.store(sampleVideo);
      await provider.delete(providerId);

      const status = await provider.status(providerId);
      expect(status.status).toBe("failed");
      expect(await provider.playbackUrl(providerId)).toBeNull();
    });
  } else {
    it("mode dégradé : status() rapporte systématiquement un échec, avec un message explicite", async () => {
      const providerId = await provider.store(sampleVideo);

      const status = await provider.status(providerId);
      expect(status.status).toBe("failed");
      expect(status.message).toBeTruthy();
    });

    it("mode dégradé : playbackUrl() ne renvoie jamais d'URL exploitable", async () => {
      const providerId = await provider.store(sampleVideo);
      expect(await provider.playbackUrl(providerId)).toBeNull();
    });
  }
});
