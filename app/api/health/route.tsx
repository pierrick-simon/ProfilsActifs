import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     description: >
 *       Service availability check: attempts a minimal database query and reports
 *       whether it succeeded. Intended for infrastructure probes (load balancer,
 *       orchestrator), no authentication required.
 *     responses:
 *       200:
 *         description: Service operational, database reachable.
 *       503:
 *         description: Database unreachable.
 */
export async function GET( ) {
    try {
        await prisma.$executeRaw`SELECT 1;`;

        return NextResponse.json(
        {
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION,
        },
            { status: 200 }
        );
    } catch (_error) {

        return NextResponse.json(
            {
                status: "error",
                database: "disconnected",
                timestamp: new Date().toISOString(),
                version: process.env.APP_VERSION,
            },
            { status: 503 } // Service Unavailable
        );
    }
}