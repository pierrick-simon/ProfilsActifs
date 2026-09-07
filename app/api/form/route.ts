import {NextRequest, NextResponse} from "next/server";
import {readFile} from "fs/promises";
import {getFormFileName, getFormVersionFromFileName, getMostRecentFile, isFormValid, saveNewForm} from "@/lib/form";
import {auth} from "@/lib/auth";

export async function GET(
    request: NextRequest
) {

    const mostRecentFile = getMostRecentFile();
    if (!mostRecentFile) {
        return NextResponse.json({error: "No form file found"}, {status: 404});
    }


    let form;
    try {
        form = JSON.parse(await readFile(mostRecentFile, "utf-8"));
    } catch (error) {
        return NextResponse.json({error: "Failed to parse JSON"}, {status: 500});
    }

    const formValid = isFormValid(form);

    if (!formValid.valid) {
        return NextResponse.json({error: "Form is invalid", details: formValid.errors}, {status: 400});
    }

    return NextResponse.json(form);
}

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
