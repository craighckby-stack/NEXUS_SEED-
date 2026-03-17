// postcss.config.mjs
import tailwindPostcss from '@tailwindcss/postcss7-compat';

/**
 * PostCSS configuration.
 *
 * @type {import('postcss').PostCssConfig}
 */
const config = {
  plugins: [tailwindPostcss],
};

export default config;