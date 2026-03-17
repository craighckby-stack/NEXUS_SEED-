import * as React from "react";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import { tooltip } from "@radix-ui/react-tooltip";

interface TooltipContentProps extends ComponentPropsWithoutRef<typeof tooltip.Content> {
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLElement, TooltipContentProps>(
  ({ className, sideOffset = 4, ...props }, ref) => {
    const classes = cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0",
      {
        "data-[state=closed]:fade-out-0": true,
        "data-[state=delayed]:fade-out-100": true,
        "data-[state=instant]:fade-out-0": true,
        "data-[state=fast]:fade-out-50": true,
      },
      className
    );

    return (
      <tooltip.Content
        ref={ref}
        sideOffset={sideOffset}
        className={classes}
        {...props}
      />
    );
  }
);

TooltipContent.displayName = tooltip.Content.displayName;

export {
  tooltip.Root as Tooltip,
  tooltip.Trigger as TooltipTrigger,
  TooltipContent,
  tooltip.Provider as TooltipProvider,
};
```

**