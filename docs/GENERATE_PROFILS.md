# How to generate fake profiles

Generates fake candidate/recruiter (and optionally admin) accounts for dev/staging, with a synthetic intro video per candidate.

## Prerequisites
- FFmpeg installed and on `PATH`
- Auth, DB, and video provider configured (`@/lib/auth`, `@/lib/db`, `@/lib/video-provider`)

## Run

```bash
npm run generate_profiles
```

## What you'll be asked

1. **"Are you an admin?"**
    - Yes → enter existing admin email/password.
    - No → prompted to create a new admin account.
2. **"Clear existing users before generating new ones?"**
    - ⚠️ Yes = deletes **all non-admin users** in the database. Only confirm if you're on the right environment.

Then it runs automatically: 300 candidates + 200 recruiters by default, up to 10 at a time.

## Output

- `./generated_users.json` — list of `{ email, password, role }` for every user created (plaintext passwords — don't commit this file).
- Console logs showing progress and total runtime.

## Customizing counts

Edit the top of the file:

```ts
const CandidateCount = 300;
const RecruiterCount = 200;
```

or call `generateUsers(candidateCount, recruiterCount)` directly with your own numbers.