"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Define a type for the sheet props
type SheetProps = React.ComponentProps<typeof SheetPrimitive.Root>

// Define a type for the sheet trigger props
type SheetTriggerProps = React.ComponentProps<typeof SheetPrimitive.Trigger>

// Define a type for the sheet close props
type SheetCloseProps = React.ComponentProps<typeof SheetPrimitive.Close>

// Define a type for the sheet portal props
type SheetPortalProps = React.ComponentProps<typeof SheetPrimitive.Portal>

// Define a type for the sheet overlay props
type SheetOverlayProps = React.ComponentProps<typeof SheetPrimitive.Overlay> & {
  className?: string
}

// Define a type for the sheet content props
type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  children: React.ReactNode
  className?: string
}

// Define a type for the sheet header props
type SheetHeaderProps = React.ComponentProps<"div"> & {
  className?: string
}

// Define a type for the sheet footer props
type SheetFooterProps = React.ComponentProps<"div"> & {
  className?: string
}

// Define a type for the sheet title props
type SheetTitleProps = React.ComponentProps<typeof SheetPrimitive.Title> & {
  className?: string
}

// Define a type for the sheet description props
type SheetDescriptionProps = React.ComponentProps<typeof SheetPrimitive.Description> & {
  className?: string
}

// Create a sheet component
function Sheet({ ...props }: SheetProps) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

// Create a sheet trigger component
function SheetTrigger({ ...props }: SheetTriggerProps) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

// Create a sheet close component
function SheetClose({ ...props }: SheetCloseProps) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

// Create a sheet portal component
function SheetPortal({ ...props }: SheetPortalProps) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

// Create a sheet overlay component
function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

// Create a sheet content component
function SheetContent({ children, side = "right", className, ...props }: SheetContentProps) {
  const sideClasses = {
    right: "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    left: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    top: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
    bottom: "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

// Create a sheet header component
function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

// Create a sheet footer component
function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

// Create a sheet title component
function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

// Create a sheet description component
function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}