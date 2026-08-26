"use client";

import { useLeaderboard } from "../../hooks/useLeaderboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

function RankBadge({ rank }) {
  if (rank === 1)
    return (
      <span className="w-7 h-7 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center text-xs font-bold">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="w-7 h-7 rounded-full bg-zinc-400/20 text-zinc-300 border border-zinc-400/30 flex items-center justify-center text-xs font-bold">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">
        3
      </span>
    );
  return (
    <span className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
      {rank ?? "—"}
    </span>
  );
}

export default function GlobalLeaderboard() {
  const { leaderboard, loading, error } = useLeaderboard();

  if (loading) return <LoadingSpinner text="Loading standings…" />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-destructive">
            Failed to load global standings
          </p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold text-base truncate">
              Global Leaderboard
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top players across all leagues
            </p>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        {leaderboard.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No standings yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {leaderboard.map((player) => (
              <li
                key={player.user_id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  player.isCurrentUser && "bg-primary/5",
                )}
              >
                <RankBadge rank={player.rank} />

                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-muted">
                    {(player.display_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {player.display_name}
                    </span>
                    {player.isCurrentUser && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {player.correct_predictions}/{player.matches_predicted}{" "}
                    correct
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-primary">
                    {player.predictions}
                  </p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
