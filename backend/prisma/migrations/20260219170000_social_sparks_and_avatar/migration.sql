ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

CREATE TABLE "SocialSpark" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialSpark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SocialSpark_userId_createdAt_idx" ON "SocialSpark"("userId", "createdAt");
