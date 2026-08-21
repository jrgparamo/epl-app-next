#!/usr/bin/env node
/**
 * Verify the points the app calculated (user_points in the TEST DB) match the
 * independent expected-points oracle. Exits non-zero on any mismatch, so it
 * doubles as a regression check.
 *
 * Run: node --env-file=.env.test scripts/verify-points.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTS_DIR = path.join(ROOT, "test-fixtures", "2025-26", "results");
const EXPECTED_FILE = path.join(
  ROOT,
  "test-fixtures",
  "2025-26",
  "expected-points.json",
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function matchdayByMatchId() {
  const files = (await readdir(RESULTS_DIR)).filter((f) =>
    /^matchday-\d+\.json$/.test(f),
  );
  const map = new Map();
  for (const file of files) {
    const { matches } = JSON.parse(
      await readFile(path.join(RESULTS_DIR, file), "utf8"),
    );
    for (const m of matches) map.set(String(m.id), m.matchday);
  }
  return map;
}

async function main() {
  const expected = JSON.parse(await readFile(EXPECTED_FILE, "utf8"));
  const mdById = await matchdayByMatchId();

  const users = await prisma.user.findMany({
    select: { id: true, displayName: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.displayName]));
  const rows = await prisma.userPoints.findMany({
    select: { userId: true, matchId: true, pointsEarned: true },
  });

  const actual = {};
  for (const u of users) {
    actual[u.displayName] = {
      byMatchday: Object.fromEntries(expected.matchdays.map((m) => [m, 0])),
      total: 0,
    };
  }
  for (const r of rows) {
    const name = nameById.get(r.userId);
    const md = mdById.get(r.matchId);
    if (!name || md == null) continue;
    actual[name].byMatchday[md] += r.pointsEarned;
    actual[name].total += r.pointsEarned;
  }

  const pad = (s, n) => String(s).padEnd(n);
  const padL = (s, n) => String(s).padStart(n);
  let failures = 0;

  console.log(
    pad("User", 10) + padL("expected", 10) + padL("actual", 8) + "  status",
  );
  console.log("-".repeat(38));
  for (const name of Object.keys(expected.users)) {
    const exp = expected.users[name].total;
    const act = actual[name]?.total ?? 0;
    // Per-matchday check too.
    let mdOk = true;
    for (const m of expected.matchdays) {
      if (
        (actual[name]?.byMatchday[m] ?? 0) !==
        expected.users[name].byMatchday[m]
      )
        mdOk = false;
    }
    const ok = exp === act && mdOk;
    if (!ok) failures++;
    console.log(
      pad(name, 10) +
        padL(exp, 10) +
        padL(act, 8) +
        "  " +
        (ok ? "✓" : "✗ MISMATCH"),
    );
  }
  console.log("-".repeat(38));

  const expTotal = Object.values(expected.users).reduce(
    (s, u) => s + u.total,
    0,
  );
  const actTotal = Object.values(actual).reduce((s, u) => s + u.total, 0);
  console.log(
    pad("TOTAL", 10) +
      padL(expTotal, 10) +
      padL(actTotal, 8) +
      "  " +
      (expTotal === actTotal && failures === 0 ? "✓" : "✗"),
  );

  if (failures === 0 && expTotal === actTotal) {
    console.log("\nPASS — app points match the oracle.");
  } else {
    console.log(`\nFAIL — ${failures} user mismatch(es).`);
    process.exitCode = 1;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
