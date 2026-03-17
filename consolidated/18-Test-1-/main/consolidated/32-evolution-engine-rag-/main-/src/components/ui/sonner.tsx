// src/components/ui/Toaster.tsx
"use client"

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

interface ToasterPropsWithTheme extends ToasterProps {
  theme: string;
}

const toasterStyles: React.CSSProperties = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={toasterStyles}
      {...props}
    />
  );
};

export { Toaster };