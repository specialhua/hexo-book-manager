import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron'
  
  return {
    base: isElectron ? './' : '/',
    plugins: [
      vue(),
      ...(isElectron ? [
        electron([
          {
            entry: 'electron/main.ts',
            onstart(options) {
              options.startup()
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                minify: false,
                lib: {
                  entry: 'electron/main.ts',
                  formats: ['cjs'],
                  fileName: () => 'main.cjs'
                },
                rollupOptions: {
                  external: ['electron', 'picgo', 'fs', 'path', 'crypto', 'https', 'http', 'url'],
                  output: {
                    format: 'cjs',
                    exports: 'auto',
                    entryFileNames: 'main.cjs'
                  }
                }
              }
            }
          },
          {
            entry: 'electron/preload.ts',
            onstart(options) {
              options.reload()
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                minify: false,
                lib: {
                  entry: 'electron/preload.ts',
                  formats: ['cjs'],
                  fileName: () => 'preload.cjs'
                },
                rollupOptions: {
                  external: ['electron'],
                  output: {
                    format: 'cjs',
                    exports: 'auto',
                    entryFileNames: 'preload.cjs'
                  }
                }
              }
            }
          }
        ]),
        renderer({
          nodeIntegration: false
        })
      ] : [])
    ],
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      watch: {
        ignored: ["**/src-tauri/**", "**/electron/**", "**/dist-electron/**"],
      },
    },
    build: {
      target: isElectron ? 'esnext' : (process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13"),
      minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
      sourcemap: !!process.env.TAURI_DEBUG,
      rollupOptions: isElectron ? {
        external: ['electron', 'picgo']
      } : {}
    },
    define: {
      __IS_ELECTRON__: isElectron
    }
  }
})