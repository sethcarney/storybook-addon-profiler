import { defineConfig } from "tsup"

// Declaration files are emitted separately via `tsc -p tsconfig.build.json`
// (see the "build" script). TypeScript 7's native compiler no longer exposes
// the JS compiler API that tsup's built-in dts generation (rollup-plugin-dts)
// depends on, so JS bundling is done here with esbuild and .d.ts emit is
// delegated to tsc.
export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      preview: "src/preview.ts"
    },
    format: ["esm"],
    dts: false,
    external: [/^storybook/],
    outDir: "dist",
    clean: true
  },
  {
    entry: {
      manager: "src/manager.tsx"
    },
    format: ["esm"],
    dts: false,
    external: [/^react/, /^storybook/, /^@storybook/],
    outDir: "dist",
    clean: false
  },
  {
    entry: {
      preset: "src/preset.ts"
    },
    format: ["esm"],
    dts: false,
    platform: "node",
    outDir: "dist",
    clean: false
  }
])
