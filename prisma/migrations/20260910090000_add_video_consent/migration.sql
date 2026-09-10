-- CreateTable
CREATE TABLE "videoConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videoConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videoConsent_userId_key" ON "videoConsent"("userId");

-- AddForeignKey
ALTER TABLE "videoConsent" ADD CONSTRAINT "videoConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
