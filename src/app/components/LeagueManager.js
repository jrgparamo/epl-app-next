"use client";

import { useState } from "react";
import { useLeagues } from "../../hooks/useLeagues";
import QRCodeModal from "./QRCodeModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  RiAddLine,
  RiLoginBoxLine,
  RiFileCopyLine,
  RiQrCodeLine,
  RiDeleteBinLine,
} from "@remixicon/react";

export default function LeagueManager() {
  const { leagues, loading, error, createLeague, joinLeague, deleteLeague } =
    useLeagues();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [joinCode, setJoinCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    joinCode: "",
    leagueName: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    leagueId: "",
    leagueName: "",
  });

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await createLeague(createForm.name, createForm.description);
      setCreateForm({ name: "", description: "" });
      setShowCreateForm(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await joinLeague(joinCode.trim());
      setJoinCode("");
      setShowJoinForm(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLeague = async () => {
    if (!deleteModal.leagueId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteLeague(deleteModal.leagueId);
      setDeleteModal({ isOpen: false, leagueId: "", leagueName: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading leagues…" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Your Leagues</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => {
                  setShowJoinForm((v) => !v);
                  setShowCreateForm(false);
                  setActionError(null);
                }}
              >
                <RiLoginBoxLine className="h-3.5 w-3.5" />
                Join
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => {
                  setShowCreateForm((v) => !v);
                  setShowJoinForm(false);
                  setActionError(null);
                }}
              >
                <RiAddLine className="h-3.5 w-3.5" />
                Create
              </Button>
            </div>
          </div>
        </CardHeader>

        {(error || actionError) && (
          <div className="px-4 pb-3">
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {error || actionError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <form onSubmit={handleCreateLeague} className="space-y-3">
                <h3 className="text-sm font-medium">Create New League</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="league-name" className="text-xs">
                    League Name
                  </Label>
                  <Input
                    id="league-name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter league name"
                    maxLength={100}
                    required
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="league-desc" className="text-xs">
                    Description (optional)
                  </Label>
                  <Input
                    id="league-desc"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your league"
                    className="h-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={actionLoading || !createForm.name.trim()}
                    className="flex-1"
                  >
                    {actionLoading ? "Creating…" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setActionError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}

        {/* Join Form */}
        {showJoinForm && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <form onSubmit={handleJoinLeague} className="space-y-3">
                <h3 className="text-sm font-medium">Join a League</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="join-code" className="text-xs">
                    Join Code
                  </Label>
                  <Input
                    id="join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    required
                    className="h-9 font-mono tracking-widest uppercase"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={actionLoading || !joinCode.trim()}
                    className="flex-1"
                  >
                    {actionLoading ? "Joining…" : "Join"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowJoinForm(false);
                      setActionError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}

        {/* Leagues list */}
        {leagues.length === 0 ? (
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No leagues yet. Create one or join with a code.
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {leagues.map((league) => (
              <div key={league.id} className="px-4 py-3">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({
                          isOpen: true,
                          leagueId: league.id,
                          leagueName: league.name,
                        });
                      }}
                    >
                      <RiDeleteBinLine className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* QR Code Sheet */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() =>
          setQrModal({ isOpen: false, joinCode: "", leagueName: "" })
        }
        joinCode={qrModal.joinCode}
        leagueName={qrModal.leagueName}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => {
          if (!open)
            setDeleteModal({ isOpen: false, leagueId: "", leagueName: "" });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete League</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteModal.leagueName}&quot;? This cannot be
              undone. All members will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {actionError}
              </AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteLeague}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting…" : "Delete League"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
