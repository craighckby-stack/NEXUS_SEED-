import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use color functions for more accurate color manipulation
        border: 'hsl(${theme('colors.border')})',
        input: 'hsl(${theme('colors.input')})',
        ring: 'hsl(${theme('colors.ring')})',
        background: 'hsl(${theme('colors.background')})',
        foreground: 'hsl(${theme('colors.foreground')})',
        primary: {
          DEFAULT: 'hsl(${theme('colors.primary')})',
          foreground: 'hsl(${theme('colors.primary.foreground')})',
        },
        secondary: {
          DEFAULT: 'hsl(${theme('colors.secondary')})',
          foreground: 'hsl(${theme('colors.secondary.foreground')})',
        },
        destructive: {
          DEFAULT: 'hsl(${theme('colors.destructive')})',
          foreground: 'hsl(${theme('colors.destructive.foreground')})',
        },
        muted: {
          DEFAULT: 'hsl(${theme('colors.muted')})',
          foreground: 'hsl(${theme('colors.muted.foreground')})',
        },
        accent: {
          DEFAULT: 'hsl(${theme('colors.accent')})',
          foreground: 'hsl(${theme('colors.accent.foreground')})',
        },
        popover: {
          DEFAULT: 'hsl(${theme('colors.popover')})',
          foreground: 'hsl(${theme('colors.popover.foreground')})',
        },
        card: {
          DEFAULT: 'hsl(${theme('colors.card')})',
          foreground: 'hsl(${theme('colors.card.foreground')})',
        },
      },
      borderRadius: {
        // Use calc() for more precise calculations
        lg: `calc(var(--radius) + ${theme('spacing.2')})`,
        md: `calc(var(--radius) - ${theme('spacing.4')})`,
        sm: `calc(var(--radius) - ${theme('spacing.8')})`,
      },
    },
  },
  plugins: [],
};

export default config;