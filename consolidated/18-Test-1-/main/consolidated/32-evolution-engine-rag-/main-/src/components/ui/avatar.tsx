"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  className?: string
}

interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {
  className?: string
}

interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  className?: string
}

const Avatar = ({ className, ...props }: AvatarProps) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn(
      "relative flex items-center justify-center overflow-hidden rounded-full w-8 h-8 shrink-0",
      className
    )}
    {...props}
  />
)

const AvatarImage = ({ className, ...props }: AvatarImageProps) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn("object-cover w-full h-full", className)}
    {...props}
  />
)

const AvatarFallback = ({ className, ...props }: AvatarFallbackProps) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn(
      "bg-muted flex items-center justify-center rounded-full w-full h-full",
      className
    )}
    {...props}
  />
)

export { Avatar, AvatarImage, AvatarFallback }