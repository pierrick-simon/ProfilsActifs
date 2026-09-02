import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET( ) {
    try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();

        return NextResponse.json(
        {
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString(),
        },
            { status: 200 }
        );
    } catch (error) {

        return NextResponse.json(
            {
                status: "error",
                database: "disconnected",
                timestamp: new Date().toISOString(),
            },
            { status: 503 } // Service Unavailable
        );
    }
}