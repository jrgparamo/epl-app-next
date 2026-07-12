"use client";

import { useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RiFileCopyLine, RiShareLine } from "@remixicon/react";

export default function QRCodeModal({ isOpen, onClose, joinCode, leagueName }) {
  const [copied, setCopied] = useState(false);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    `Join my EPL Prediction League "${leagueName}" with code: ${joinCode}`
  )}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy join code:", err);
    }
  };

  const handleShare = async () => {
    const shareText = `Join my EPL Prediction League "${leagueName}" with code: ${joinCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join My League", text: shareText });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-base">Share League</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Share this QR code or join code with friends
          </p>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl mx-auto w-fit">
            <Image
              src={qrCodeUrl}
              alt="League QR Code"
              width={160}
              height={160}
              className="mx-auto"
            />
          </div>

          {/* Join Code */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2 text-center">Join Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold text-primary tracking-widest">
                {joinCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={handleCopyCode}
              >
                <RiFileCopyLine className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Share button */}
          <Button className="w-full gap-2" onClick={handleShare}>
            <RiShareLine className="h-4 w-4" />
            Share Invite
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
