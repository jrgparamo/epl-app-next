#!/usr/bin/env node
/**
 * One-time fetch of real Premier League results from football-data.org,
 * committed as fixtures so points tests run offline and deterministically.
 *
 * Writes test-fixtures/2025-26/results/matchday-<n>.json in the shape the
 * cron endpoint understands ({ matches: [{ id, status, score.fullTime… }] }).
 *
 * Run: node --env-file=.env.test scripts/fetch-results.mjs [--md 1-5] [--season 2025]
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "test-fixtures", "2025-26", "results");

const API_BASE = "https://api.football-data.org/v4";
const PREMIER_LEAGUE = 2021;

function parseArgs(argv) {
  const args = { season: "2025", md: "1-5" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--season") args.season = argv[++i];
    else if (argv[i] === "--md") args.md = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

// "1-5" → [1,2,3,4,5]; "1,3,5" → [1,3,5]
function parseMatchdays(spec) {
  if (spec.includes("-")) {
    const [a, b] = spec.split("-").map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return spec.split(",").map(Number);
}

function slimMatch(m) {
  return {
    id: m.id,
    matchday: m.matchday,
    status: m.status,
    utcDate: m.utcDate,
    homeTeam: {
      name: m.homeTeam?.name,
      shortName: m.homeTeam?.shortName,
      tla: m.homeTeam?.tla,
    },
    awayTeam: {
      name: m.awayTeam?.name,
      shortName: m.awayTeam?.shortName,
      tla: m.awayTeam?.tla,
    },
    score: { fullTime: m.score?.fullTime ?? { home: null, away: null } },
  };
}

async function fetchMatchday(apiKey, season, md) {
  const url = `${API_BASE}/competitions/${PREMIER_LEAGUE}/matches?season=${season}&matchday=${md}`;
  const res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `MD${md}: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`,
    );
  }
  const data = await res.json();
  return (data.matches ?? []).map(slimMatch);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey =
    process.env.FOOTBALL_DATA_API_KEY ||
    process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY;
  if (!apiKey)
    throw new Error(
      "FOOTBALL_DATA_API_KEY not set (use --env-file=.env.test).",
    );

  const matchdays = parseMatchdays(args.md);
  await mkdir(OUT_DIR, { recursive: true });

  for (const md of matchdays) {
    const matches = await fetchMatchday(apiKey, args.season, md);
    const finished = matches.filter((m) => m.status === "FINISHED").length;
    const file = path.join(OUT_DIR, `matchday-${md}.json`);
    await writeFile(
      file,
      JSON.stringify({ season: args.season, matchday: md, matches }, null, 2) +
        "\n",
    );
    const ids = matches.map((m) => m.id);
    console.log(
      `✓ MD${md}: ${matches.length} matches (${finished} finished) — ids ${Math.min(...ids)}..${Math.max(...ids)} → ${path.relative(ROOT, file)}`,
    );
    // Stay well under the free-tier 10 req/min limit.
    if (matchdays.length > 8) await new Promise((r) => setTimeout(r, 6500));
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
