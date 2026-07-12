"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function HowToPlayModal({ isOpen, onClose }) {
  const isMobile = useIsMobile();

  const content = (
    <div className="px-6 pb-6 space-y-4">
      <div className="bg-muted rounded-lg p-4">
        <h4 className="font-semibold text-sm text-center mb-1">
          Predict upcoming matches
        </h4>
        <p className="text-xs text-muted-foreground text-center">
          You can edit your predictions until the match kicks off.
        </p>
      </div>

      <div className="bg-muted rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-center">Scoring</h3>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Correct outcome</p>
            <p className="text-xs text-muted-foreground">Winner or draw</p>
          </div>
          <span className="text-sm font-bold text-prediction-correct">
            1 pt
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Exact score</p>
            <p className="text-xs text-muted-foreground">
              Correct result + exact scoreline
            </p>
          </div>
          <span className="text-sm font-bold text-prediction-correct">
            3 pts
          </span>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-base">How to play</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">How to play</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
