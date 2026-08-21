#!/usr/bin/env node
/**
 * Independent expected-points oracle. Re-implements the 3/1/0 scoring rules
 * (separately from src/lib/points.js) over the seeded predictions + the real
 * results fixtures, so we can assert the app's calculation is correct.
 *
 * Reads predictions from the TEST DB and results from test-fixtures, writes
 * test-fixtures/2025-26/expected-points.json, and prints a table.
 *
 * Run: node --env-file=.env.test scripts/compute-expected.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTS_DIR = path.join(ROOT, "test-fixtures", "2025-26", "results");
const OUT_FILE = path.join(
  ROOT,
  "test-fixtures",
  "2025-26",
  "expected-points.json",
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// Points for one prediction vs one actual result.
function scorePrediction(pred, actual) {
  if (actual.home == null || actual.away == null) return 0;
  if (pred.home === actual.home && pred.away === actual.away) return 3;
  if (sign(pred.home - pred.away) === sign(actual.home - actual.away)) return 1;
  return 0;
}

async function loadResults() {
  const files = (await readdir(RESULTS_DIR)).filter((f) =>
    /^matchday-\d+\.json$/.test(f),
  );
  const byId = new Map();
  for (const file of files) {
    const { matches } = JSON.parse(
      await readFile(path.join(RESULTS_DIR, file), "utf8"),
    );
    for (const m of matches) {
      if (m.status === "FINISHED") {
        byId.set(String(m.id), {
          matchday: m.matchday,
          home: m.score.fullTime.home,
          away: m.score.fullTime.away,
        });
      }
    }
  }
  return byId;
}

async function main() {
  const results = await loadResults();
  const matchdays = [
    ...new Set([...results.values()].map((r) => r.matchday)),
  ].sort((a, b) => a - b);

  const users = await prisma.user.findMany({
    select: { id: true, displayName: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.displayName]));
  const predictions = await prisma.prediction.findMany({
    select: { userId: true, matchId: true, homeScore: true, awayScore: true },
  });

  // user → { byMatchday: {md: pts}, total, exact, result }
  const acc = {};
  for (const u of users) {
    acc[u.displayName] = {
      byMatchday: Object.fromEntries(matchdays.map((m) => [m, 0])),
      total: 0,
      exact: 0,
      result: 0,
    };
  }

  for (const p of predictions) {
    const actual = results.get(p.matchId);
    if (!actual) continue;
    const name = nameById.get(p.userId);
    const pts = scorePrediction(
      { home: p.homeScore, away: p.awayScore },
      actual,
    );
    if (pts === 0) continue;
    acc[name].byMatchday[actual.matchday] += pts;
    acc[name].total += pts;
    if (pts === 3) acc[name].exact += 1;
    else acc[name].result += 1;
  }

  const totalsByMatchday = Object.fromEntries(matchdays.map((m) => [m, 0]));
  for (const name of Object.keys(acc)) {
    for (const m of matchdays) totalsByMatchday[m] += acc[name].byMatchday[m];
  }

  const output = { season: "2025-26", matchdays, users: acc, totalsByMatchday };
  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + "\n");

  // Print table
  const pad = (s, n) => String(s).padEnd(n);
  const padL = (s, n) => String(s).padStart(n);
  const header =
    pad("User", 10) +
    matchdays.map((m) => padL(`MD${m}`, 6)).join("") +
    padL("Total", 8) +
    padL("exact", 7) +
    padL("res", 5);
  console.log(header);
  console.log("-".repeat(header.length));
  for (const name of Object.keys(acc).sort(
    (a, b) => acc[b].total - acc[a].total,
  )) {
    const row = acc[name];
    console.log(
      pad(name, 10) +
        matchdays.map((m) => padL(row.byMatchday[m], 6)).join("") +
        padL(row.total, 8) +
        padL(row.exact, 7) +
        padL(row.result, 5),
    );
  }
  console.log("-".repeat(header.length));
  console.log(
    pad("TOTAL", 10) +
      matchdays.map((m) => padL(totalsByMatchday[m], 6)).join(""),
  );
  console.log(`\n→ ${path.relative(ROOT, OUT_FILE)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
