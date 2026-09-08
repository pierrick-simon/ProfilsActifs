import {execFileSync, execFile} from "child_process";
import {promisify} from "util";
import {auth} from "@/lib/auth";
import {prisma} from "@/lib/db";
import prompts from "prompts";
import {faker} from "@faker-js/faker";
import {randomUUID} from "crypto";
import {getActiveVideoProvider} from "@/lib/video-provider";
import {
    readFile,
    rm,
    writeFile,
    mkdir,
    rmdir
} from "fs/promises";

const CandidateCount = 300;
const RecruiterCount = 200;

// Maximum number of users being generated at the same time.
// This includes Better Auth, FFmpeg and video upload.
const GenerationConcurrency = 10;



const execFileAsync = promisify(execFile);

type NewUserRole = "candidate" | "recruiter" | "admin";

type User = {
    email: string;
    password: string;
    role: NewUserRole;
};


interface TimerVideoOptions {
    text: string;
    durationSec: number;
    outputPath: string;
    width?: number;
    height?: number;
    fontSize?: number;
    timerFontSize?: number;
}

function escapeDrawtext(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\u2019")
        .replace(/%/g, "\\%");
}

function stringToColor(str: string): string {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += value.toString(16).padStart(2, "0");
    }

    return color;
}

function getContrastColor(hex: string): string {
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance =
        (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Generates the timer video asynchronously.
 *
 * IMPORTANT:
 * This uses execFile instead of execFileSync so FFmpeg does not
 * block the Node.js event loop.
 */
async function generateUserVideo(
    opts: TimerVideoOptions
): Promise<void> {
    const {
        text,
        durationSec,
        outputPath,
        width = 640,
        height = 360,
        fontSize = 60,
        timerFontSize = 120,
    } = opts;

    if (durationSec < 30 || durationSec > 120) {
        throw new Error(
            "durationSec should be between 30 and 120 seconds"
        );
    }

    const safeText = escapeDrawtext(text);

    const bgColor = stringToColor(text);
    const textColor = getContrastColor(bgColor);

    const staticTextFilter = [
        `drawtext=text='${safeText}'`,
        `fontcolor=${textColor}`,
        `fontsize=${fontSize}`,
        `x=(w-text_w)/2`,
        `y=(h/2)-180`,
    ].join(":");

    const minutesExpr = `floor(t/60)`;
    const secondsExpr = `mod(floor(t)\\,60)`;

    const timerText =
        `%{eif\\:${minutesExpr}\\:d\\:2}\\:%{eif\\:${secondsExpr}\\:d\\:2}`;

    const timerFilter = [
        `drawtext=text='${timerText}'`,
        `fontcolor=white`,
        `fontsize=${timerFontSize}`,
        `x=(w-text_w)/2`,
        `y=(h/2)+20`,
    ].join(":");

    const filterChain = `${staticTextFilter},${timerFilter}`;

    const args = [
        "-y",
        "-f", "lavfi",
        "-i", `color=c=${bgColor}:s=${width}x${height}:d=${durationSec}`,
        "-vf", filterChain,
        "-r", "10",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-nostdin",
        "-loglevel", "0",
        outputPath,
    ];

    await execFileAsync("ffmpeg", args);
}

async function createAdminUserProfile(): Promise<User> {
    const answers = await prompts([
        {
            type: "text",
            name: "email",
            message: "Admin email:",
            validate: (v: string) =>
                v.includes("@")
                    ? true
                    : "Enter a valid email",
        },
        {
            type: "password",
            name: "password",
            message: "Choose a password:",
            validate: (v: string) =>
                v.length >= 8
                    ? true
                    : "Minimum 8 characters",
        },
    ]);

    execFileSync(
        "npx",
        [
            "auth@latest",
            "create-admin",
            "--password",
            answers.password,
            "--email",
            answers.email,
            "--role",
            "admin",
            "--yes",
            "--name",
            "admin",
            "--data",
            JSON.stringify({
                acceptedTerms: true,
                localisation: "en-GB",
                dateOfBirth: "1990-01-01",
            }),
        ],
        {
            stdio: ["pipe", "inherit", "inherit"],
        }
    );

    return {
        email: answers.email,
        password: answers.password,
        role: "admin"
    };
}

let activeUsers = 0;
let maxConcurrentUsers = 0;
let completedUsers = 0;
let totalUsers = 0;


async function generateRandomUser(
    headers: Headers,
    role: NewUserRole
): Promise<User> {
    const start = Date.now();

    activeUsers++;
    maxConcurrentUsers = Math.max(
        maxConcurrentUsers,
        activeUsers
    );

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const user: User = {
        email: faker.internet.email({
            firstName,
            lastName,
        }),
        password: faker.internet.password({
            length: 12,
        }),
        role: role
    };

    const userLocalisation =
        faker.location.city() +
        ", " +
        faker.location.country();

    const userDateOfBirth =
        faker.date
            .birthdate({
                min: 18,
                max: 65,
                mode: "age",
            })
            .toISOString()
            .split("T")[0];

    try {
        const {user: createdUser} =
            await auth.api.createUser({
                headers,
                body: {
                    email: user.email,
                    password: user.password,
                    name: `${firstName} ${lastName}`,
                    role,
                    data: {
                        emailVerified: true,
                        acceptedTerms: true,
                        localisation: userLocalisation,
                        dateOfBirth: userDateOfBirth,
                    },
                },
            });

        if (role === "candidate") {
            await mkdir("./tmp", {
                recursive: true,
            });

            const outputPath =
                `./tmp/${randomUUID()}.mp4`;

            try {
                await generateUserVideo({
                    text: `${firstName} ${lastName}`,
                    durationSec: faker.number.int({
                        min: 30,
                        max: 120,
                    }),
                    outputPath,
                });

                const bytes = await readFile(outputPath);
                const mimeType = "video/mp4";

                const provider =
                    getActiveVideoProvider();

                const providerId =
                    await provider.store({
                        bytes,
                        mimeType,
                    });

                const initialStatus =
                    await provider.status(providerId);

                await prisma.video.create({
                    data: {
                        id: randomUUID(),
                        provider: provider.name,
                        providerId,
                        status: initialStatus.status.toUpperCase() as
                            "PENDING" | "READY" | "FAILED",
                        userId: createdUser.id,
                        views: 0,
                        validated: true,
                    },
                });
            } finally {
                await rm(outputPath, {
                    force: true,
                });
            }
        }

        return user;
    } catch (err) {
        console.error(
            `Failed to create ${role}:`,
            err
        );

        throw err;
    } finally {
        activeUsers--;
        completedUsers++;

        console.log(
            `Finished new ${role} | active=${activeUsers} | remaining=${totalUsers - completedUsers} | duration=${Date.now() - start}ms`
        );
    }
}

async function getUserHeaders(user: User): Promise<Headers> {
    const res = await auth.api.signInEmail({
        body: {
            email: user.email,
            password: user.password,
        },
        asResponse: true,
    });

    return new Headers({
        cookie:
            res.headers.get("set-cookie") ?? "",
    });
}

async function writeUsersToFile(
    users: User[]
): Promise<void> {
    const filePath = "./generated_users.json";

    const jsonData = JSON.stringify(
        users,
        null,
        2
    );

    await writeFile(
        filePath,
        jsonData,
        "utf-8"
    );

    console.log(
        `Generated users written to ${filePath}`
    );
}

async function getAdminHeaders(): Promise<Headers> {
    const {isAdmin} = await prompts({
        type: "confirm",
        name: "isAdmin",
        message: "Are you an admin?",
    });

    if (!isAdmin) {
        const adminUser =
            await createAdminUserProfile();

        return getUserHeaders(adminUser);
    }

    const {email, password} = await prompts([
        {
            type: "text",
            name: "email",
            message: "Admin email:",
            validate: (v: string) =>
                v.includes("@")
                    ? true
                    : "Enter a valid email",
        },
        {
            type: "password",
            name: "password",
            message: "Admin password:",
            validate: (v: string) =>
                v.length >= 8
                    ? true
                    : "Minimum 8 characters",
        },
    ]);

    const adminUser: User = {
        email,
        password,
        role: "admin"
    };

    return getUserHeaders(adminUser);
}

async function clearUsers(
    adminHeaders: Headers
): Promise<void> {

    const response =
        await auth.api.listUsers({
            query: {
                limit: 1000,
            },
            headers: adminHeaders,
        });

    const usersToDelete =
        response.users.filter(
            user => user.role !== "admin"
        );

    console.log(
        `Deleting ${usersToDelete.length} users...`
    );

    await Promise.all(
        usersToDelete.map(user =>
            auth.api.removeUser({
                body: {
                    userId: user.id,
                },
                headers: adminHeaders,
            })
        )
    );

    console.log("Users cleared.");
}

async function askUserClear(
    adminHeaders: Headers
): Promise<void> {
    const {clear} = await prompts({
        type: "confirm",
        name: "clear",
        message:
            "Do you want to clear existing users before generating new ones?",
    });

    if (clear) {
        await clearUsers(adminHeaders);
    }
}

/**
 * Runs async jobs with a maximum number of concurrent jobs.
 *
 * Example:
 *
 * 500 jobs + concurrency 10
 *
 * ┌─ worker 1 ─ user
 * ├─ worker 2 ─ user
 * ├─ ...
 * └─ worker 10 ─ user
 *
 * When a worker finishes, it immediately takes
 * the next job.
 */
async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    if (concurrency < 1) {
        throw new Error(
            "Concurrency must be at least 1"
        );
    }

    const results: R[] = new Array(items.length);

    let nextIndex = 0;

    async function worker(): Promise<void> {
        while (true) {
            const index = nextIndex++;

            if (index >= items.length) {
                return;
            }

            results[index] =
                await fn(items[index], index);
        }
    }

    const workerCount = Math.min(
        concurrency,
        items.length
    );

    await Promise.all(
        Array.from(
            {
                length: workerCount,
            },
            () => worker()
        )
    );

    return results;
}

async function generateUsers(
    candidateCount: number = CandidateCount,
    recruiterCount: number = RecruiterCount
): Promise<void> {
    console.log(
        `Generating ${candidateCount} candidates and ${recruiterCount} recruiters...`
    );

    totalUsers = candidateCount + recruiterCount;

    const adminHeaders =
        await getAdminHeaders();

    await askUserClear(adminHeaders);

    const jobs: NewUserRole[] = [
        ...Array(candidateCount).fill("candidate"),
        ...Array(recruiterCount).fill("recruiter"),
    ];

    const start = Date.now();

    const users =
        await mapWithConcurrency(
            jobs,
            GenerationConcurrency,
            role =>
                generateRandomUser(
                    adminHeaders,
                    role
                )
        );

    await rmdir("./tmp", {
        recursive: true,
    });
    await writeUsersToFile(users);

    console.log(
        `Generation completed in ${Date.now() - start}ms`
    );
}

if (require.main === module) {
    generateUsers()
        .then(() =>
            console.log(
                "User generation completed."
            )
        )
        .catch(err => {
            console.error(
                "Error generating users:",
                err
            );

            process.exitCode = 1;
        });
}