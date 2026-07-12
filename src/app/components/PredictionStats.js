"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PredictionStats({ user, correctPredictions }) {
  if (!user) return null;

  return (
    <Card className="border-prediction-correct/20 bg-prediction-correct/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Matchday correct</p>
          <div className="flex items-center gap-2">
            <Badge className="bg-prediction-correct/20 text-prediction-correct border-prediction-correct/30 border font-bold text-sm px-2.5">
              {correctPredictions}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              1pt result · 3pts exact
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
