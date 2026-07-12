"use client";

import { Badge } from "@/components/ui/badge";

export function MatchdayHeader({
  currentWeek,
  currentMatchday,
  loading,
  matches,
}) {
  const getStatusBadge = () => {
    if (currentWeek < currentMatchday) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    if (currentWeek > currentMatchday) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    return <Badge>Current</Badge>;
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Matchday {currentWeek}</h2>
        {getStatusBadge()}
      </div>
      <div className="text-sm text-muted-foreground">
        {loading && "Loading..."}
        {!loading && matches.length > 0 && `${matches.length} matches`}
      </div>
    </div>
  );
}
