CREATE TABLE "SocialSparkVote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sparkId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialSparkVote_sparkId_fkey" FOREIGN KEY ("sparkId") REFERENCES "SocialSpark" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SocialSparkVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SocialSparkVote_sparkId_userId_key" ON "SocialSparkVote"("sparkId", "userId");
CREATE INDEX "SocialSparkVote_sparkId_idx" ON "SocialSparkVote"("sparkId");

CREATE TABLE "SocialSparkComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sparkId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialSparkComment_sparkId_fkey" FOREIGN KEY ("sparkId") REFERENCES "SocialSpark" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SocialSparkComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SocialSparkComment_sparkId_createdAt_idx" ON "SocialSparkComment"("sparkId", "createdAt");
