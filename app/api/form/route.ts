import {NextRequest, NextResponse} from "next/server";
import {readFile} from "fs/promises";
import {getMostRecentFile, isFormValid} from "@/lib/form";

export async function GET(
    request: NextRequest
) {

    const mostRecentFile = getMostRecentFile();
    if (!mostRecentFile) {
        return NextResponse.json({error: "No form file found"}, {status: 404});
    }

    const form = JSON.parse(await readFile(mostRecentFile, "utf-8"));

    const formValid = isFormValid(form);

    if (!formValid.valid) {
        return NextResponse.json({error: "Form is invalid", details: formValid.errors}, {status: 400});
    }

    return NextResponse.json(form);
}
