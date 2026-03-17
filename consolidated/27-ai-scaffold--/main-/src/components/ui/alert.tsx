// @filename src/components/ui/alert.tsx

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const AlertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive-foreground bg-destructive/10",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof AlertVariants> {
  /**
   * The Alert component variant.
   */
  variant: AlertVariants["variants"];
}

const Alert = React.forwardRef<
  HTMLDivElement,
  AlertProps
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={clsx(AlertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  Omit<React.HTMLAttributes<HTMLHeadingElement>, "children">
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={clsx("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  Omit<React.HTMLAttributes<HTMLParagraphElement>, "children">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };