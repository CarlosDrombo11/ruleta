// vite.config.ts

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-mask.svg'],
      manifest: {
        name: 'Ruleta de Premios',
        short_name: 'Ruleta Premios',
        description: 'Aplicación web interactiva para realizar sorteos y rifas con ruleta animada',
        theme_color: '#3498DB',
        background_color: '#ECF0F1',
        display: 'standalone',
        orientation: 'landscape-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['games', 'entertainment', 'productivity'],
        lang: 'es',
        dir: 'ltr'
      }
    })
  ],
  
  // Build configuration
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV !== 'production',
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'popmotion': ['popmotion'],
          'xlsx': ['xlsx']
        }
      }
    },
    
    // Performance optimizations
    chunkSizeWarningLimit: 1000,
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    // Minification
    minify: 'esbuild',
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    
    // Proxy configuration for development (if needed)
    // proxy: {
    //   '/api': 'http://localhost:8080'
    // }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true,
    cors: true
  },
  
  // Asset handling
  assetsInclude: ['**/*.xlsx', '**/*.xls'],
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "/src/styles/variables.scss";`
      }
    }
  },
  
  // Optimization configuration
  optimizeDeps: {
    include: [
      'xlsx',
      'popmotion'
    ],
    exclude: [
      // Exclude any problematic dependencies
    ]
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Public directory
  publicDir: 'public',
  
  // Base path (useful for deployment to subdirectories)
  base: '/',
  
  // Worker configuration
  worker: {
    format: 'es'
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@core': '/src/core',
      '@utils': '/src/utils',
      '@animations': '/src/animations',
      '@styles': '/src/styles',
      '@types': '/src/types'
    }
  },
  
  // JSON configuration
  json: {
    namedExports: true,
    stringify: false
  },
  
  // ESBuild configuration
  esbuild: {
    target: 'es2020',
    charset: 'utf8',
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : []
  },

  // Test configuration (if using Vitest)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  }
});