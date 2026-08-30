"use client";

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
import { LoadingSpinner } from "./LoadingSpinner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMemberPicks } from "@/hooks/useMemberPicks";
import { isMatchFinished, formatMatchDate, formatMatchTime } from "@/lib/utils";
import { scorePick } from "@/lib/pick-scoring";
import { TeamLogo, PointsBadge } from "./PickVisuals";
import { RiLockLine } from "@remixicon/react";

function PickCell({ label, pick, fullTime, highlight }) {
  const points = scorePick(pick, fullTime);

  let value;
  if (pick?.locked) {
    value = (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <RiLockLine className="h-3.5 w-3.5" />
        Locked
      </span>
    );
  } else if (pick) {
    value = `${pick.home_score} – ${pick.away_score}`;
  } else {
    value = <span className="text-muted-foreground">No pick</span>;
  }

  return (
    <div
      className={`rounded-lg px-3 py-2 text-center ${
        highlight ? "bg-primary/5" : "bg-muted"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
        {label}
      </p>
      <div className="mt-0.5 flex items-center justify-center gap-1.5">
        <span className="text-sm font-semibold">{value}</span>
        <PointsBadge points={points} />
      </div>
    </div>
  );
}

function MatchRow({ match, targetName }) {
  const finished = isMatchFinished(match.status);
  const fullTime = finished ? match.score?.fullTime : null;

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {formatMatchDate(match.utcDate)} · {formatMatchTime(match.utcDate)}
        </span>
        {finished && fullTime?.home != null && (
          <span className="font-medium text-foreground">
            FT {fullTime.home} – {fullTime.away}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <TeamLogo name={match.homeTeam.name} />
        <span className="truncate max-w-[90px] text-right">
          {match.homeTeam.shortName}
        </span>
        <span className="text-xs text-muted-foreground">v</span>
        <span className="truncate max-w-[90px] text-left">
          {match.awayTeam.shortName}
        </span>
        <TeamLogo name={match.awayTeam.name} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PickCell label="You" pick={match.me} fullTime={fullTime} highlight />
        <PickCell label={targetName} pick={match.them} fullTime={fullTime} />
      </div>
    </div>
  );
}

export default function MemberPicksModal({
  userId,
  displayName,
  matchday,
  currentMatchday,
  isOpen,
  onClose,
}) {
  const isMobile = useIsMobile();
  // Only past matchdays are immutable; never cache the live current matchday.
  const cacheable =
    matchday != null && currentMatchday != null && matchday < currentMatchday;
  const { data, loading, error } = useMemberPicks(
    isOpen ? userId : null,
    isOpen ? matchday : null,
    cacheable,
  );

  const targetName = data?.target?.display_name || displayName || "Player";

  let body;
  if (loading) {
    body = <LoadingSpinner text="Loading picks…" />;
  } else if (error) {
    body = (
      <p className="py-10 text-center text-sm text-destructive">
        Failed to load picks
      </p>
    );
  } else if (!data || data.matches.length === 0) {
    body = (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No matches this matchday
      </p>
    );
  } else {
    const totals = data.matches.reduce(
      (acc, m) => {
        const fullTime = isMatchFinished(m.status) ? m.score?.fullTime : null;
        const mine = scorePick(m.me, fullTime);
        const theirs = scorePick(m.them, fullTime);
        if (mine != null) acc.me += mine;
        if (theirs != null) acc.them += theirs;
        return acc;
      },
      { me: 0, them: 0 },
    );

    body = (
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground text-center">
            Matchday {data.matchday} total
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                You
              </p>
              <p className="text-lg font-bold text-primary">{totals.me}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                {targetName}
              </p>
              <p className="text-lg font-bold text-primary">{totals.them}</p>
            </div>
          </div>
        </div>

        {data.matches.map((match) => (
          <MatchRow key={match.id} match={match} targetName={targetName} />
        ))}
      </div>
    );
  }

  const title = `You vs ${targetName}`;

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
