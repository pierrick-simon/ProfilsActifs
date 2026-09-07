-- CreateTable
CREATE TABLE "favory" (
    "id" TEXT NOT NULL,
    "favoredUserId" TEXT NOT NULL,
    "favoriterUserId" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "favory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favory_favoredUserId_favoriterUserId_key" ON "favory"("favoredUserId", "favoriterUserId");

-- AddForeignKey
ALTER TABLE "favory" ADD CONSTRAINT "favory_favoredUserId_fkey" FOREIGN KEY ("favoredUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favory" ADD CONSTRAINT "favory_favoriterUserId_fkey" FOREIGN KEY ("favoriterUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
