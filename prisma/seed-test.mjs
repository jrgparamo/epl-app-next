#!/usr/bin/env node
/**
 * Seed the TEST database with users, a league, and predictions for
 * matchdays 1–5 of the 2025/26 season.
 *
 * - Real predictions come from scores/*.json (MW1 for 7 users, MW2 for jorge).
 * - Remaining (user × matchday) gaps are filled with deterministic synthetic
 *   predictions so cumulative multi-week scoring can be verified.
 * - Match IDs are the real football-data IDs taken from the results fixtures.
 *
 * Run: npm run db:test:seed   (loads .env.test via --env-file)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCORES_DIR = path.join(ROOT, "scores");
const RESULTS_DIR = path.join(ROOT, "test-fixtures", "2025-26", "results");

// Guard: never seed the production database.
const DB_URL = process.env.DATABASE_URL ?? "";
if (DB_URL.includes("1249d9f4")) {
  console.error(
    "✗ Refusing to seed: DATABASE_URL points at the PRODUCTION DB.",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter });

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Deterministic PRNG so synthetic predictions are stable across runs.
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function syntheticScore(user, matchId) {
  const s = xmur3(`${user}:${matchId}`);
  return { home: s % 4, away: Math.floor(s / 4) % 4 };
}

async function loadRealPredictions() {
  const files = (await readdir(SCORES_DIR)).filter((f) => f.endsWith(".json"));
  const byUser = {};
  for (const file of files) {
    const user = file.split("-")[0];
    const data = JSON.parse(
      await readFile(path.join(SCORES_DIR, file), "utf8"),
    );
    byUser[user] ??= {};
    for (const [matchId, score] of Object.entries(data)) {
      byUser[user][matchId] = { home: score.home, away: score.away };
    }
  }
  return byUser;
}

async function loadResultMatchIds() {
  const files = (await readdir(RESULTS_DIR)).filter((f) =>
    /^matchday-\d+\.json$/.test(f),
  );
  const byMatchday = {};
  for (const file of files.sort()) {
    const { matchday, matches } = JSON.parse(
      await readFile(path.join(RESULTS_DIR, file), "utf8"),
    );
    byMatchday[matchday] = matches.map((m) => String(m.id));
  }
  return byMatchday;
}

async function main() {
  console.log(
    `Seeding test DB (cred ${DB_URL.split("//")[1]?.slice(0, 8)}…)\n`,
  );

  const realPreds = await loadRealPredictions();
  const matchdays = await loadResultMatchIds();
  const userNames = Object.keys(realPreds).sort(); // cisco, eric, ever, jorge, ...
  const adminName = "jorge";

  // Users
  const users = {};
  for (const name of userNames) {
    const user = await prisma.user.upsert({
      where: { email: `${name}@example.com` },
      create: {
        email: `${name}@example.com`,
        emailVerified: new Date(),
        displayName: cap(name),
        isAdmin: name === adminName,
      },
      update: { displayName: cap(name), isAdmin: name === adminName },
    });
    users[name] = user;
  }
  console.log(`✓ ${userNames.length} users`);

  // League + memberships
  const league = await prisma.league.upsert({
    where: { joinCode: "TEST26" },
    create: {
      name: "Test League 2025/26",
      description: "Seeded league for points-calculation testing",
      joinCode: "TEST26",
      createdById: users[adminName].id,
    },
    update: { name: "Test League 2025/26" },
  });
  for (const name of userNames) {
    await prisma.leagueMember.upsert({
      where: {
        leagueId_userId: { leagueId: league.id, userId: users[name].id },
      },
      create: {
        leagueId: league.id,
        userId: users[name].id,
        isAdmin: name === adminName,
      },
      update: { isAdmin: name === adminName },
    });
  }
  console.log(`✓ league ${league.joinCode} + ${userNames.length} members`);

  // Predictions: every user gets a prediction for every MW1–MW5 match.
  let real = 0;
  let synth = 0;
  for (const name of userNames) {
    for (const [, matchIds] of Object.entries(matchdays)) {
      for (const matchId of matchIds) {
        const fromFile = realPreds[name]?.[matchId];
        const score = fromFile ?? syntheticScore(name, matchId);
        if (fromFile) real++;
        else synth++;
        await prisma.prediction.upsert({
          where: { userId_matchId: { userId: users[name].id, matchId } },
          create: {
            userId: users[name].id,
            matchId,
            homeScore: score.home,
            awayScore: score.away,
            confidence: 1,
          },
          update: { homeScore: score.home, awayScore: score.away },
        });
      }
    }
  }
  console.log(
    `✓ predictions: ${real} real + ${synth} synthetic = ${real + synth}`,
  );

  const totalPreds = await prisma.prediction.count();
  console.log(`\nDone. user_predictions rows: ${totalPreds}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
