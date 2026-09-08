import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isFormValid,
  getFormFileName,
  getFormVersionFromFileName,
  getMostRecentFile,
  getFormByVersion,
  getQuestionFromForm,
  validateQuestionResponse,
  saveFormResponse,
  getUserFormResponse,
  areAllQuestionsAnswered,
  setUserCertified,
  Question,
  Form,
} from "./form";
import { prisma } from "./db";

vi.mock("./db", () => ({
  prisma: {
    formResponse: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

describe("lib/form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("File naming & versioning", () => {
    it("formats form file name from version", () => {
      expect(getFormFileName(1)).toBe("questions.v1.json");
      expect(getFormFileName(42)).toBe("questions.v42.json");
    });

    it("extracts version from valid file name", () => {
      expect(getFormVersionFromFileName("questions.v1.json")).toBe(1);
      expect(getFormVersionFromFileName("questions.v12.json")).toBe(12);
      expect(getFormVersionFromFileName("invalid.json")).toBeNull();
    });

    it("finds the most recent form file", () => {
      const mostRecent = getMostRecentFile();
      expect(mostRecent).not.toBeNull();
      expect(mostRecent).toContain("questions.v");
    });

    it("loads form by version 1", () => {
      const form = getFormByVersion(1);
      expect(form).not.toBeNull();
      expect(form?.questions.length).toBe(20);
    });

    it("returns null for non-existent form version", () => {
      const form = getFormByVersion(99999);
      expect(form).toBeNull();
    });

    it("validates form structure with isFormValid", () => {
      const form = getFormByVersion(1);
      const validation = isFormValid(form);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);

      const invalid = isFormValid({ questions: [] });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getQuestionFromForm", () => {
    const sampleForm: Form = {
      questions: [
        {
          id: 1,
          question: "Single choice test",
          type: "single-choice",
          options: { choices: ["A", "B"], answer: "A" },
          weight: 1,
        },
        {
          id: 2,
          question: "Numeric test",
          type: "numeric",
          options: { answer: 10 },
          weight: 1,
        },
      ],
    };

    it("retrieves question by numeric id", () => {
      const q = getQuestionFromForm(sampleForm, 1);
      expect(q).not.toBeNull();
      expect(q?.id).toBe(1);
    });

    it("retrieves question by string id", () => {
      const q = getQuestionFromForm(sampleForm, "2");
      expect(q).not.toBeNull();
      expect(q?.id).toBe(2);
    });

    it("returns null when question is not found", () => {
      expect(getQuestionFromForm(sampleForm, 99)).toBeNull();
      expect(getQuestionFromForm(sampleForm, "abc")).toBeNull();
    });
  });

  describe("validateQuestionResponse", () => {
    const singleChoiceQ: Question = {
      id: 1,
      question: "Single choice",
      type: "single-choice",
      options: { choices: ["A", "B", "C"], answer: "A" },
      weight: 1,
    };

    const multiChoiceQ: Question = {
      id: 2,
      question: "Multiple choice",
      type: "multiple-choice",
      options: { choices: ["X", "Y", "Z"], answer: ["X", "Y"] },
      weight: 1,
    };

    const trueFalseQ: Question = {
      id: 3,
      question: "True false",
      type: "true-false",
      options: { answer: true },
      weight: 1,
    };

    const freeAnswerQ: Question = {
      id: 4,
      question: "Free answer",
      type: "free-answer",
      options: { answer: null },
      weight: 1,
    };

    const numericQ: Question = {
      id: 5,
      question: "Numeric",
      type: "numeric",
      options: { answer: 42 },
      weight: 1,
    };

    const dateQ: Question = {
      id: 6,
      question: "Date",
      type: "date",
      options: { answer: "01-01-2026" },
      weight: 1,
    };

    it("validates empty response", () => {
      expect(validateQuestionResponse(singleChoiceQ, null).valid).toBe(false);
      expect(validateQuestionResponse(singleChoiceQ, undefined).valid).toBe(false);
    });

    it("validates single-choice response", () => {
      expect(validateQuestionResponse(singleChoiceQ, "A").valid).toBe(true);
      expect(validateQuestionResponse(singleChoiceQ, "Invalid").valid).toBe(false);
      expect(validateQuestionResponse(singleChoiceQ, 123).valid).toBe(false);
    });

    it("validates multiple-choice response", () => {
      expect(validateQuestionResponse(multiChoiceQ, ["X", "Y"]).valid).toBe(true);
      expect(validateQuestionResponse(multiChoiceQ, ["X", "Unknown"]).valid).toBe(false);
      expect(validateQuestionResponse(multiChoiceQ, "X").valid).toBe(false);
    });

    it("validates true-false response", () => {
      expect(validateQuestionResponse(trueFalseQ, true).valid).toBe(true);
      expect(validateQuestionResponse(trueFalseQ, false).valid).toBe(true);
      expect(validateQuestionResponse(trueFalseQ, "true").valid).toBe(false);
    });

    it("validates free-answer response", () => {
      expect(validateQuestionResponse(freeAnswerQ, "My detailed answer").valid).toBe(true);
      expect(validateQuestionResponse(freeAnswerQ, 123).valid).toBe(false);
    });

    it("validates numeric response", () => {
      expect(validateQuestionResponse(numericQ, 42).valid).toBe(true);
      expect(validateQuestionResponse(numericQ, "42").valid).toBe(false);
      expect(validateQuestionResponse(numericQ, NaN).valid).toBe(false);
    });

    it("validates date response", () => {
      expect(validateQuestionResponse(dateQ, "12-05-1995").valid).toBe(true);
      expect(validateQuestionResponse(dateQ, 12051995).valid).toBe(false);
    });
  });

  describe("saveFormResponse", () => {
    it("creates a new response when none exists", async () => {
      vi.mocked(prisma.formResponse.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.formResponse.create).mockResolvedValueOnce({
        id: "res-1",
        userId: "user-1",
        questionId: "1",
        formVersionId: 1,
        response: "A",
        createdAt: new Date(),
      });

      const result = await saveFormResponse({
        userId: "user-1",
        questionId: 1,
        formVersionId: 1,
        response: "A",
      });

      expect(prisma.formResponse.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          questionId: "1",
          formVersionId: 1,
        },
      });
      expect(prisma.formResponse.create).toHaveBeenCalled();
      expect(result.id).toBe("res-1");
    });

    it("updates an existing response when one already exists", async () => {
      vi.mocked(prisma.formResponse.findFirst).mockResolvedValueOnce({
        id: "res-existing",
        userId: "user-1",
        questionId: "1",
        formVersionId: 1,
        response: "Old answer",
        createdAt: new Date("2026-01-01"),
      });
      vi.mocked(prisma.formResponse.update).mockResolvedValueOnce({
        id: "res-existing",
        userId: "user-1",
        questionId: "1",
        formVersionId: 1,
        response: "New answer",
        createdAt: new Date(),
      });

      const result = await saveFormResponse({
        userId: "user-1",
        questionId: 1,
        formVersionId: 1,
        response: "New answer",
      });

      expect(prisma.formResponse.update).toHaveBeenCalledWith({
        where: { id: "res-existing" },
        data: {
          response: "New answer",
          createdAt: expect.any(Date),
        },
      });
      expect(result.id).toBe("res-existing");
    });
  });

  describe("getUserFormResponse", () => {
    it("fetches form response for a user and question", async () => {
      const mockRecord = {
        id: "res-1",
        userId: "user-1",
        questionId: "5",
        response: "Answer 5",
        createdAt: new Date(),
        formVersionId: 1,
      };
      vi.mocked(prisma.formResponse.findFirst).mockResolvedValueOnce(mockRecord);

      const result = await getUserFormResponse({
        userId: "user-1",
        questionId: 5,
        formVersionId: 1,
      });

      expect(prisma.formResponse.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          questionId: "5",
          formVersionId: 1,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(mockRecord);
    });

    it("fetches without formVersionId filter if omitted", async () => {
      vi.mocked(prisma.formResponse.findFirst).mockResolvedValueOnce(null);

      const result = await getUserFormResponse({
        userId: "user-1",
        questionId: "5",
      });

      expect(prisma.formResponse.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          questionId: "5",
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("areAllQuestionsAnswered", () => {
    it("returns false for a non-existent form", async () => {
      const result = await areAllQuestionsAnswered("user-1", 99999);
      expect(result).toBe(false);
    });

    it("returns true if all 20 questions have been answered", async () => {
      const allResponses = Array.from({ length: 20 }, (_, i) => ({
        questionId: String(i + 1),
      }));
      vi.mocked(prisma.formResponse.findMany).mockResolvedValueOnce(allResponses as never);

      const result = await areAllQuestionsAnswered("user-1", 1);
      expect(result).toBe(true);
      expect(prisma.formResponse.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          formVersionId: 1,
        },
        select: {
          questionId: true,
        },
      });
    });

    it("returns false if only some questions have been answered", async () => {
      const partialResponses = Array.from({ length: 19 }, (_, i) => ({
        questionId: String(i + 1),
      }));
      vi.mocked(prisma.formResponse.findMany).mockResolvedValueOnce(partialResponses as never);

      const result = await areAllQuestionsAnswered("user-1", 1);
      expect(result).toBe(false);
    });
  });

  describe("setUserCertified", () => {
    it("updates user certification date", async () => {
      const now = new Date();
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: "user-1",
        certification: now,
      } as never);

      await setUserCertified("user-1", now);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          certification: now,
        },
      });
    });
  });
});
