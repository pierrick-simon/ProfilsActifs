CREATE TABLE IF NOT EXISTS "user" (
    "id" text NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL,
    "image" text,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL,
    "acceptedTerms" boolean NOT NULL,
    "role" text,
    "banned" boolean,
    "banReason" text,
    "banExpires" timestamptz
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" text NOT NULL PRIMARY KEY,
    "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "token" text NOT NULL UNIQUE,
    "expiresAt" timestamptz NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL,
    "impersonatedBy" text
    );
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
    "id" text NOT NULL PRIMARY KEY,
    "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "issuer" text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "accessTokenExpiresAt" timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    "scope" text,
    "idToken" text,
    "password" text,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");

CREATE TABLE IF NOT EXISTS "verification" (
    "id" text NOT NULL PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "like" (
    "id" text NOT NULL PRIMARY KEY,
    "likedUserId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "likerUserId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "timestamp" timestamptz NOT NULL,
    UNIQUE ("likedUserId", "likerUserId")
);

CREATE INDEX IF NOT EXISTS "like_identifier_idx" ON "like" ("id");

CREATE TABLE IF NOT EXISTS "video" (
    "id" text NOT NULL PRIMARY KEY,
    "url" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "views" integer NOT NULL
    );
CREATE INDEX IF NOT EXISTS "video_identifier_idx" ON "video" ("id");

CREATE TABLE IF NOT EXISTS "quiz" (
      "userId" text NOT NULL PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS "quiz_identifier_idx" ON "quiz" ("userId");

CREATE TABLE message (
     id text PRIMARY KEY,
     senderId text REFERENCES "user"(id) ON DELETE CASCADE,
     receiverId text REFERENCES "user"(id) ON DELETE CASCADE,
     content TEXT,
     timestamp timestamptz
);

CREATE INDEX IF NOT EXISTS "message_identifier_idx" ON "message"("id");
