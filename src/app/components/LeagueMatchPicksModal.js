"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { LoadingSpinner } from "./LoadingSpinner";
import { TeamLogo, PointsBadge } from "./PickVisuals";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLeaguePicks } from "@/hooks/useLeaguePicks";
import { scorePick } from "@/lib/pick-scoring";
import { isMatchFinished, getMatchStatusText } from "@/lib/utils";

function MemberPickRow({ pick, fullTime }) {
  const hasPick = pick.home_score != null && pick.away_score != null;
  const points = scorePick(
    hasPick
      ? { home_score: pick.home_score, away_score: pick.away_score }
      : null,
    fullTime,
  );

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${
        pick.isCurrentUser ? "bg-primary/5" : "bg-muted"
      }`}
    >
      <span className="text-sm font-medium truncate">
        {pick.isCurrentUser ? "You" : pick.display_name}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {hasPick ? (
          <span className="text-sm font-semibold tabular-nums">
            {pick.home_score}–{pick.away_score}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No pick</span>
        )}
        <PointsBadge points={points} />
      </div>
    </div>
  );
}

export default function LeagueMatchPicksModal({
  match,
  matchday,
  currentMatchday,
  isOpen,
  onClose,
}) {
  const isMobile = useIsMobile();
  // Only past matchdays are immutable; the current one changes live.
  const cacheable =
    matchday != null && currentMatchday != null && matchday < currentMatchday;
  const { data, loading, error } = useLeaguePicks(
    isOpen ? matchday : null,
    cacheable,
  );

  const row = data?.matches?.find((m) => m.id === String(match.id));
  const finished = isMatchFinished(match.status);
  const fullTime = finished
    ? (row?.score?.fullTime ?? match.score?.fullTime)
    : null;

  const homeShort = match.homeTeam.shortName || match.homeTeam.name;
  const awayShort = match.awayTeam.shortName || match.awayTeam.name;

  const header = (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <TeamLogo name={match.homeTeam.name} className="h-6 w-6" />
        <span className="truncate max-w-[100px] text-right">{homeShort}</span>
        {finished && fullTime?.home != null ? (
          <span className="font-bold tabular-nums px-1">
            {fullTime.home}–{fullTime.away}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-1">v</span>
        )}
        <span className="truncate max-w-[100px] text-left">{awayShort}</span>
        <TeamLogo name={match.awayTeam.name} className="h-6 w-6" />
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        {getMatchStatusText(match.status, match.utcDate)}
      </p>
    </div>
  );

  let body;
  if (loading && !data) {
    body = <LoadingSpinner text="Loading picks…" />;
  } else if (error) {
    body = (
      <p className="py-10 text-center text-sm text-destructive">
        Failed to load picks
      </p>
    );
  } else if (data && data.hasLeague === false) {
    body = (
      <div className="py-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Join a league to see other players&apos; picks.
        </p>
        <Link
          href="/account"
          onClick={onClose}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Go to Account
        </Link>
      </div>
    );
  } else if (!row || !row.started || row.picks.length === 0) {
    body = (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Picks unlock at kickoff.
      </p>
    );
  } else {
    body = (
      <div className="space-y-3">
        {header}
        <div className="space-y-1.5">
          {row.picks.map((pick) => (
            <MemberPickRow key={pick.user_id} pick={pick} fullTime={fullTime} />
          ))}
        </div>
      </div>
    );
  }

  const title = "League picks";

  if (isMobile) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-xl"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-base">{title}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="pb-2">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
