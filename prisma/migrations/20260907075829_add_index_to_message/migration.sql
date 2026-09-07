-- CreateIndex
CREATE INDEX "message_senderid_idx" ON "message"("senderid");

-- CreateIndex
CREATE INDEX "message_receiverid_idx" ON "message"("receiverid");

-- CreateIndex
CREATE INDEX "message_timestamp_idx" ON "message"("timestamp");
