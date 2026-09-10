import path from "path";
import {NextRequest, NextResponse} from "next/server";
import {readFile} from "fs/promises";
import {getFormVersionFromFileName, getMostRecentFile, isFormValid, saveNewForm} from "@/lib/form";
import {auth} from "@/lib/auth";

/**
 * @swagger
 * /api/form:
 *   get:
 *     tags: [Form]
 *     description: >
 *       Returns the most recent version of the certification form (questions and
 *       metadata), stored as a versioned file on disk.
 *     responses:
 *       200:
 *         description: The form, with its version number.
 *       404:
 *         description: No form file found.
 *       400:
 *         description: The found form does not match the expected schema.
 *       500:
 *         description: Form file unreadable (invalid JSON).
 */
export async function GET(
    _request: NextRequest
) {

    const mostRecentFile = getMostRecentFile();
    if (!mostRecentFile) {
        return NextResponse.json({error: "No form file found"}, {status: 404});
    }


    let form;
    try {
        form = JSON.parse(await readFile(mostRecentFile, "utf-8"));
    } catch {
        return NextResponse.json({error: "Failed to parse JSON"}, {status: 500});
    }

    const formValid = isFormValid(form);

    if (!formValid.valid) {
        return NextResponse.json({error: "Form is invalid", details: formValid.errors}, {status: 400});
    }

    const formVersion = getFormVersionFromFileName(path.basename(mostRecentFile));
    return NextResponse.json({ ...form, formVersion });
}

/**
 * @swagger
 * /api/form:
 *   post:
 *     tags: [Form]
 *     description: >
 *       Publishes a new version of the certification form. Restricted to admins;
 *       the form is validated against its schema before being saved as a new
 *       versioned file.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Form accepted and saved.
 *       400:
 *         description: The submitted form does not match the expected schema.
 *       403:
 *         description: Caller is not an admin.
 */
export async function POST(
    request: NextRequest
) {

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session || !session.user || session.user.role !== "admin") {
        return NextResponse.json({error: "Access denied"}, {status: 403});
    }

    const formData = await request.json();

    const formValid = isFormValid(formData);

    if (!formValid.valid) {
        return NextResponse.json({error: "Form is invalid", details: formValid.errors}, {status: 400});
    }

    saveNewForm(formData);

    return NextResponse.json({message: "Form is valid"});
}
