import { HTMLAttributes, JSX.Element } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from 'classnames';
import { clsx } from 'clsx';

// Token import from design system
import { badgeTokens } from '../tokens/badge';

const badgeVariants = cva(
  `${badgeTokens.base} transition-colors focus:outline-none focus:ring-2 focus:ring-ring-offset-2`,
  {
    variants: {
      default: { backgroundColor: badgeTokens.gray100, color: badgeTokens.gray800 },
      active: { backgroundColor: badgeTokens.green500, color: badgeTokens.white },
      idle: { backgroundColor: badgeTokens.yellow500, color: badgeTokens.white },
      error: { backgroundColor: badgeTokens.red500, color: badgeTokens.white },
      warning: { backgroundColor: badgeTokens.orange500, color: badgeTokens.white },
      success: { backgroundColor: badgeTokens.green500, color: badgeTokens.white },
      info: { backgroundColor: badgeTokens.blue500, color: badgeTokens.white },
      primary: { backgroundColor: badgeTokens.purple500, color: badgeTokens.white },
      secondary: { backgroundColor: badgeTokens.gray500, color: badgeTokens.white },
    },
    compoundVariants: [
      {
        variant: 'active',
        className: 'shadow-md',
      },
      {
        variant: 'error',
        className: 'shadow-md',
      },
      {
        variant: 'success',
        className: 'shadow-md',
      },
      {
        variant: 'warning',
        className: 'shadow-md',
      },
      {
        variant: 'info',
        className: 'shadow-md',
      },
      {
        variant: 'primary',
        className: 'shadow-md',
      },
      {
        variant: 'secondary',
        className: 'shadow-md',
      },
    ],
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variants;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps): JSX.Element {
  return (
    <div
      className={clsx(
        badgeVariants({ variant, compoundVariants: true }),
        className,
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
```

**