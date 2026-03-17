// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
  className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
  const baseClassName = "bg-accent animate-pulse rounded-md";
  const combinedClassName = cn(baseClassName, className);

  return (
    <div
      data-slot="skeleton"
      className={combinedClassName}
      {...props}
    />
  );
}

export { Skeleton };