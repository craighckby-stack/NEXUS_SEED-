import * as React from "react";
import { cn } from "@/lib/utils";
import { AvatarPrimitive, AvatarPrimitiveRoot, AvatarPrimitiveImage, AvatarPrimitiveFallback } from "@radix-ui/react-avatar";
import { User } from "lucide-react";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitiveRoot>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitiveRoot>
>(({ className, src, ...props }, ref) => {
  return (
    <AvatarPrimitiveRoot
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <AvatarPrimitiveFallback className="flex h-full w-full items-center justify-center rounded-full bg-muted">
        <User className="h-5 w-5 text-muted-foreground" />
      </AvatarPrimitiveFallback>
      {src && <AvatarPrimitive.Image className="aspect-square h-full w-full" src={src} />}
    </AvatarPrimitiveRoot>
  );
});

Avatar.displayName = AvatarPrimitiveRoot.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitiveImage>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitiveImage>
>(({ className, src, ...props }, ref) => {
  return (
    <AvatarPrimitiveImage
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      src={src}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitiveImage.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitiveFallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitiveFallback>
>(({ className, ...props }, ref) => {
  return (
    <AvatarPrimitiveFallback
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitiveFallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
```

**