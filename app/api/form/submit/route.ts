import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getFormByVersion,
  getQuestionFromForm,
  saveFormResponse,
  validateQuestionResponse,
} from "@/lib/form";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reqBody = body as {
    formVersion?: unknown;
    formVersionId?: unknown;
    version?: unknown;
    questionId?: unknown;
    id?: unknown;
    response?: unknown;
    answer?: unknown;
  };

  const rawVersion = reqBody.formVersion ?? reqBody.formVersionId ?? reqBody.version;
  const rawQuestionId = reqBody.questionId ?? reqBody.id;
  const rawResponse = reqBody.response !== undefined ? reqBody.response : reqBody.answer;

  if (rawVersion === undefined || rawVersion === null) {
    return NextResponse.json(
      { error: "Form version is required" },
      { status: 400 },
    );
  }

  const formVersion = Number(rawVersion);
  if (!Number.isInteger(formVersion) || formVersion <= 0) {
    return NextResponse.json(
      { error: "Invalid form version" },
      { status: 400 },
    );
  }

  if (rawQuestionId === undefined || rawQuestionId === null) {
    return NextResponse.json(
      { error: "Question ID is required" },
      { status: 400 },
    );
  }

  if (typeof rawQuestionId !== "string" && typeof rawQuestionId !== "number") {
    return NextResponse.json(
      { error: "Invalid question ID" },
      { status: 400 },
    );
  }

  if (rawResponse === undefined) {
    return NextResponse.json(
      { error: "Response is required" },
      { status: 400 },
    );
  }

  const form = getFormByVersion(formVersion);
  if (!form) {
    return NextResponse.json(
      { error: "Form version not found" },
      { status: 404 },
    );
  }

  const question = getQuestionFromForm(form, rawQuestionId);
  if (!question) {
    return NextResponse.json(
      { error: "Question not found in form" },
      { status: 404 },
    );
  }

  const validation = validateQuestionResponse(question, rawResponse);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error ?? "Invalid response format" },
      { status: 400 },
    );
  }

  const savedResponse = await saveFormResponse({
    userId: session.user.id,
    questionId: question.id,
    formVersionId: formVersion,
    response: rawResponse,
  });

  return NextResponse.json(
    {
      success: true,
      data: savedResponse,
    },
    { status: 200 },
  );
}
