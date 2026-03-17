// src/components/ui/breadcrumb.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Breadcrumb component
function Breadcrumb({ children, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props}>
      {children}
    </nav>
  );
}

// BreadcrumbList component
function BreadcrumbList({
  children,
  className,
  ...props
}: React.ComponentProps<"ol"> & { children: React.ReactNode }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  );
}

// BreadcrumbItem component
function BreadcrumbItem({
  children,
  className,
  ...props
}: React.ComponentProps<"li"> & { children: React.ReactNode }) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      {children}
    </li>
  );
}

// BreadcrumbLink component
function BreadcrumbLink({
  asChild,
  children,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

// BreadcrumbPage component
function BreadcrumbPage({
  children,
  className,
  ...props
}: React.ComponentProps<"span"> & { children: React.ReactNode }) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    >
      {children}
    </span>
  );
}

// BreadcrumbSeparator component
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li"> & { children: React.ReactNode }) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

// BreadcrumbEllipsis component
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};