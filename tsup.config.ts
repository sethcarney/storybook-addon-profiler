import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      preview: 'src/preview.ts',
    },
    format: ['esm'],
    dts: true,
    external: [/^storybook/],
    outDir: 'dist',
    clean: true,
  },
  {
    entry: {
      manager: 'src/manager.tsx',
    },
    format: ['esm'],
    dts: true,
    // Use regex to externalize all sub-paths (e.g. react/jsx-runtime, storybook/manager-api)
    // so the manager bundle never bundles its own React copy alongside Storybook's React.
    external: [/^react/, /^storybook/, /^@storybook/],
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
