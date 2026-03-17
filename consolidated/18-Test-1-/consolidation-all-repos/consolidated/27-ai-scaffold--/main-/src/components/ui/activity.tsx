// src/components/ui/activity.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const Activity = cva(
  'rounded-full p-2 transition-all',
  {
    variants: {
      default: {
        bg: 'gray-100',
        color: 'gray-600',
        size: 'h-5 w-5',
      },
      active: {
        bg: 'green-100',
        color: 'green-600',
      },
      inactive: {
        bg: 'gray-100',
        color: 'gray-600',
      },
      pulse: {
        animation: 'animate-pulse',
      },
    },
    sizes: {
      default: {
        size: 'h-5 w-5',
      },
      sm: {
        size: 'h-4 w-4',
      },
      lg: {
        size: 'h-6 w-6',
      },
    },
  },
);

type ActivityProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof Activity['variants'] | null;
  size?: keyof Activity['sizes'] | null;
  pulse?: boolean;
};

function Activity({
  className,
  variant = 'default',
  size = 'default',
  pulse = false,
  ...props
}: ActivityProps) {
  const classes = clsx(Activity({ variant, size, pulse }), className);

  return <div className={classes} {...props} />;
}

export { Activity };
export type { ActivityProps };
```

**