import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  className?: string;
  type: string;
}

const baseClasses = `
  file:text-foreground 
  placeholder:text-muted-foreground 
  selection:bg-primary 
  selection:text-primary-foreground 
  dark:bg-input/30 
  border-input 
  flex 
  h-9 
  w-full 
  min-w-0 
  rounded-md 
  border 
  bg-transparent 
  px-3 
  py-1 
  text-base 
  shadow-xs 
  transition-[color,box-shadow] 
  outline-none 
  file:inline-flex 
  file:h-7 
  file:border-0 
  file:bg-transparent 
  file:text-sm 
  file:font-medium 
  disabled:pointer-events-none 
  disabled:cursor-not-allowed 
  disabled:opacity-50 
  md:text-sm
`;

const focusClasses = "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";
const errorClasses = "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(baseClasses, focusClasses, errorClasses, className)}
      {...props}
    />
  );
}

export { Input };