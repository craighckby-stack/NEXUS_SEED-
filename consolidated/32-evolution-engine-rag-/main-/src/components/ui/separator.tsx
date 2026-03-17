"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

interface SeparatorProps extends React.ComponentProps<typeof SeparatorPrimitive.Root> {
  /**
   * The orientation of the separator.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical"
  /**
   * Whether the separator is decorative.
   * @default true
   */
  decorative?: boolean
}

function Separator({ className, orientation = "horizontal", decorative = true, ...props }: SeparatorProps) {
  const baseClass = cn(
    "bg-border shrink-0",
    {
      "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full": orientation === "horizontal",
      "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px": orientation === "vertical",
    }
  )

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(baseClass, className)}
      {...props}
    />
  )
}

export { Separator }