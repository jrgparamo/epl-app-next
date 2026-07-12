"use client";

import { Empty } from "@/components/ui/empty";

export function EmptyState() {
  return (
    <div className="py-12">
      <Empty
        title="No matches available"
        description="Check back later or select a different matchday"
      />
    </div>
  );
}
