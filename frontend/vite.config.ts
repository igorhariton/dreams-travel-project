import { defineConfig } from 'vite'
import path from 'path'
import { spawn } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function autoContentI18nPlugin() {
  let isRunning = false
  let shouldRunAgain = false

  const runSync = () => {
    if (isRunning) {
      shouldRunAgain = true
      return
    }

    isRunning = true
    const scriptPath = path.resolve(__dirname, 'scripts', 'sync-content-i18n.mjs')
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
    })

    child.on('close', () => {
      isRunning = false
      if (shouldRunAgain) {
        shouldRunAgain = false
        runSync()
      }
    })
  }

  return {
    name: 'auto-content-i18n-sync',
    configureServer() {
      runSync()
    },
    handleHotUpdate(ctx: { file: string }) {
      const normalizedFile = ctx.file.replace(/\\/g, '/')
      if (normalizedFile.endsWith('/src/app/data/travelData.ts')) {
        runSync()
      }
    },
  }
}

function leafletMarkerAssetFixPlugin() {
  return {
    name: 'leaflet-marker-asset-fix',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const normalizedId = id.replace(/\\/g, '/')
      if (normalizedId.endsWith('/leaflet/dist/leaflet-src.esm.js')) {
        return {
          code: code
            .replace('./assets/marker-icon-2x.png', './images/marker-icon-2x.png')
            .replace('./assets/marker-icon.png', './images/marker-icon.png')
            .replace('./assets/marker-shadow.png', './images/marker-shadow.png'),
          map: null,
        }
      }

      if (normalizedId.endsWith('/react-leaflet-cluster/dist/index.js')) {
        return {
          code: code
            .replace('./assets/marker-icon-2x.png', '../../leaflet/dist/images/marker-icon-2x.png')
            .replace('./assets/marker-icon.png', '../../leaflet/dist/images/marker-icon.png')
            .replace('./assets/marker-shadow.png', '../../leaflet/dist/images/marker-shadow.png'),
          map: null,
        }
      }

      return null
    },
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    autoContentI18nPlugin(),
    leafletMarkerAssetFixPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5134',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-map'
          if (id.includes('framer-motion') || id.includes('/motion/')) return 'vendor-motion'
          if (id.includes('react-router-dom')) return 'vendor-router'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          return undefined
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
