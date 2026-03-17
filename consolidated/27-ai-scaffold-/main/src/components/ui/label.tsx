import React from 'react';
import LabelPrimitive from '@radix-ui/react-label';
import { cva, VariantProps } from 'class-variance-authority';

// Define label variants with improved naming and readability
const labelVariants = cva([
  'text-sm font-medium leading-none',
  'peer-disabled:cursor-not-allowed',
  'peer-disabled:opacity-70',
]);

// Type-safe LabelProps with merged types
type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof labelVariants>;

// Improved Label component with destructured props and concise JSX
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={labelVariants({ ...props, className })}
    {...props}
  />
));

// Set display name for React DevTools
Label.displayName = 'Label';

export default Label;