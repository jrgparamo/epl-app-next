import { prisma } from "@/lib/prisma";

// Prisma is the source of truth for finished matches: the football-data free
// tier sometimes leaves played matches stuck at TIMED with null scores, so we
// snapshot results here and overlay them onto live fixtures on read.
//
// Reads are cached per matchday in-process (short TTL) to keep DB operations
// low on the Prisma free tier (200k ops/month; cached reads still count). The
// @prisma/adapter-pg client has no Accelerate cacheStrategy, so caching is
// app-level. Writes invalidate the affected matchday.

const RESULTS_TTL_MS = 60 * 1000;
const resultsCache = new Map(); // matchday(number) -> { expiry, rowsByMatchId, fixtureCount }

function invalidateMatchdayResults(matchday) {
  resultsCache.delete(Number(matchday));
}

/**
 * Load snapshot rows + learned fixture count for a matchday (cached).
 * @returns {Promise<{ rowsByMatchId: Map<string, object>, fixtureCount: number }>}
 */
async function loadMatchdayResults(matchday) {
  const md = Number(matchday);
  const cached = resultsCache.get(md);
  if (cached && Date.now() < cached.expiry) return cached;

  const [rows, meta] = await Promise.all([
    prisma.matchResult.findMany({ where: { matchday: md } }),
    prisma.matchdayMeta.findUnique({ where: { matchday: md } }),
  ]);

  const entry = {
    expiry: Date.now() + RESULTS_TTL_MS,
    rowsByMatchId: new Map(rows.map((r) => [r.matchId, r])),
    fixtureCount: meta?.fixtureCount ?? 0,
  };
  resultsCache.set(md, entry);
  return entry;
}

function matchFromResultRow(r) {
  return {
    id: Number(r.matchId),
    homeTeam: {
      name: r.homeTeamName,
      shortName: r.homeTeamShort || r.homeTeamName,
      tla: r.homeTeamTla,
      crest: null,
    },
    awayTeam: {
      name: r.awayTeamName,
      shortName: r.awayTeamShort || r.awayTeamName,
      tla: r.awayTeamTla,
      crest: null,
    },
    utcDate: r.utcDate instanceof Date ? r.utcDate.toISOString() : r.utcDate,
    status: r.status,
    matchday: r.matchday,
    score: {
      fullTime: { home: r.homeScore, away: r.awayScore },
      halfTime: { home: null, away: null },
    },
    venue: null,
  };
}

function buildMatchesFromResults(rowsByMatchId) {
  return [...rowsByMatchId.values()]
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map(matchFromResultRow);
}

function rowDataFromApiMatch(apiMatch, source) {
  const fullTime = apiMatch.score.fullTime;
  return {
    matchday: apiMatch.matchday,
    utcDate: new Date(apiMatch.utcDate),
    homeTeamName: apiMatch.homeTeam?.name ?? apiMatch.homeTeam?.shortName ?? "",
    homeTeamShort: apiMatch.homeTeam?.shortName ?? null,
    homeTeamTla: apiMatch.homeTeam?.tla ?? null,
    awayTeamName: apiMatch.awayTeam?.name ?? apiMatch.awayTeam?.shortName ?? "",
    awayTeamShort: apiMatch.awayTeam?.shortName ?? null,
    awayTeamTla: apiMatch.awayTeam?.tla ?? null,
    homeScore: Number(fullTime.home),
    awayScore: Number(fullTime.away),
    status: apiMatch.status === "AWARDED" ? "AWARDED" : "FINISHED",
    source,
  };
}

/**
 * Serve a matchday from Prisma when every fixture has a snapshot, so the
 * football-data API is never called for completed matchdays. Returns the built
 * match array when complete, otherwise `null` (caller should fetch + overlay).
 */
export async function getCompleteMatchdayFromDb(matchday) {
  if (!matchday) return null;
  const { rowsByMatchId, fixtureCount } = await loadMatchdayResults(matchday);
  if (fixtureCount > 0 && rowsByMatchId.size >= fixtureCount) {
    return buildMatchesFromResults(rowsByMatchId);
  }
  return null;
}

