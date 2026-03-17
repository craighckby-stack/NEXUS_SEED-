// tailwind.config.js
import { config } from '@tailwindcss/postcss8-config';

module.exports = {
  // Load PostCSS configuration
  postcss8Config: config({
    postcss8: true,
  }),
  // Set Tailwind configuration
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,md}',
  ],
  theme: {
    extend: {
      // Custom theme colors
      colors: {
        // Map color names to hex values
        'primary': '#3498db',
        'secondary': '#f1c40f',
        'accent': '#2ecc71',
        // Success, warning, danger, and info colors
        'success': '#2ecc71',
        'warning': '#f1c40f',
        'danger': '#e74c3c',
        'info': '#3498db',
      },
      // Custom typography
      typography: {
        // Font sizes
        'font-size-xs': '0.75rem',
        'font-size-sm': '0.875rem',
        'font-size-base': '1rem',
        'font-size-lg': '1.125rem',
        'font-size-xl': '1.25rem',
        'font-size-2xl': '1.5rem',
        'font-size-3xl': '1.875rem',
        'font-size-4xl': '2.25rem',
        'font-size-5xl': '3rem',
        // Line heights
        'line-height-tight': '1.25',
        'line-height-snug': '1.375',
        'line-height-normal': '1.5',
        'line-height-relaxed': '1.625',
        'line-height-loose': '2',
      },
      // Custom spacing (8px system)
      spacing: {
        // 8px system mapping
        '0.5': '0.125rem',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
        '40': '10rem',
        '48': '12rem',
      },
    },
    // Custom component styles
    components: {
      // Button component styles
      button: {
        // Button base styles
        base: {
          'font-size': '1rem',
          'font-weight': '500',
          'text-align': 'center',
          // Color and background
          'color': 'var(--text)',
          'background-color': 'var(--background)',
          // Padding and border
          'padding': '0.75rem 1.5rem',
          'border': 'none',
          'border-radius': '0.25rem',
          // States and hover effects
          '&:hover': {
            'background-color': 'var(--background)',
          },
          '&:active': {
            'background-color': 'var(--background)',
          },
        },
      },
    },
  },
  plugins: [
    // Include Tailwind utilities
    require('@tailwindcss/forms'),
  ],
};