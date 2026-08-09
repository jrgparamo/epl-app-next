#!/usr/bin/env node
/**
 * Manual trigger for the points-calculation cron.
 *
 * POSTs finished-match results to /api/cron/calculate-points with the
 * `Bearer <CRON_SECRET>` header. Use it to run the job by hand from this
 * machine — for local testing, or as a fallback when the scheduler is down.
 *
 * The cron endpoint accepts a `{ matches: [...] }` override, so this script
 * can score committed test fixtures without touching the live football API.
 * With --live (or no results source), the server fetches live finished
 * matches itself — the exact production behaviour.
 *
 * Run `node scripts/calculate-points.mjs --help` for full usage.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURES_DIR = path.join(ROOT, "test-fixtures", "2025-26", "results");

const USAGE = `
Manual points-calculation runner

Usage:
  node scripts/calculate-points.mjs [options]

Result source (pick one; default is --live):
  -m, --matchday <n>   Score committed fixtures for one matchday
                       (test-fixtures/2025-26/results/matchday-<n>.json)
      --all            Score every matchday-*.json fixture, merged
  -r, --results <file> Score a specific results JSON file
      --live           Send no matches; server fetches live finished matches
                       (real production behaviour)

Connection:
      --url <baseUrl>  Target server (default: $NEXT_PUBLIC_APP_URL or
                       http://localhost:3000)
      --env <file>     Env file to load CRON_SECRET / URL from
                       (default: .env.local)
      --secret <token> CRON_SECRET override (else read from env)

Other:
      --dry-run        Print the request that would be sent, don't send it
  -h, --help           Show this help

Examples:
  # Score matchday 1 fixtures against a local dev server (.env.local secret)
  node scripts/calculate-points.mjs --matchday 1

  # Score all fixtures against the test DB dev server
  node scripts/calculate-points.mjs --all --env .env.test

  # Trigger a real live run on production
  node scripts/calculate-points.mjs --live --url https://your-app.vercel.app
`;

function parseArgs(argv) {
  const args = {
    matchday: null,
    all: false,
    results: null,
    live: false,
    url: null,
    env: ".env.local",
    secret: null,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-m":
      case "--matchday":
        args.matchday = argv[++i];
        break;
      case "--all":
        args.all = true;
        break;
      case "-r":
      case "--results":
        args.results = argv[++i];
        break;
      case "--live":
        args.live = true;
        break;
      case "--url":
        args.url = argv[++i];
        break;
      case "--env":
        args.env = argv[++i];
        break;
      case "--secret":
        args.secret = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

/**
 * Normalise assorted fixture shapes into an array of football-data-style
 * match objects the cron understands: { id, status, score.fullTime.{home,away} }.
 *
 * Accepts:
 *   - { matches: [...] }        (football-data response / our fixtures)
 *   - [ ...match objects ]      (bare array)
 *   - { "537785": {home,away} } (flat id → score map, hand-written fixtures)
 */
function normaliseMatches(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.matches)) return raw.matches;

  const entries = Object.entries(raw ?? {});
  const looksLikeScoreMap = entries.every(
    ([, v]) => v && typeof v === "object" && "home" in v && "away" in v,
  );
  if (entries.length && looksLikeScoreMap) {
    return entries.map(([id, s]) => ({
      id: /^\d+$/.test(id) ? Number(id) : id,
      status: "FINISHED",
      score: { fullTime: { home: s.home, away: s.away } },
    }));
  }
  throw new Error("Unrecognised results file shape");
}

async function loadResultsFile(file) {
  const text = await readFile(file, "utf8");
  return normaliseMatches(JSON.parse(text));
}

async function collectMatches(args) {
  if (args.live) return null;

  if (args.results) {
    return loadResultsFile(path.resolve(process.cwd(), args.results));
  }

  if (args.all) {
    let files;
    try {
      files = (await readdir(FIXTURES_DIR)).filter((f) =>
        /^matchday-\d+\.json$/.test(f),
      );
    } catch {
      throw new Error(`Fixtures dir not found: ${FIXTURES_DIR}`);
    }
    if (files.length === 0) {
      throw new Error(`No matchday-*.json fixtures in ${FIXTURES_DIR}`);
    }
    const all = [];
    for (const f of files.sort()) {
      all.push(...(await loadResultsFile(path.join(FIXTURES_DIR, f))));
    }
    return all;
  }

  if (args.matchday != null) {
    const file = path.join(FIXTURES_DIR, `matchday-${args.matchday}.json`);
    return loadResultsFile(file);
  }

  // No source given → default to a live run.
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  loadEnv({ path: args.env });
  loadEnv({ path: ".env" });

  const baseUrl = (
    args.url ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const secret = args.secret || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error(
      `CRON_SECRET not set. Add it to ${args.env} or pass --secret.`,
    );
  }

  const matches = await collectMatches(args);
  const endpoint = `${baseUrl}/api/cron/calculate-points`;
  const body = matches ? JSON.stringify({ matches }) : undefined;

  console.log(`→ POST ${endpoint}`);
  console.log(
    matches
      ? `  scoring ${matches.length} supplied match(es)`
      : "  live run (server fetches finished matches)",
  );

  if (args.dryRun) {
    console.log("  --dry-run: not sending.");
    if (matches) console.log(body);
    return;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    console.error(`✗ ${res.status} ${res.statusText}`);
    console.error(json);
    process.exit(1);
  }

  console.log(`✓ ${res.status}`);
  console.log(json);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
