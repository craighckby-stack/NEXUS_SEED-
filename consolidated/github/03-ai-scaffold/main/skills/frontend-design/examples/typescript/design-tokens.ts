// Design Tokens — Type-Safe Token Definitions

// Location: {project_path}/skills/frontend-design/examples/typescript/design-tokens.ts

// Color Tokens
export interface ColorToken {
  [key: string]: string;
}

export interface ColorTokens {
  background: ColorToken;
  surface: ColorToken;
  surfaceSubtle: ColorToken;
  surfaceHover: ColorToken;

  text: ColorToken;
  textSecondary: ColorToken;
  textMuted: ColorToken;
  textInverse: ColorToken;

  border: ColorToken;
  borderSubtle: ColorToken;
  borderStrong: ColorToken;

  primary: ColorToken;
  primaryHover: ColorToken;
  primaryActive: ColorToken;
  primarySubtle: ColorToken;
  primaryMuted: ColorToken;
  primaryForeground: ColorToken;

  secondary: ColorToken;
  secondaryHover: ColorToken;
  secondaryActive: ColorToken;
  secondarySubtle: ColorToken;
  secondaryForeground: ColorToken;

  accent: ColorToken;
  accentHover: ColorToken;
  accentForeground: ColorToken;

  success: ColorToken;
  successSubtle: ColorToken;
  successForeground: ColorToken;

  warning: ColorToken;
  warningSubtle: ColorToken;
  warningForeground: ColorToken;

  danger: ColorToken;
  dangerSubtle: ColorToken;
  dangerForeground: ColorToken;

  info: ColorToken;
  infoSubtle: ColorToken;
  infoForeground: ColorToken;

  overlay: ColorToken;
  scrim: ColorToken;
}

// Typography Tokens
export interface Typography {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export interface TypographyTokens {
  display: Typography;
  h1: Typography;
  h2: Typography;
  h3: Typography;
  h4: Typography;
  body: Typography;
  bodySmall: Typography;
  caption: Typography;
  mono: Typography;
}

// Font Families
export interface FontFamilies {
  sans: string;
  serif: string;
  mono: string;
}

// Spacing Tokens
export interface SpacingToken {
  [key: string]: string;
}

export interface SpacingTokens {
  0: SpacingToken;
  px: SpacingToken;
  0.5: SpacingToken;
  1: SpacingToken;
  1.5: SpacingToken;
  2: SpacingToken;
  2.5: SpacingToken;
  3: SpacingToken;
  4: SpacingToken;
  5: SpacingToken;
  6: SpacingToken;
  7: SpacingToken;
  8: SpacingToken;
  9: SpacingToken;
  10: SpacingToken;
  12: SpacingToken;
  14: SpacingToken;
  16: SpacingToken;
  20: SpacingToken;
  24: SpacingToken;
  28: SpacingToken;
  32: SpacingToken;
  36: SpacingToken;
  40: SpacingToken;
  48: SpacingToken;
  56: SpacingToken;
  64: SpacingToken;
}

// Radius Tokens
export interface RadiusToken {
  [key: string]: string;
}

export interface RadiusTokens {
  none: RadiusToken;
  xs: RadiusToken;
  sm: RadiusToken;
  md: RadiusToken;
  lg: RadiusToken;
  xl: RadiusToken;
  '2xl': RadiusToken;
  '3xl': RadiusToken;
  full: RadiusToken;
}

// Shadow Tokens
export interface ShadowToken {
  [key: string]: string;
}

export interface ShadowTokens {
  xs: ShadowToken;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
  xl: ShadowToken;
  '2xl': ShadowToken;
  primary: ShadowToken;
  secondary: ShadowToken;
}

// Motion Tokens
export interface MotionToken {
  [key: string]: string;
}

export interface MotionTokens {
  instant: MotionToken;
  fast: MotionToken;
  base: MotionToken;
  slow: MotionToken;
  slower: MotionToken;

  easeIn: MotionToken;
  easeOut: MotionToken;
  easeInOut: MotionToken;
  easeBounce: MotionToken;

  transitionColors: MotionToken;
  transitionTransform: MotionToken;
  transitionOpacity: MotionToken;
  transitionAll: MotionToken;
}

// Component Size Tokens
export interface ComponentSizeToken {
  [key: string]: string;
}

export interface ComponentSizeTokens {
  button: ComponentSizeToken;
  input: ComponentSizeToken;
  icon: ComponentSizeToken;
  avatar: ComponentSizeToken;
}

// Z-Index Tokens
export interface ZIndexToken {
  [key: string]: number;
}

export interface ZIndexTokens {
  base: ZIndexToken;
  dropdown: ZIndexToken;
  sticky: ZIndexToken;
  fixed: ZIndexToken;
  modalBackdrop: ZIndexToken;
  modal: ZIndexToken;
  popover: ZIndexToken;
  tooltip: ZIndexToken;
  notification: ZIndexToken;
  max: ZIndexToken;
}

// Complete Design System
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  fontFamilies: FontFamilies;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
  componentSizes: ComponentSizeTokens;
  zIndex: ZIndexTokens;
}

