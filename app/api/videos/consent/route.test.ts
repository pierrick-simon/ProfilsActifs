import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "./route";
import { auth } from "@/lib/auth";
import * as videoConsentLib from "@/lib/video-consent";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/video-consent", () => ({
  getVideoConsent: vi.fn(),
  grantVideoConsent: vi.fn(),
  revokeVideoConsent: vi.fn(),
}));

const mockSession = {
  user: { id: "user-123", name: "John Doe", email: "john@example.com" },
};

function makeRequest(method: string) {
  return new NextRequest("http://localhost:3000/api/videos/consent", { method });
}

describe("/api/videos/consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await GET(makeRequest("GET"));
      expect(res.status).toBe(401);
    });

    it("returns the current consent status", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      vi.mocked(videoConsentLib.getVideoConsent).mockResolvedValueOnce({
        granted: false,
        grantedAt: null,
        revokedAt: null,
      });

      const res = await GET(makeRequest("GET"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.granted).toBe(false);
      expect(videoConsentLib.getVideoConsent).toHaveBeenCalledWith("user-123");
    });
  });

  describe("POST", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await POST(makeRequest("POST"));
      expect(res.status).toBe(401);
    });

    it("grants consent for the authenticated user", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      const grantedAt = new Date();
      vi.mocked(videoConsentLib.grantVideoConsent).mockResolvedValueOnce({
        granted: true,
        grantedAt,
        revokedAt: null,
      });

      const res = await POST(makeRequest("POST"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.granted).toBe(true);
      expect(videoConsentLib.grantVideoConsent).toHaveBeenCalledWith("user-123");
    });
  });

  describe("DELETE", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await DELETE(makeRequest("DELETE"));
      expect(res.status).toBe(401);
    });

    it("revokes consent and reports how many videos were deleted", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      const revokedAt = new Date();
      vi.mocked(videoConsentLib.revokeVideoConsent).mockResolvedValueOnce({
        consent: { granted: false, grantedAt: null, revokedAt },
        deletedVideos: 3,
      });

      const res = await DELETE(makeRequest("DELETE"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.granted).toBe(false);
      expect(json.deletedVideos).toBe(3);
      expect(videoConsentLib.revokeVideoConsent).toHaveBeenCalledWith("user-123");
    });
  });
});
