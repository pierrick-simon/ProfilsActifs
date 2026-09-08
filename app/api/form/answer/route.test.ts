import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { auth } from "@/lib/auth";
import * as formLib from "@/lib/form";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/form", async (importOriginal) => {
  const actual = await importOriginal<typeof formLib>();
  return {
    ...actual,
    saveFormResponse: vi.fn(),
    getUserFormResponse: vi.fn(),
    areAllQuestionsAnswered: vi.fn(),
    areAllAnswersCorrect: vi.fn(),
    setUserCertified: vi.fn(),
  };
});

const mockSession = {
  user: {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
  },
};

describe("/api/form/answer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/form/answer", () => {
    function createPostRequest(body: unknown, headers: Record<string, string> = {}) {
      return new NextRequest("http://localhost:3000/api/form/answer", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...headers,
        },
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
    }

    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 1,
        response: "Paris",
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 on invalid JSON body", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = new NextRequest("http://localhost:3000/api/form/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "invalid-json{",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON body");
    });

    it("returns 400 when formVersion is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        questionId: 1,
        response: "Paris",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Form version is required");
    });

    it("returns 400 when formVersion is invalid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        formVersion: "not-a-number",
        questionId: 1,
        response: "Paris",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid form version");
    });

    it("returns 400 when questionId is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        formVersion: 1,
        response: "Paris",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Question ID is required");
    });

    it("returns 400 when response is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 1,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Response is required");
    });

    it("returns 404 when form version does not exist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        formVersion: 99999,
        questionId: 1,
        response: "Paris",
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Form version not found");
    });

    it("returns 404 when question is not found in form", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 99999,
        response: "Paris",
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Question not found in form");
    });

    it("returns 400 when response format is invalid for the question type", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 1,
        response: "Not a valid option from choices",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("successfully saves response and returns allAnswered: false when questions remain", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      vi.mocked(formLib.saveFormResponse).mockResolvedValueOnce({
        id: "resp-123",
        userId: "user-123",
        questionId: "1",
        formVersionId: 1,
        response: "Répondre poliment en expliquant que le poste ne correspond pas à votre recherche",
        createdAt: new Date(),
      });
      vi.mocked(formLib.areAllQuestionsAnswered).mockResolvedValueOnce(false);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 1,
        response: "Répondre poliment en expliquant que le poste ne correspond pas à votre recherche",
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("resp-123");
      expect(json.allAnswered).toBe(false);
      expect(formLib.setUserCertified).not.toHaveBeenCalled();
    });

    it("successfully saves response, returns allAnswered: true, and certifies user when all answers are correct", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      vi.mocked(formLib.saveFormResponse).mockResolvedValueOnce({
        id: "resp-final",
        userId: "user-123",
        questionId: "20",
        formVersionId: 1,
        response: ["Remercier et prendre en compte le retour"],
        createdAt: new Date(),
      });
      vi.mocked(formLib.areAllQuestionsAnswered).mockResolvedValueOnce(true);
      vi.mocked(formLib.areAllAnswersCorrect).mockResolvedValueOnce(true);
      vi.mocked(formLib.setUserCertified).mockResolvedValueOnce({} as never);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 20,
        response: ["Remercier et prendre en compte le retour"],
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.allAnswered).toBe(true);
      expect(json.certified).toBe(true);
      expect(formLib.setUserCertified).toHaveBeenCalledWith("user-123");
    });

    it("does not certify the user when every question is answered but some are wrong", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      vi.mocked(formLib.saveFormResponse).mockResolvedValueOnce({
        id: "resp-final",
        userId: "user-123",
        questionId: "20",
        formVersionId: 1,
        response: ["Ignorer complètement le message"],
        createdAt: new Date(),
      });
      vi.mocked(formLib.areAllQuestionsAnswered).mockResolvedValueOnce(true);
      vi.mocked(formLib.areAllAnswersCorrect).mockResolvedValueOnce(false);

      const req = createPostRequest({
        formVersion: 1,
        questionId: 20,
        response: ["Ignorer complètement le message"],
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.allAnswered).toBe(true);
      expect(json.certified).toBe(false);
      expect(formLib.setUserCertified).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/form/answer", () => {
    function createGetRequest(queryString: string = "") {
      return new NextRequest(`http://localhost:3000/api/form/answer${queryString}`, {
        method: "GET",
      });
    }

    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const req = createGetRequest("?questionId=1&formVersion=1");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 when questionId is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createGetRequest("?formVersion=1");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Question ID is required");
    });

    it("returns 400 when formVersion is invalid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createGetRequest("?questionId=1&formVersion=invalid");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid form version");
    });

    it("returns 404 when formVersion is not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createGetRequest("?questionId=1&formVersion=99999");
      const res = await GET(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Form version not found");
    });

    it("returns 404 when question is not found in form", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

      const req = createGetRequest("?questionId=99999&formVersion=1");
      const res = await GET(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Question not found in form");
    });

    it("returns null when user has not answered the question yet", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      vi.mocked(formLib.getUserFormResponse).mockResolvedValueOnce(null);

      const req = createGetRequest("?questionId=1&formVersion=1");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
      expect(json.response).toBeNull();
      expect(json.answer).toBeNull();
    });

    it("returns user's answer when question has been answered", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);
      vi.mocked(formLib.getUserFormResponse).mockResolvedValueOnce({
        id: "resp-1",
        userId: "user-123",
        questionId: "1",
        formVersionId: 1,
        response: "Autonomie",
        createdAt: new Date(),
      });

      const req = createGetRequest("?questionId=1&formVersion=1");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.response).toBe("Autonomie");
      expect(json.response).toBe("Autonomie");
      expect(json.answer).toBe("Autonomie");
    });
  });
});
