import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { fetchMatchesByMatchday } from "@/lib/matches-service";
import { hasMatchStarted } from "@/lib/utils";
import { scorePick } from "@/lib/pick-scoring";

export const dynamic = "force-dynamic";

function displayNameFor(user) {
  return user.displayName || user.email?.split("@")[0] || "Anonymous";
}

// Returns, per match in a matchday, the score predictions of everyone who shares
// a league with the caller (union across all their leagues, deduped by user).
// Anti-copy: picks for matches that have not kicked off are withheld server-side.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchday = searchParams.get("matchday");

  if (!matchday) {
    return NextResponse.json(
      { error: "matchday is required" },
      { status: 400 },
    );
  }

  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const memberships = await prisma.leagueMember.findMany({
      where: { userId: user.id },
      select: { leagueId: true },
    });

    if (memberships.length === 0) {
      return NextResponse.json({
        hasLeague: false,
        matchday: Number(matchday),
        matches: [],
      });
    }

    const leagueIds = memberships.map((m) => m.leagueId);
    const [matches, memberRows] = await Promise.all([
      fetchMatchesByMatchday(matchday),
      prisma.leagueMember.findMany({
        where: { leagueId: { in: leagueIds } },
        select: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      }),
    ]);

    // Dedup members that share more than one league with the caller.
    const membersById = new Map();
    for (const row of memberRows) {
      if (!membersById.has(row.user.id)) membersById.set(row.user.id, row.user);
    }
    const members = [...membersById.values()];
    const memberIds = members.map((m) => m.id);

    const matchIds = matches.map((m) => String(m.id));
    const predictions = await prisma.prediction.findMany({
      where: { userId: { in: memberIds }, matchId: { in: matchIds } },
      select: { userId: true, matchId: true, homeScore: true, awayScore: true },
    });
    const pickByKey = new Map(
      predictions.map((p) => [`${p.userId}:${p.matchId}`, p]),
    );

    const rows = matches.map((m) => {
      const id = String(m.id);
      const started = hasMatchStarted(m.utcDate);
      const fullTime = m.score?.fullTime ?? { home: null, away: null };

      let picks = [];
      if (started) {
        picks = members.map((member) => {
          const pick = pickByKey.get(`${member.id}:${id}`);
          return {
            user_id: member.id,
            display_name: displayNameFor(member),
            home_score: pick ? pick.homeScore : null,
            away_score: pick ? pick.awayScore : null,
            isCurrentUser: member.id === user.id,
          };
        });

        // Current user first, then finished matches by points desc, else name.
        picks.sort((a, b) => {
          if (a.isCurrentUser !== b.isCurrentUser)
            return a.isCurrentUser ? -1 : 1;
          const pa = scorePick(
            a.home_score == null
              ? null
              : { home_score: a.home_score, away_score: a.away_score },
            fullTime,
          );
          const pb = scorePick(
            b.home_score == null
              ? null
              : { home_score: b.home_score, away_score: b.away_score },
            fullTime,
          );
          if (pa !== pb) return (pb ?? -1) - (pa ?? -1);
          return a.display_name.localeCompare(b.display_name);
        });
      }

      return {
        id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        utcDate: m.utcDate,
        status: m.status,
        score: { fullTime },
        started,
        locked: !started,
        picks,
      };
    });

    return NextResponse.json({
      hasLeague: true,
      matchday: Number(matchday),
      matches: rows,
    });
  } catch (error) {
    console.error("GET /api/predictions/league-picks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch league picks" },
      { status: 500 },
    );
  }
}
