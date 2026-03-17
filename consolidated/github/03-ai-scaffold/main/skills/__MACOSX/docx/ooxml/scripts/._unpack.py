# skills/frontend-design/LICENSE
"""
MIT License

Copyright (c) [Year] [Author]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

# skills/frontend-design/SKILL.md
"""
Frontend Design Skill
=====================

A comprehensive skill for transforming UI style requirements into production-ready frontend code with systematic design tokens, accessibility compliance, and creative execution.
"""

# skills/frontend-design/examples/css/tokens.css
"""
Design Tokens System
"""
colors = {
    'background': '--background',
    'surface': '--surface',
    'text': '--text',
    'primary': '--primary',
    'secondary': '--secondary',
    'accent': '--accent',
    'success': '--success',
    'warning': '--warning',
    'danger': '--danger',
    'info': '--info',
}

typography = {
    'font-size': {
        'xs': '--font-size-xs',
        'sm': '--font-size-sm',
        'base': '--font-size-base',
        'lg': '--font-size-lg',
        'xl': '--font-size-xl',
        '2xl': '--font-size-2xl',
        '3xl': '--font-size-3xl',
        '4xl': '--font-size-4xl',
        '5xl': '--font-size-5xl',
    },
    'line-height': {
        'tight': '--line-height-tight',
        'snug': '--line-height-snug',
        'normal': '--line-height-normal',
        'relaxed': '--line-height-relaxed',
        'loose': '--line-height-loose',
    },
    'font-weight': {
        'light': '--font-weight-light',
        'normal': '--font-weight-normal',
        'medium': '--font-weight-medium',
        'semibold': '--font-weight-semibold',
        'bold': '--font-weight-bold',
    },
}

spacing = {
    'small': '--spacing-0.5',
    'sm': '--spacing-1',
    'base': '--spacing-2',
    'lg': '--spacing-3',
    'xl': '--spacing-4',
    '2xl': '--spacing-6',
    '3xl': '--spacing-8',
    '4xl': '--spacing-10',
    '5xl': '--spacing-12',
    '6xl': '--spacing-16',
    '7xl': '--spacing-20',
    '8xl': '--spacing-24',
    '9xl': '--spacing-32',
    '10xl': '--spacing-40',
    '11xl': '--spacing-48',
}

# skills/frontend-design/examples/typescript/design-tokens.ts
interface Token {
  [key: string]: string;
}

const theme: Token = {
  ...colors,
  ...typography,
  ...spacing,
};

# skills/frontend-design/templates/tailwind.config.js
module.exports = {
  purge: [],
  theme: {
    extend: {
      colors: theme,
      typography: theme,
      spacing: theme,
    },
  },
  variants: {},
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};

#