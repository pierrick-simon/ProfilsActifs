import path from "path";
import { readdirSync, lstatSync, writeFileSync, existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { prisma } from "./db";

const NUM_FORM_QUESTION = 20;

export interface SingleChoiceOptions {
    choices: string[];
    answer: string
}

export interface MultipleChoiceOptions {
    choices: string[];
    answer: string[]
}

export interface TrueFalseOptions {
    answer: boolean
}

export interface FreeAnswerOptions {
    answer: null
}

export interface DateOptions {
    answer: string
}

export interface NumericOptions {
    answer: number
}

export type QuestionType =
    | "single-choice"
    | "multiple-choice"
    | "true-false"
    | "free-answer"
    | "date"
    | "numeric"

export type QuestionOptions =
    | SingleChoiceOptions
    | MultipleChoiceOptions
    | TrueFalseOptions
    | FreeAnswerOptions
    | DateOptions
    | NumericOptions

export interface Question {
    id: number
    question: string
    type: QuestionType
    options: QuestionOptions
    weight: number
}

export interface Form {
    questions: Question[]
}

export function isFormValid(formData: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const data = formData as Record<string, unknown>

    if (typeof data !== "object" || data === null) {
        errors.push("La racine doit être un objet JSON")
        return {valid: false, errors}
    }

    if (!Array.isArray(data.questions)) {
        errors.push("L'objet racine doit contenir un tableau 'questions'")
        return {valid: false, errors}
    }

    const ids = new Set<number>()
    const dateRe = /^\d{2}-\d{2}-\d{4}$/

    data.questions.forEach((q: unknown, idx: number) => {
        const ctx = `questions[${idx}]`
        if (typeof q !== "object" || q === null) {
            errors.push(`${ctx} doit être un objet`)
            return
        }

        const qObj = q as Record<string, unknown>
        const {id, question, type, options, weight} = qObj

        if (typeof id !== "number" || !Number.isInteger(id)) {
            errors.push(`${ctx}.id doit être un entier`)
        } else if (ids.has(id)) {
            errors.push(`${ctx}.id ${id} est en double`)
        } else {
            ids.add(id)
        }

        if (typeof question !== "string") errors.push(`${ctx}.question doit être une chaîne de caractères`)
        if (typeof type !== "string") {
            errors.push(`${ctx}.type doit être une chaîne de caractères`)
            return
        }
        if (typeof options !== "object" || options === null) errors.push(`${ctx}.options doit être un objet`)
        if (typeof weight !== "number" || Number.isNaN(weight)) errors.push(`${ctx}.weight doit être un nombre`)

        if (typeof type === "string" && typeof options === "object" && options !== null) {
            const opt = options as Record<string, unknown>
            switch (type) {
                case "single-choice":
                    if (!Array.isArray(opt.choices)) errors.push(`${ctx}.options.choices doit être un tableau de chaînes de caractères`)
                    else if (opt.choices.some((c: unknown) => typeof c !== "string")) errors.push(`${ctx}.options.choices ne doit contenir que des chaînes de caractères`)
                    if (typeof opt.answer !== "string") errors.push(`${ctx}.options.answer doit être une chaîne de caractères`)
                    else if (Array.isArray(opt.choices) && !opt.choices.includes(opt.answer)) errors.push(`${ctx}.options.answer doit correspondre à l'une des valeurs de options.choices`)
                    break

                case "multiple-choice":
                    if (!Array.isArray(opt.choices)) errors.push(`${ctx}.options.choices doit être un tableau de chaînes de caractères`)
                    else if (opt.choices.some((c: unknown) => typeof c !== "string")) errors.push(`${ctx}.options.choices ne doit contenir que des chaînes de caractères`)
                    if (!Array.isArray(opt.answer)) errors.push(`${ctx}.options.answer doit être un tableau de chaînes de caractères`)
                    else if (opt.answer.some((a: unknown) => typeof a !== "string")) errors.push(`${ctx}.options.answer ne doit contenir que des chaînes de caractères`)
                    else if (Array.isArray(opt.choices)) {
                        for (const a of opt.answer) {
                            if (!opt.choices.includes(a)) errors.push(`${ctx}.options.answer contient une valeur absente de options.choices : ${a}`)
                        }
                    }
                    break

                case "true-false":
                    if (typeof opt.answer !== "boolean") errors.push(`${ctx}.options.answer doit être un booléen`)
                    break

                case "free-answer":
                    if (opt.answer !== null) errors.push(`${ctx}.options.answer doit être null pour les questions de type free-answer`)
                    break

                case "date":
                    if (typeof opt.answer !== "string") errors.push(`${ctx}.options.answer doit être une chaîne de caractères représentant une date`)
                    else if (!dateRe.test(opt.answer)) errors.push(`${ctx}.options.answer doit respecter le format JJ-MM-AAAA`)
                    break

                case "numeric":
                    if (typeof opt.answer !== "number" || Number.isNaN(opt.answer)) errors.push(`${ctx}.options.answer doit être un nombre`)
                    break

                default:
                    errors.push(`${ctx}.type '${type}' n'est pas pris en charge`)
            }
        }
    })

    if (data.questions.length != NUM_FORM_QUESTION) {
        errors.push(`Le formulaire doit contenir ${NUM_FORM_QUESTION} questions`);
    }

    return {valid: errors.length === 0, errors}
}

export const FILE_NAME_MATH = /^questions\.v(\d+)\.json$/

export function getMostRecentFile(): string | null {
    const formFolder = path.join(process.cwd(), "certification");

    const recentFiles =
        readdirSync(formFolder)
            .filter(f => lstatSync(path.join(formFolder, f)).isFile())
            .map(file => ({ file, mtime: lstatSync(path.join(formFolder, file)).mtime }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (recentFiles.length === 0) {
        return null;
    }

    if (!FILE_NAME_MATH.test(recentFiles[0].file)) {
        return null;
    }

    return path.join(formFolder, recentFiles[0].file);
}

export function getFormVersionFromFileName(fileName: string): number | null {
    const match = FILE_NAME_MATH.exec(fileName);
    if (!match) {
        return null;
    }
    const version = parseInt(match[1], 10);
    return Number.isNaN(version) ? null : version;
}

export function getFormFileName(version: number): string {
    return `questions.v${version}.json`;
}

export function saveNewForm(formData: Form): string {
    const mostRecentFile = getMostRecentFile();
    let nextVersion = 1;
    if (mostRecentFile !== null) {
        const formVersionFromFileName = getFormVersionFromFileName(mostRecentFile);
        if (formVersionFromFileName !== null) {
            nextVersion = formVersionFromFileName + 1;
        }
    }
    const newFileName = getFormFileName(nextVersion);
    const formFolder = path.join(process.cwd(), "certification");
    const newFilePath = path.join(formFolder, newFileName);

    // Save the file
    writeFileSync(newFilePath, JSON.stringify(formData, null, 2), "utf-8");

    return newFilePath;
}

export function getFormPathByVersion(version: number): string {
    const formFolder = path.join(process.cwd(), "certification");
    return path.join(formFolder, getFormFileName(version));
}

export function getFormByVersion(version: number): Form | null {
    const filePath = getFormPathByVersion(version);
    if (!existsSync(filePath)) {
        return null;
    }
    try {
        const content = readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        return parsed as Form;
    } catch {
        return null;
    }
}

export function getQuestionFromForm(form: Form, questionId: number | string): Question | null {
    const qId = typeof questionId === "string" ? parseInt(questionId, 10) : questionId;
    if (Number.isNaN(qId)) {
        return null;
    }
    return form.questions.find((q) => q.id === qId) ?? null;
}

export function validateQuestionResponse(
    question: Question,
    response: unknown
): { valid: boolean; error?: string } {
    if (response === undefined || response === null) {
        return { valid: false, error: "Response cannot be empty" };
    }

    switch (question.type) {
        case "single-choice":
            if (typeof response !== "string") {
                return { valid: false, error: "Response must be a string" };
            }
            if ("choices" in question.options && Array.isArray(question.options.choices)) {
                if (!question.options.choices.includes(response)) {
                    return { valid: false, error: "Response is not a valid choice" };
                }
            }
            break;

        case "multiple-choice":
            if (!Array.isArray(response)) {
                return { valid: false, error: "Response must be an array" };
            }
            if (response.some((item) => typeof item !== "string")) {
                return { valid: false, error: "All choices in response must be strings" };
            }
            if ("choices" in question.options && Array.isArray(question.options.choices)) {
                for (const r of response) {
                    if (!question.options.choices.includes(r)) {
                        return { valid: false, error: `Invalid choice: ${r}` };
                    }
                }
            }
            break;

        case "true-false":
            if (typeof response !== "boolean") {
                return { valid: false, error: "Response must be a boolean" };
            }
            break;

        case "free-answer":
            if (typeof response !== "string") {
                return { valid: false, error: "Response must be a string" };
            }
            break;

        case "date":
            if (typeof response !== "string") {
                return { valid: false, error: "Response must be a string" };
            }
            break;

        case "numeric":
            if (typeof response !== "number" || Number.isNaN(response)) {
                return { valid: false, error: "Response must be a number" };
            }
            break;

        default:
            break;
    }

    return { valid: true };
}

export interface SaveFormResponseParams {
    userId: string;
    questionId: string | number;
    formVersionId: number;
    response: unknown;
}

export async function saveFormResponse({
    userId,
    questionId,
    formVersionId,
    response,
}: SaveFormResponseParams) {
    const qIdStr = String(questionId);

    const existing = await prisma.formResponse.findFirst({
        where: {
            userId,
            questionId: qIdStr,
            formVersionId,
        },
    });

    if (existing) {
        return await prisma.formResponse.update({
            where: { id: existing.id },
            data: {
                response: response as object,
                createdAt: new Date(),
            },
        });
    }

    return await prisma.formResponse.create({
        data: {
            id: randomUUID(),
            userId,
            questionId: qIdStr,
            response: response as object,
            createdAt: new Date(),
            formVersionId,
        },
    });
}

export interface GetUserFormResponseParams {
    userId: string;
    questionId: string | number;
    formVersionId?: number;
}

export async function getUserFormResponse({
    userId,
    questionId,
    formVersionId,
}: GetUserFormResponseParams) {
    const qIdStr = String(questionId);
    return await prisma.formResponse.findFirst({
        where: {
            userId,
            questionId: qIdStr,
            ...(formVersionId !== undefined ? { formVersionId } : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function areAllQuestionsAnswered(
    userId: string,
    formVersion: number
): Promise<boolean> {
    const form = getFormByVersion(formVersion);
    if (!form || !Array.isArray(form.questions) || form.questions.length === 0) {
        return false;
    }

    const responses = await prisma.formResponse.findMany({
        where: {
            userId,
            formVersionId: formVersion,
        },
        select: {
            questionId: true,
        },
    });

    const answeredQuestionIds = new Set(responses.map((r) => r.questionId));
    return form.questions.every((q) => answeredQuestionIds.has(String(q.id)));
}

export function isResponseCorrect(question: Question, response: unknown): boolean {
    if (!validateQuestionResponse(question, response).valid) {
        return false;
    }

    switch (question.type) {
        case "free-answer":
            return typeof response === "string" && response.trim().length > 0;
        case "single-choice":
        case "true-false":
        case "numeric":
        case "date":
            return response === question.options.answer;
        case "multiple-choice": {
            if (!Array.isArray(response) || !("answer" in question.options) || !Array.isArray(question.options.answer)) {
                return false;
            }
            const expected = [...question.options.answer].sort();
            const got = [...response].sort();
            return expected.length === got.length && expected.every((value, index) => value === got[index]);
        }
        default:
            return false;
    }
}

export async function areAllAnswersCorrect(
    userId: string,
    formVersion: number
): Promise<boolean> {
    const form = getFormByVersion(formVersion);
    if (!form || !Array.isArray(form.questions) || form.questions.length === 0) {
        return false;
    }

    const responses = await prisma.formResponse.findMany({
        where: {
            userId,
            formVersionId: formVersion,
        },
        select: {
            questionId: true,
            response: true,
        },
    });

    const byQuestion = new Map(
        responses.map((row) => [row.questionId, row.response]),
    );

    return form.questions.every((question) => {
        const response = byQuestion.get(String(question.id));
        return response !== undefined && isResponseCorrect(question, response);
    });
}

export async function setUserCertified(userId: string, date: Date = new Date()) {
    return await prisma.user.update({
        where: { id: userId },
        data: {
            certification: date,
        },
    });
}