"use client";

import { useState } from "react";
import HowToPlayModal from "./HowToPlayModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Header({ predictions = 0 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold font-heading text-primary">
              logo
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Season Total
                </span>
                <Badge className="font-bold">{predictions}</Badge>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground px-2 h-7"
                onClick={() => setIsModalOpen(true)}
              >
                How to play
              </Button>
            </div>
          </div>
        </div>
      </header>

      <HowToPlayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
