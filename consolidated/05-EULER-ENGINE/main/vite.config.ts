import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const DNA_SIGNATURE = '0xAbE114n_H0dg3_C0nj3ctur3';
const ENGINE_VERSION = '3.1.0-final';
const RESOLUTION_STAGE = 'STABLE_RESOLUTION';

export default defineConfig(({ mode }): UserConfig => {
  const isProd = mode === 'production';
  const root = process.cwd();

  return {
    root,
    base: './',
    publicDir: 'public',
    clearScreen: false,
    
    plugins: [
      react({
        babel: {
          plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
          compact: isProd
        }
      }),
      tailwindcss()
    ],

    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        '@core': resolve(root, 'src/core'),
        '@components': resolve(root, 'src/components'),
        '@hooks': resolve(root, 'src/hooks'),
        '@assets': resolve(root, 'src/assets'),
        '@logic': resolve(root, 'src/logic')
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
    },

    define: {
      __SIPHON_DNA__: JSON.stringify(DNA_SIGNATURE),
      __ENGINE_VERSION__: JSON.stringify(ENGINE_VERSION),
      __RESOLUTION_STAGE__: JSON.stringify(RESOLUTION_STAGE),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: { chrome: 110, edge: 110, firefox: 110, safari: 16 },
        drafts: { customMedia: true, nesting: true }
      },
      devSourcemap: true
    },

    server: {
      port: 3000,
      host: true,
      strictPort: true,
      cors: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'X-Siphon-Engine-DNA': DNA_SIGNATURE
      },
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/App.tsx',
          './src/index.css'
        ]
      },
      hmr: {
        overlay: true
      }
    },

    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'esbuild',
      cssMinify: 'lightningcss',
      sourcemap: !isProd,
      emptyOutDir: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 800,
      modulePreload: {
        polyfill: true
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler') || id.includes('react-dom')) {
                return 'vendor-framework';
              }
              return 'vendor-stable';
            }
            if (id.includes('/src/core/')) return 'engine-vortex';
            if (id.includes('/src/components/')) return 'morphism-ui';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split('.').pop() ?? 'bin';
            if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
              return `assets/img/[name]-[hash].[ext]`;
            }
            if (ext === 'css') return `assets/css/[name]-[hash].[ext]`;
            return `assets/misc/[name]-[hash].[ext]`;
          }
        }
      }
    },

    worker: {
      format: 'es',
      plugins: () => [tailwindcss()]
    },

    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@tailwindcss/vite'],
      esbuildOptions: {
        target: 'esnext',
        supported: { 'top-level-await': true },
        treeShaking: true
      }
    },

    esbuild: {
      drop: isProd ? ['debugger'] : [],
      pure: isProd ? ['console.log', 'console.debug'] : [],
      legalComments: 'none',
      treeShaking: true,
      jsxSideEffects: false,
      banner: `/*! SIPHON_ENGINE_${ENGINE_VERSION} | DNA_${DNA_SIGNATURE} */`
    },

    preview: {
      port: 8080,
      strictPort: true,
      host: true
    },

    cacheDir: 'node_modules/.vite'
  };
});