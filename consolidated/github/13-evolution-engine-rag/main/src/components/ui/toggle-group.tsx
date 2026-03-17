"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

interface ToggleGroupContextValue {
  size: VariantProps<typeof toggleVariants>["size"]
  variant: VariantProps<typeof toggleVariants>["variant"]
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
})

interface ToggleGroupProps extends React.ComponentProps<typeof ToggleGroupPrimitive.Root>, VariantProps<typeof toggleVariants> {}

function ToggleGroup({ className, variant, size, children, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

interface ToggleGroupItemProps extends React.ComponentProps<typeof ToggleGroupPrimitive.Item>, VariantProps<typeof toggleVariants> {}

function ToggleGroupItem({ className, children, variant, size, ...props }: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext)

  const mergedVariant = context.variant || variant
  const mergedSize = context.size || size

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={mergedVariant}
      data-size={mergedSize}
      className={cn(
        toggleVariants({ variant: mergedVariant, size: mergedSize }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }