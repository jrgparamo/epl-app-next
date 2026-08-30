-- CreateTable
CREATE TABLE "match_results" (
    "matchId" TEXT NOT NULL,
    "matchday" INTEGER NOT NULL,
    "utcDate" TIMESTAMP(3) NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "homeTeamShort" TEXT,
    "homeTeamTla" TEXT,
    "awayTeamName" TEXT NOT NULL,
    "awayTeamShort" TEXT,
    "awayTeamTla" TEXT,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINISHED',
    "source" TEXT NOT NULL DEFAULT 'api',
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("matchId")
);

-- CreateIndex
CREATE INDEX "match_results_matchday_idx" ON "match_results"("matchday");

-- CreateTable
CREATE TABLE "matchday_meta" (
    "matchday" INTEGER NOT NULL,
    "fixtureCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matchday_meta_pkey" PRIMARY KEY ("matchday")
);
