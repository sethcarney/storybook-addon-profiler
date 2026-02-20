import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      preview: 'src/preview.ts',
    },
    format: ['esm'],
    dts: true,
    external: ['storybook'],
    outDir: 'dist',
    clean: true,
  },
  {
    entry: {
      manager: 'src/manager.tsx',
    },
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom', 'storybook', '@storybook/react', '@storybook/icons'],
    outDir: 'dist',
    clean: false,
  },
  {
    entry: {
      preset: 'src/preset.ts',
    },
    format: ['esm'],
    dts: true,
    platform: 'node',
    outDir: 'dist',
    clean: false,
  },
])
