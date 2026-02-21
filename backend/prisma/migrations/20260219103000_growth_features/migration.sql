ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Habit" ADD COLUMN "repeat" TEXT NOT NULL DEFAULT 'DAILY';
ALTER TABLE "Habit" ADD COLUMN "repeatDays" TEXT;
ALTER TABLE "Habit" ADD COLUMN "difficulty" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Habit" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "AllyInvitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" DATETIME,
  CONSTRAINT "AllyInvitation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AllyInvitation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AllyInvitation_fromUserId_toUserId_key" ON "AllyInvitation"("fromUserId", "toUserId");

CREATE TABLE "WeeklyChallenge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "targetDays" INTEGER NOT NULL DEFAULT 5,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyChallenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WeeklyChallengeParticipant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "challengeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completedDays" TEXT,
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "WeeklyChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WeeklyChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WeeklyChallengeParticipant_challengeId_userId_key" ON "WeeklyChallengeParticipant"("challengeId", "userId");

CREATE TABLE "SocialPing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "seen" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialPing_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SocialPing_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SocialPing_toUserId_idx" ON "SocialPing"("toUserId");
