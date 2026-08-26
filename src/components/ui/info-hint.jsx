"use client";

import { RiInformationLine } from "@remixicon/react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Infotip: an icon whose sole purpose is to reveal a note, so it uses Popover
// (opens on hover AND tap) rather than a Tooltip, which is disabled on touch.
function InfoHint({
  label = "More info",
  children,
  className,
  contentClassName,
}) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={120}
        aria-label={label}
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/60 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 [&_svg]:size-3.5",
          className,
        )}
      >
        <RiInformationLine />
      </PopoverTrigger>
      <PopoverContent className={cn("text-muted-foreground", contentClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

export { InfoHint };
