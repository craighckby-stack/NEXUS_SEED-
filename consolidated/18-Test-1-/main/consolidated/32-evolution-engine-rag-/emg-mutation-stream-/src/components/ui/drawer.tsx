"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

// --- Component Types ---

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>
type DrawerTriggerProps = React.ComponentProps<typeof DrawerPrimitive.Trigger>
type DrawerPortalProps = React.ComponentProps<typeof DrawerPrimitive.Portal>
type DrawerCloseProps = React.ComponentProps<typeof DrawerPrimitive.Close>
type DrawerOverlayProps = React.ComponentProps<typeof DrawerPrimitive.Overlay>
type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content>
type DrawerTitleProps = React.ComponentProps<typeof DrawerPrimitive.Title>
type DrawerDescriptionProps = React.ComponentProps<typeof DrawerPrimitive.Description>
type DrawerDivProps = React.ComponentProps<"div">

// --- Components ---

const Drawer: React.FC<DrawerProps> = (props) => (
  <DrawerPrimitive.Root data-slot="drawer" {...props} />
)

const DrawerTrigger: React.FC<DrawerTriggerProps> = (props) => (
  <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
)

const DrawerPortal: React.FC<DrawerPortalProps> = (props) => (
  <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
)

const DrawerClose: React.FC<DrawerCloseProps> = (props) => (
  <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
)

const DrawerOverlay: React.FC<DrawerOverlayProps> = ({ className, ...props }) => (
  <DrawerPrimitive.Overlay
    data-slot="drawer-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-black/50",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
)

const DrawerContent: React.FC<DrawerContentProps> = ({ className, children, ...props }) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      data-slot="drawer-content"
      className={cn(
        "group/drawer-content fixed z-50 flex h-auto flex-col bg-background",

        // Directional Positioning
        "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=bottom]:inset-x-0",
        "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=left]:inset-y-0",

        // Top Direction Styling
        "data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",

        // Bottom Direction Styling
        "data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",

        // Right Direction Styling
        "data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",

        // Left Direction Styling
        "data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
        
        className
      )}
      {...props}
    >
      {/* Handle: Visible only for bottom drawers */}
      <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
)

const DrawerHeader: React.FC<DrawerDivProps> = ({ className, ...props }) => (
  <div
    data-slot="drawer-header"
    className={cn(
      "flex flex-col gap-0.5 p-4 md:gap-1.5 md:text-left",
      // Centering for vertical drawers (top/bottom)
      "group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center",
      className
    )}
    {...props}
  />
)

const DrawerFooter: React.FC<DrawerDivProps> = ({ className, ...props }) => (
  <div
    data-slot="drawer-footer"
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)

const DrawerTitle: React.FC<DrawerTitleProps> = ({ className, ...props }) => (
  <DrawerPrimitive.Title
    data-slot="drawer-title"
    className={cn("font-semibold text-foreground", className)}
    {...props}
  />
)

const DrawerDescription: React.FC<DrawerDescriptionProps> = ({ className, ...props }) => (
  <DrawerPrimitive.Description
    data-slot="drawer-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}