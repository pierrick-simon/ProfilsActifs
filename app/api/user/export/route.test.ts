import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    account: { findMany: vi.fn() },
    session: { findMany: vi.fn() },
    video: { findMany: vi.fn() },
    userSkill: { findMany: vi.fn() },
    formResponse: { findMany: vi.fn() },
    favory: { findMany: vi.fn() },
    like: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
  },
}));

const mockSession = {
  user: {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
  },
};

const mockUser = {
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  acceptedTerms: true,
  showProfile: true,
  localisation: "Paris, France",
  dateOfBirth: new Date("2000-01-01T00:00:00.000Z"),
  certification: null,
  role: "candidate",
  banned: false,
  banReason: null,
  banExpires: null,
  activitySector: null,
};

function createGetRequest() {
  return new NextRequest("http://localhost:3000/api/user/export", {
    method: "GET",
  });
}

describe("GET /api/user/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.account.findMany).mockResolvedValue([]);
    vi.mocked(prisma.session.findMany).mockResolvedValue([]);
    vi.mocked(prisma.video.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userSkill.findMany).mockResolvedValue([]);
    vi.mocked(prisma.formResponse.findMany).mockResolvedValue([]);
    vi.mocked(prisma.favory.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when the user no longer exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns a full export of the user's data", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);
    vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
      {
        id: "acc-1",
        issuer: "google",
        providerId: "google",
        accountId: "acc-ext-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    vi.mocked(prisma.video.findMany).mockResolvedValueOnce([
      {
        id: "video-1",
        provider: "mux",
        providerId: "mux-1",
        status: "READY",
        views: 3,
        validated: true,
        createdAt: new Date(),
      },
    ] as never);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain(
      "user-data-export-user-123.json",
    );

    const json = await res.json();
    expect(json.profile.id).toBe("user-123");
    expect(json.accounts).toHaveLength(1);
    expect(json.accounts[0]).not.toHaveProperty("password");
    expect(json.accounts[0]).not.toHaveProperty("accessToken");
    expect(json.videos).toHaveLength(1);
    expect(json.favorites).toEqual({ given: [], received: [] });
    expect(json.likes).toEqual({ given: [], received: [] });
    expect(json.messages).toEqual({ sent: [], received: [] });
    expect(typeof json.exportedAt).toBe("string");
  });
});
