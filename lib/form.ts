import path from "path";
import { readdirSync, lstatSync } from "fs";

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

export function isFormValid(formData: JSON): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const data: any = formData as any

    if (typeof data !== "object" || data === null) {
        errors.push("Root must be a JSON object")
        return {valid: false, errors}
    }

    if (!Array.isArray(data.questions)) {
        errors.push("Root object must contain a 'questions' array")
        return {valid: false, errors}
    }

    const ids = new Set<number>()
    const dateRe = /^\d{2}-\d{2}-\d{4}$/

    data.questions.forEach((q: any, idx: number) => {
        const ctx = `questions[${idx}]`
        if (typeof q !== "object" || q === null) {
            errors.push(`${ctx} must be an object`)
            return
        }

        const {id, question, type, options, weight} = q

        if (typeof id !== "number" || !Number.isInteger(id)) {
            errors.push(`${ctx}.id must be an integer`)
        } else if (ids.has(id)) {
            errors.push(`${ctx}.id ${id} is duplicated`)
        } else {
            ids.add(id)
        }

        if (typeof question !== "string") errors.push(`${ctx}.question must be a string`)
        if (typeof type !== "string") {
            errors.push(`${ctx}.type must be a string`)
            return
        }
        if (typeof options !== "object" || options === null) errors.push(`${ctx}.options must be an object`)
        if (typeof weight !== "number" || Number.isNaN(weight)) errors.push(`${ctx}.weight must be a number`)

        if (typeof type === "string" && typeof options === "object" && options !== null) {
            switch (type) {
                case "single-choice":
                    if (!Array.isArray(options.choices)) errors.push(`${ctx}.options.choices must be an array of strings`)
                    else if (options.choices.some((c: any) => typeof c !== "string")) errors.push(`${ctx}.options.choices must contain only strings`)
                    if (typeof options.answer !== "string") errors.push(`${ctx}.options.answer must be a string`)
                    else if (Array.isArray(options.choices) && !options.choices.includes(options.answer)) errors.push(`${ctx}.options.answer must be one of options.choices`)
                    break

                case "multiple-choice":
                    if (!Array.isArray(options.choices)) errors.push(`${ctx}.options.choices must be an array of strings`)
                    else if (options.choices.some((c: any) => typeof c !== "string")) errors.push(`${ctx}.options.choices must contain only strings`)
                    if (!Array.isArray(options.answer)) errors.push(`${ctx}.options.answer must be an array of strings`)
                    else if (options.answer.some((a: any) => typeof a !== "string")) errors.push(`${ctx}.options.answer must contain only strings`)
                    else if (Array.isArray(options.choices)) {
                        for (const a of options.answer) {
                            if (!options.choices.includes(a)) errors.push(`${ctx}.options.answer contains value not present in options.choices: ${a}`)
                        }
                    }
                    break

                case "true-false":
                    if (typeof options.answer !== "boolean") errors.push(`${ctx}.options.answer must be boolean`)
                    break

                case "free-answer":
                    if (options.answer !== null) errors.push(`${ctx}.options.answer must be null for free-answer questions`)
                    break

                case "date":
                    if (typeof options.answer !== "string") errors.push(`${ctx}.options.answer must be a date string`)
                    else if (!dateRe.test(options.answer)) errors.push(`${ctx}.options.answer must match DD-MM-YYYY`)
                    break

                case "numeric":
                    if (typeof options.answer !== "number" || Number.isNaN(options.answer)) errors.push(`${ctx}.options.answer must be a number`)
                    break

                default:
                    errors.push(`${ctx}.type '${type}' is not supported`)
            }
        }
    })

    return {valid: errors.length === 0, errors}
}

export const FILE_NAME_MATH = /^questions\.v(\d*)\.json$/

export function getMostRecentFile(): string | null {
    const formFolder = path.join(process.cwd(), "certification");

    const recentFiles =
        readdirSync(formFolder)
            .filter(f => lstatSync(f).isFile())
            .map(file => ({ file, mtime: lstatSync(file).mtime }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (recentFiles.length === 0) {
        return null;
    }

    if (!FILE_NAME_MATH.test(recentFiles[0].file)) {
        return null;
    }

    return recentFiles[0].file;
}
