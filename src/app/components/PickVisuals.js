"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getTeamLogo } from "@/lib/utils";

export function TeamLogo({ name, className = "h-5 w-5" }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <Image
        src={getTeamLogo(name)}
        alt={`${name} logo`}
        fill
        className="object-contain"
        onError={(e) => {
          e.target.src = "/team-logos/default.svg";
        }}
      />
    </div>
  );
}

export function PointsBadge({ points }) {
  if (points === null) return null;
  if (points === 3) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-prediction-correct/20 text-prediction-correct border-prediction-correct/30 border">
        +3
      </Badge>
    );
  }
  if (points === 1) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
        +1
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground"
    >
      0
    </Badge>
  );
}
