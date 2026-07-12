"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { RiFingerprint2Line } from "@remixicon/react";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function SignInModal({ isOpen, onClose, onSignInSuccess }) {
  const { signInWithMagicLink, signInWithPasskey } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const isMobile = useIsMobile();

  const resetForm = () => {
    setEmail("");
    setMessage("");
    setMessageType("info");
    setLoading(false);
    setPasskeyLoading(false);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) throw error;
      setMessage("Check your email for the sign-in link!");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Failed to send magic link.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    setPasskeyLoading(true);
    setMessage("");
    try {
      const { error } = await signInWithPasskey();
      if (error) throw error;
      handleOpenChange(false);
      if (onSignInSuccess) onSignInSuccess();
    } catch (error) {
      setMessage(error.message || "Passkey sign-in failed.");
      setMessageType("error");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const formContent = (
    <div className="px-4 pb-2 space-y-4">
      <form onSubmit={handleMagicLink} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email webauthn"
            placeholder="you@example.com"
            className="h-11"
          />
        </div>

        {message && (
          <p
            className={
              messageType === "success"
                ? "text-xs text-prediction-correct"
                : "text-xs text-destructive"
            }
          >
            {message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-11"
          disabled={loading || passkeyLoading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Sending…
            </span>
          ) : (
            "Send magic link"
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2"
        onClick={handlePasskey}
        disabled={loading || passkeyLoading}
      >
        {passkeyLoading ? (
          <>
            <Spinner size="sm" />
            Waiting for passkey…
          </>
        ) : (
          <>
            <RiFingerprint2Line className="h-4 w-4" />
            Sign in with a passkey
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange} showSwipeHandle={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-base">Sign in</DrawerTitle>
            <DrawerDescription>
              No password needed — new accounts are created automatically.
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
          <DrawerFooter className="pt-2" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">Sign in</DialogTitle>
          <DialogDescription>
            No password needed — new accounts are created automatically.
          </DialogDescription>
        </DialogHeader>
        {formContent}
        <DialogFooter className="pt-2" />
      </DialogContent>
    </Dialog>
  );
}
