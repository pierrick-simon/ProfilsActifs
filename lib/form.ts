import path from "path";
import { readdirSync, lstatSync, writeFileSync } from "fs";

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

export function isFormValid(formData: JSON): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const data: any = formData as any

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

    data.questions.forEach((q: any, idx: number) => {
        const ctx = `questions[${idx}]`
        if (typeof q !== "object" || q === null) {
            errors.push(`${ctx} doit être un objet`)
            return
        }

        const {id, question, type, options, weight} = q

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
            switch (type) {
                case "single-choice":
                    if (!Array.isArray(options.choices)) errors.push(`${ctx}.options.choices doit être un tableau de chaînes de caractères`)
                    else if (options.choices.some((c: any) => typeof c !== "string")) errors.push(`${ctx}.options.choices ne doit contenir que des chaînes de caractères`)
                    if (typeof options.answer !== "string") errors.push(`${ctx}.options.answer doit être une chaîne de caractères`)
                    else if (Array.isArray(options.choices) && !options.choices.includes(options.answer)) errors.push(`${ctx}.options.answer doit correspondre à l'une des valeurs de options.choices`)
                    break

                case "multiple-choice":
                    if (!Array.isArray(options.choices)) errors.push(`${ctx}.options.choices doit être un tableau de chaînes de caractères`)
                    else if (options.choices.some((c: any) => typeof c !== "string")) errors.push(`${ctx}.options.choices ne doit contenir que des chaînes de caractères`)
                    if (!Array.isArray(options.answer)) errors.push(`${ctx}.options.answer doit être un tableau de chaînes de caractères`)
                    else if (options.answer.some((a: any) => typeof a !== "string")) errors.push(`${ctx}.options.answer ne doit contenir que des chaînes de caractères`)
                    else if (Array.isArray(options.choices)) {
                        for (const a of options.answer) {
                            if (!options.choices.includes(a)) errors.push(`${ctx}.options.answer contient une valeur absente de options.choices : ${a}`)
                        }
                    }
                    break

                case "true-false":
                    if (typeof options.answer !== "boolean") errors.push(`${ctx}.options.answer doit être un booléen`)
                    break

                case "free-answer":
                    if (options.answer !== null) errors.push(`${ctx}.options.answer doit être null pour les questions de type free-answer`)
                    break

                case "date":
                    if (typeof options.answer !== "string") errors.push(`${ctx}.options.answer doit être une chaîne de caractères représentant une date`)
                    else if (!dateRe.test(options.answer)) errors.push(`${ctx}.options.answer doit respecter le format JJ-MM-AAAA`)
                    break

                case "numeric":
                    if (typeof options.answer !== "number" || Number.isNaN(options.answer)) errors.push(`${ctx}.options.answer doit être un nombre`)
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