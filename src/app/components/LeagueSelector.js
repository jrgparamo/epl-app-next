"use client";

import { useState } from "react";
import Link from "next/link";
import { useLeagues } from "../../hooks/useLeagues";
import QRCodeModal from "./QRCodeModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";
import { RiFileCopyLine, RiQrCodeLine } from "@remixicon/react";

export default function LeagueSelector({ onLeagueSelect, selectedLeagueId }) {
  const { leagues, loading, error } = useLeagues();
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    joinCode: "",
    leagueName: "",
  });

  if (loading) return <LoadingSpinner text="Loading leagues…" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <h2 className="font-semibold text-base">Your Leagues</h2>
        </CardHeader>

        {error && (
          <div className="px-4 pb-3">
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {leagues.length === 0 ? (
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No leagues yet. Create or join one from your account.
            </p>
            <Link
              href="/account"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Go to Account
            </Link>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {leagues.map((league) => (
              <div
                key={league.id}
                className={cn(
                  "px-4 py-3 cursor-pointer transition-colors",
                  selectedLeagueId === league.id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-accent",
                )}
                onClick={() => onLeagueSelect(league.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {league.name}
                    </span>
                    {league.isAdmin && (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                        Admin
                      </Badge>
                    )}
                    {league.isCreator && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        Creator
                      </Badge>
                    )}
                  </div>
                </div>

                {league.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {league.description}
                  </p>
                )}

                {(league.isCreator || league.isAdmin) && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {league.joinCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(league.joinCode);
                      }}
                    >
                      <RiFileCopyLine className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQrModal({
                          isOpen: true,
                          joinCode: league.joinCode,
                          leagueName: league.name,
                        });
                      }}
                    >
                      <RiQrCodeLine className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() =>
          setQrModal({ isOpen: false, joinCode: "", leagueName: "" })
        }
        joinCode={qrModal.joinCode}
        leagueName={qrModal.leagueName}
      />
    </div>
  );
}
