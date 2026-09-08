
import { execFileSync } from "child_process";
import {auth} from "@/lib/auth";
import prompts from "prompts";

type User = {
    name: string,
    password: string
}

interface TimerVideoOptions {
    text: string;              // static text shown above/below the timer
    durationSec: number;       // total video length, 30–120 recommended
    outputPath: string;        // e.g. "./timer.mp4"
    width?: number;            // default 1280
    height?: number;           // default 720
    fontSize?: number;         // static text size, default 60
    timerFontSize?: number;    // timer size, default 120
}

function escapeDrawtext(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\u2019")
        .replace(/%/g, "\\%");
}

function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += value.toString(16).padStart(2, '0');
    }
    return color;
}

function getContrastColor(hex: string){
    // hex like "#3498db" or "3498db"
    hex = hex.replace('#', '');
    const r = parseInt(String.prototype.substring(0, 2), 16);
    const g = parseInt(String.prototype.substring(2, 2), 16);
    const b = parseInt(String.prototype.substring(4, 2), 16);

    // relative luminance (perceived brightness, weighted for human eyes)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
}

function generateUserVideo(opts: TimerVideoOptions): void {
    const {
        text,
        durationSec,
        outputPath,
        width = 1280,
        height = 720,
        fontSize = 60,
        timerFontSize = 120,
    } = opts;

    if (durationSec < 30 || durationSec > 120) {
        throw new Error("durationSec should be between 30 and 120 seconds");
    }

    const safeText = escapeDrawtext(text);

    const bgColor = stringToColor(text);
    const textColor = getContrastColor(bgColor);

    // Static text, positioned above center.
    const staticTextFilter = [
        `drawtext=text='${safeText}'`,
        `fontcolor=${textColor}`,
        `fontsize=${fontSize}`,
        `x=(w-text_w)/2`,
        `y=(h/2)-180`,
    ].join(":");

    const minutesExpr = `floor(t/60)`;
    const secondsExpr = `mod(floor(t)\\,60)`;

    // Colons inside %{eif:...:d:2} must be escaped too, since drawtext's own
    // colon-delimited option parsing would otherwise misread the expression.
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
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        outputPath,
    ];

    execFileSync("ffmpeg", args, { stdio: "inherit" });
    console.log(`Video written to ${outputPath}`);
}

async function createAdminUserProfile(): Promise<User> {

    const answers = await prompts([
        {
            type: "text",
            name: "email",
            message: "Admin email:",
            validate: (v: string) => (v.includes("@") ? true : "Enter a valid email"),
        },
        {
            type: "password",
            name: "password",
            message: "Choose a password:",
            validate: (v: string) => (v.length >= 8 ? true : "Minimum 8 characters"),
        }
    ]);

    execFileSync(
        "npx",
        ["auth@latest", "create-admin", "--password", `${answers.password}`, "--email", `${answers.email}`, "--role", "admin", "--yes", "--name", "admin", "--data", "{\"acceptedTerms\": true, \"localisation\": \"en-GB\", \"dateOfBirth\": \"1990-01-01\"}"],
        { stdio: ["pipe", "inherit", "inherit"] }
    );

    return { name: "admin", password: answers.password };
}

function generateRandomUser() {

}

async function generateUsers(count: number) {

    let users: User[] = [];
    const adminUser = await createAdminUserProfile();
    users.push(adminUser);


}
