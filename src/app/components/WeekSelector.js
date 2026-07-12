"use client";

import { useRef, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WeekSelector({
  currentWeek,
  onWeekChange,
  totalWeeks = 38,
  currentMatchday = 1,
}) {
  const selectedRef = useRef(null);

  // Auto-scroll selected matchday into center view on mount and when selection changes
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentWeek]);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold text-foreground">Matchday</h2>
        <span className="text-xs text-muted-foreground">
          MD {currentMatchday} current
        </span>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2 px-1">
          {Array.from({ length: totalWeeks }, (_, i) => {
            const week = i + 1;
            const isSelected = currentWeek === week;
            const isCurrent = week === currentMatchday;
            const isPast = week < currentMatchday;

            return (
              <Button
                key={week}
                ref={isSelected ? selectedRef : undefined}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onWeekChange(week)}
                className={cn(
                  "shrink-0 h-9 min-w-[3rem] rounded-full text-xs font-medium transition-all touch-manipulation",
                  isSelected && "shadow-md",
                  !isSelected && isCurrent && "border-primary text-primary font-semibold",
                  !isSelected && isPast && "opacity-50"
                )}
              >
                {isPast && !isSelected ? `${week}` : week}
                {isCurrent && !isSelected && (
                  <span className="ml-0.5 inline-block w-1 h-1 rounded-full bg-primary" />
                )}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
