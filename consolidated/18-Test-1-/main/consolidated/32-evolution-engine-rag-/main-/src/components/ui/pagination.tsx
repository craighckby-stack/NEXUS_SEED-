// src/components/ui/pagination.tsx

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

// Define a type for pagination props
type PaginationProps = React.ComponentProps<"nav"> & {
  className?: string;
};

// Create a Pagination component
function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

// Define a type for pagination content props
type PaginationContentProps = React.ComponentProps<"ul"> & {
  className?: string;
};

// Create a PaginationContent component
function PaginationContent({
  className,
  ...props
}: PaginationContentProps) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

// Define a type for pagination item props
type PaginationItemProps = React.ComponentProps<"li">;

// Create a PaginationItem component
function PaginationItem({ ...props }: PaginationItemProps) {
  return <li data-slot="pagination-item" {...props} />;
}

// Define a type for pagination link props
type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

// Create a PaginationLink component
function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  );
}

// Define a type for pagination previous props
type PaginationPreviousProps = React.ComponentProps<typeof PaginationLink>;

// Create a PaginationPrevious component
function PaginationPrevious({
  className,
  ...props
}: PaginationPreviousProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

// Define a type for pagination next props
type PaginationNextProps = React.ComponentProps<typeof PaginationLink>;

// Create a PaginationNext component
function PaginationNext({
  className,
  ...props
}: PaginationNextProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

// Define a type for pagination ellipsis props
type PaginationEllipsisProps = React.ComponentProps<"span">;

// Create a PaginationEllipsis component
function PaginationEllipsis({
  className,
  ...props
}: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

// Export all pagination components
export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};