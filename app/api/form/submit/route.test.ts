import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import * as formLib from "@/lib/form";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    formResponse: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

type MockSession = {
  user: { id: string; role: string };
  session?: { id: string; userId: string };
};

describe("POST /api/form/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/form/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("returns 401 Unauthorized when user is not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req = createRequest({ formVersion: 1, questionId: 1, response: "A" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when body is invalid JSON", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req = createRequest("{ invalid json ");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("returns 400 when form version is missing or invalid", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req1 = createRequest({ questionId: 1, response: "A" });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
    const req2 = createRequest({ formVersion: "invalid", questionId: 1, response: "A" });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("returns 400 when question ID is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req = createRequest({ formVersion: 1, response: "A" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Question ID is required");
  });

  it("returns 400 when response is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req = createRequest({ formVersion: 1, questionId: 1 });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Response is required");
  });

  it("returns 404 when form version does not exist", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req = createRequest({ formVersion: 99999, questionId: 1, response: "A" });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Form version not found");
  });

  it("returns 404 when question does not exist in form", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const req = createRequest({ formVersion: 1, questionId: 99999, response: "A" });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Question not found in form");
  });

  it("returns 400 when response is invalid for the question type", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    // Question 1 in v1 is single-choice, "Invalid choice" is not one of the choices
    const req = createRequest({ formVersion: 1, questionId: 1, response: "Invalid choice" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Response is not a valid choice");
  });

  it("successfully submits and saves a valid response", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", role: "user" },
    } as unknown as MockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const saveSpy = vi.spyOn(formLib, "saveFormResponse").mockResolvedValueOnce({
      id: "resp-123",
      userId: "user-123",
      questionId: "1",
      formVersionId: 1,
      response: "Répondre poliment en expliquant que le poste ne correspond pas à votre recherche",
      createdAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof formLib.saveFormResponse>>);

    const req = createRequest({
      formVersion: 1,
      questionId: 1,
      response: "Répondre poliment en expliquant que le poste ne correspond pas à votre recherche",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe("resp-123");
    expect(saveSpy).toHaveBeenCalledWith({
      userId: "user-123",
      questionId: 1,
      formVersionId: 1,
      response: "Répondre poliment en expliquant que le poste ne correspond pas à votre recherche",
    });
  });
});
