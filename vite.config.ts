import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library'

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isLibrary ? [dts({
        insertTypesEntry: true,
        tsconfigPath: './tsconfig.app.json',
        rollupTypes: true,
        outDir: 'dist',
        entryRoot: 'src',
        copyDtsFiles: false,
        staticImport: true
      })] : [])
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(isLibrary ? {
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'FlyCutCaption',
          formats: ['es'],
          fileName: () => `index.js`
        },
        rollupOptions: {
          external: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-i18next',
            'i18next',
            'i18next-browser-languagedetector',
            'zustand',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'lucide-react',
            '@huggingface/transformers',
            '@webav/av-cliper',
            '@webav/av-recorder',
            'hotkeys-js',
            'ahooks',
            'next-themes',
            'sonner'
          ],
          output: {
            globals: {
              'react': 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'React.jsxRuntime',
              'react-i18next': 'ReactI18next',
              'i18next': 'i18next',
              'zustand': 'zustand',
              'lucide-react': 'LucideReact'
            }
          }
        },
        cssCodeSplit: false,
        sourcemap: true,
        emptyOutDir: true
      }
    } : {})
  }
})
