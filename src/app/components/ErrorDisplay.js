"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RiErrorWarningLine } from "@remixicon/react";

export function ErrorDisplay({ error }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <div className="w-full max-w-sm space-y-4">
        <Alert variant="destructive">
          <RiErrorWarningLine className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <p className="text-xs opacity-80">
              Make sure you have set up your Football Data API key in your
              environment variables.
            </p>
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