// Theme Type
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  tokens: DesignTokens;
}

// Token Helpers
export function getCSSVariable(tokenPath: string): string {
  const parts = tokenPath.split('.');
  const tokenName = parts[parts.length - 1];
  
  // Convert camelCase to kebab-case
  const kebabCase = tokenName.replace(/([A-Z])/g, '-$1').toLowerCase();
  
  return `var(--${kebabCase})`;
}

export function getTokenValue(tokens: DesignTokens, path: string): string | undefined {
  const parts = path.split('.');
  let value: any = tokens;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return typeof value === 'string' ? value : undefined;
}

// Default Light Theme Tokens
export const lightThemeTokens: DesignTokens = {
  colors: {
    background: 'oklch(99% 0 0)',
    surface: 'oklch(100% 0 0)',
    surfaceSubtle: 'oklch(98% 0.005 250)',
    surfaceHover: 'oklch(97% 0.01 250)',
    
    text: 'oklch(20% 0.01 250)',
    textSecondary: 'oklch(45% 0.015 250)',
    textMuted: 'oklch(60% 0.01 250)',
    textInverse: 'oklch(98% 0 0)',
    
    border: 'oklch(90% 0.005 250)',
    borderSubtle: 'oklch(95% 0.003 250)',
    borderStrong: 'oklch(75% 0.01 250)',
    
    primary: 'oklch(55% 0.18 250)',
    primaryHover: 'oklch(50% 0.20 250)',
    primaryActive: 'oklch(45% 0.22 250)',
    primarySubtle: 'oklch(95% 0.03 250)',
    primaryMuted: 'oklch(85% 0.08 250)',
    primaryForeground: 'oklch(98% 0.01 250)',
    
    secondary: 'oklch(65% 0.08 280)',
    secondaryHover: 'oklch(60% 0.10 280)',
    secondaryActive: 'oklch(55% 0.12 280)',
    secondarySubtle: 'oklch(95% 0.02 280)',
    secondaryForeground: 'oklch(98% 0.01 280)',
    
    accent: 'oklch(70% 0.15 160)',
    accentHover: 'oklch(65% 0.17 160)',
    accentForeground: 'oklch(10% 0.01 160)',
    
    success: 'oklch(65% 0.15 145)',
    successSubtle: 'oklch(95% 0.03 145)',
    successForeground: 'oklch(98% 0.01 145)',
    
    warning: 'oklch(75% 0.15 85)',
    warningSubtle: 'oklch(95% 0.05 85)',
    warningForeground: 'oklch(15% 0.02 85)',
    
    danger: 'oklch(60% 0.20 25)',
    dangerSubtle: 'oklch(95% 0.04 25)',
    dangerForeground: 'oklch(98% 0.01 25)',
    
    info: 'oklch(65% 0.12 230)',
    infoSubtle: 'oklch(95% 0.02 230)',
    infoForeground: 'oklch(98% 0.01 230)',
    
    overlay: 'oklch(0% 0 0 / 0.5)',
    scrim: 'oklch(0% 0 0 / 0.3)',
  },
  
  typography: {
    display: {
      fontSize: 'clamp(3rem, 2.5rem + 2vw, 4.5rem)',
      lineHeight: '1.1',
      fontWeight: 800,
      letterSpacing: '-0.05em',
    },
    h1: {
      fontSize: 'clamp(2.25rem, 1.95rem + 1.2vw, 3.5rem)',
      lineHeight: '1.2',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: 'clamp(1.875rem, 1.65rem + 0.9vw, 2.5rem)',
      lineHeight: '1.3',
      fontWeight: 700,
    },
    h3: {
      fontSize: 'clamp(1.5rem, 1.35rem + 0.6vw, 2rem)',
      lineHeight: '1.4',
      fontWeight: 600,
    },
    h4: {
      fontSize: 'clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)',
      lineHeight: '1.5',
      fontWeight: 600,
    },
    body: {
      fontSize: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      lineHeight: '1.6',
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: 'clamp(0.875rem, 0.8rem + 0.2vw, 1rem)',
      lineHeight: '1.5',
      fontWeight: 400,
    },
    caption: {
      fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)',
      lineHeight: '1.4',
      fontWeight: 400,
      letterSpacing: '0.025em',
    },
    mono: {
      fontSize: '0.875rem',
      lineHeight