// Import required dependencies
import { color } from './color';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadow } from './shadow';
import { motion } from './motion';

// Token utility functions
function getHex(color: string): string {
  return color.replace(/^#/, '');
}

function getRgb(color: string): string {
  return color.replace(/^#/, '').match(/.{1,2}/g).join(',');
}

// Design tokens
export type ColorToken =
  | 'background'
  | 'surface'
  | 'text'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type TypographyToken =
  | 'font-size-xs'
  | 'font-size-sm'
  | 'font-size-base'
  | 'font-size-lg'
  | 'font-size-xl'
  | 'font-size-2xl'
  | 'font-size-3xl'
  | 'font-size-4xl'
  | 'font-size-5xl'
  | 'line-height-tight'
  | 'line-height-snug'
  | 'line-height-normal'
  | 'line-height-relaxed'
  | 'line-height-loose'
  | 'font-weight-light'
  | 'font-weight-normal'
  | 'font-weight-medium'
  | 'font-weight-semibold'
  | 'font-weight-bold';

export type SpacingToken =
  | 'spacing-0.5'
  | 'spacing-1'
  | 'spacing-2'
  | 'spacing-3'
  | 'spacing-4'
  | 'spacing-6'
  | 'spacing-8'
  | 'spacing-10'
  | 'spacing-12'
  | 'spacing-16'
  | 'spacing-20'
  | 'spacing-24'
  | 'spacing-32'
  | 'spacing-40'
  | 'spacing-48';

export type RadiusToken =
  | 'radius-none'
  | 'radius-sm'
  | 'radius-base'
  | 'radius-lg'
  | 'radius-xl'
  | 'radius-2xl'
  | 'radius-3xl'
  | 'radius-4xl'
  | 'radius-5xl';

export type ShadowToken =
  | 'shadow-none'
  | 'shadow-sm'
  | 'shadow-base'
  | 'shadow-lg'
  | 'shadow-xl'
  | 'shadow-2xl'
  | 'shadow-3xl'
  | 'shadow-4xl'
  | 'shadow-5xl';

export type MotionToken =
  | 'motion-none'
  | 'motion-sm'
  | 'motion-base'
  | 'motion-lg'
  | 'motion-xl'
  | 'motion-2xl'
  | 'motion-3xl'
  | 'motion-4xl'
  | 'motion-5xl';

// Function to retrieve token value by token type and key
function getTokenValue<T extends ColorToken | TypographyToken | SpacingToken | RadiusToken | ShadowToken | MotionToken>(
  token: T,
  tokenType: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow' | 'motion',
  key: string
): string {
  switch (tokenType) {
    case 'color':
      return color[token][key];
    case 'typography':
      return typography[token][key];
    case 'spacing':
      return spacing[token] as string;
    case 'radius':
      return radius[token] as string;
    case 'shadow':
      return shadow[token] as string;
    case 'motion':
      return motion[token] as string;
    default:
      throw new Error(`Unsupported token type: ${tokenType}`);
  }
}

export { getTokenValue };