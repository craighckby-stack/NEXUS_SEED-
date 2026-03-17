// src/components/ui/aspect-ratio.tsx
"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/**
 * AspectRatio component wrapper for Radix UI's AspectRatioPrimitive.
 * 
 * @param props - Props to be passed to the AspectRatioPrimitive.Root component.
 * @returns The AspectRatioPrimitive.Root component with the provided props.
 */
function AspectRatio({
  children,
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return (
    <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props}>
      {children}
    </AspectRatioPrimitive.Root>
  );
}

export { AspectRatio };