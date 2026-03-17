// src/components/ui/card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

// Define a type for the Card component props
type CardProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Define a type for the CardHeader component props
type CardHeaderProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Define a type for the CardTitle component props
type CardTitleProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Define a type for the CardDescription component props
type CardDescriptionProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Define a type for the CardAction component props
type CardActionProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Define a type for the CardContent component props
type CardContentProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Define a type for the CardFooter component props
type CardFooterProps = React.ComponentProps<"div"> & {
  className?: string;
};

// Create a Card component
function Card({ className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

// Create a CardHeader component
function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

// Create a CardTitle component
function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

// Create a CardDescription component
function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

// Create a CardAction component
function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

// Create a CardContent component
function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

// Create a CardFooter component
function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

// Export the components
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};