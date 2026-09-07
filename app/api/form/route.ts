import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ type: string; filename: string }> },
) {
    const { type, filename } = await params;
}