/**
 * Overlay snapshot results onto live API matches for a matchday: any match with
 * a snapshot takes the DB status + full-time score (DB wins, so a later stale
 * API response can't regress a finished match). Also learns the fixture count.
 */
export async function overlayMatchdayResults(matchday, apiMatches) {
  if (!matchday) return apiMatches;
  const state = await loadMatchdayResults(matchday);

  // Learn the fixture count from the live fixture list (only write on change).
  if (apiMatches.length && apiMatches.length !== state.fixtureCount) {
    await prisma.matchdayMeta.upsert({
      where: { matchday: Number(matchday) },
      create: { matchday: Number(matchday), fixtureCount: apiMatches.length },
      update: { fixtureCount: apiMatches.length },
    });
    invalidateMatchdayResults(matchday);
  }

  if (state.rowsByMatchId.size === 0) return apiMatches;
  return apiMatches.map((m) => {
    const row = state.rowsByMatchId.get(String(m.id));
    if (!row) return m;
    return {
      ...m,
      status: row.status,
      score: {
        ...(m.score || {}),
        fullTime: { home: row.homeScore, away: row.awayScore },
      },
    };
  });
}

/**
 * Snapshot every FINISHED/AWARDED match that carries a full-time score. Batched:
 * one read for existing rows, then writes only for new or changed results.
 * Never overwrites a `manual` row (admin entries win). Returns rows written.
 */
export async function snapshotFinishedMatches(matches) {
  const finished = (matches || []).filter(
    (m) =>
      (m?.status === "FINISHED" || m?.status === "AWARDED") &&
      m?.score?.fullTime?.home != null &&
      m?.score?.fullTime?.away != null,
  );
  if (finished.length === 0) return 0;

  const ids = finished.map((m) => String(m.id));
  const existing = await prisma.matchResult.findMany({
    where: { matchId: { in: ids } },
    select: { matchId: true, source: true, homeScore: true, awayScore: true },
  });
  const existingMap = new Map(existing.map((r) => [r.matchId, r]));

  let written = 0;
  const touched = new Set();
  for (const m of finished) {
    const matchId = String(m.id);
    const prev = existingMap.get(matchId);
    if (prev?.source === "manual") continue; // manual wins
    const home = Number(m.score.fullTime.home);
    const away = Number(m.score.fullTime.away);
    if (prev && prev.homeScore === home && prev.awayScore === away) continue;

    const data = rowDataFromApiMatch(m, "api");
    await prisma.matchResult.upsert({
      where: { matchId },
      create: { matchId, ...data },
      update: data,
    });
    touched.add(m.matchday);
    written += 1;
  }
  for (const md of touched) invalidateMatchdayResults(md);
  return written;
}

/**
 * Admin-entered final result for a match the API left stale. Always overwrites
 * (source "manual"), so a later API response can't clobber it. `fixture` is the
 * live match object (teams, matchday, utcDate) from the fixture list.
 */
export async function upsertManualMatchResult(fixture, homeScore, awayScore) {
  const matchId = String(fixture.id);
  const data = {
    matchday: fixture.matchday,
    utcDate: new Date(fixture.utcDate),
    homeTeamName: fixture.homeTeam?.name ?? fixture.homeTeam?.shortName ?? "",
    homeTeamShort: fixture.homeTeam?.shortName ?? null,
    homeTeamTla: fixture.homeTeam?.tla ?? null,
    awayTeamName: fixture.awayTeam?.name ?? fixture.awayTeam?.shortName ?? "",
    awayTeamShort: fixture.awayTeam?.shortName ?? null,
    awayTeamTla: fixture.awayTeam?.tla ?? null,
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    status: "FINISHED",
    source: "manual",
  };
  await prisma.matchResult.upsert({
    where: { matchId },
    create: { matchId, ...data },
    update: data,
  });
  invalidateMatchdayResults(fixture.matchday);
}
