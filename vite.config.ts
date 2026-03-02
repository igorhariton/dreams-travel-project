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

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    autoContentI18nPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
