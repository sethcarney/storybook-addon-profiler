# Dev container

Reproducible environment for developing the addon and running the per-framework test Storybooks.

| Piece            | Choice                                                      |
| ---------------- | ----------------------------------------------------------- |
| Base image       | `mcr.microsoft.com/devcontainers/typescript-node:24-bookworm` (Node 24 LTS) |
| Package manager  | Bun, via the `ghcr.io/devcontainers-extra/features/bun` feature — matches `bun.lock` and CI |
| Forwarded ports  | 6006 (React), 6007 (Vue 3), 6008 (Angular)                  |
| postCreate       | `.devcontainer/post-create.sh` → `bun install --frozen-lockfile` then `bun run build` |

The build step is part of provisioning because each test Storybook loads the addon through
`../../../dist/preset.js`, which does not exist until `bun run build` has run at least once.

## Usage

```bash
bun run storybook:react      # http://localhost:6006
bun run storybook:vue        # http://localhost:6007
```

Re-run `bun run build` (or keep `bun run build:watch` running) after editing `src/`.

## Angular

`bun run storybook:angular` does not start, in the container or outside it. It is a pre-existing
dependency conflict rather than an environment problem:

1. `@storybook/angular` 10.x refuses to run through the plain `storybook dev` CLI
   (`AngularLegacyBuildOptionsError`); it must be invoked through the Angular builder
   (`ng run <project>:storybook`), which needs an `angular.json` and `@angular/cli`.
2. Wiring that up moves the failure to the compiler: `@angular/compiler-cli` needs the classic
   TypeScript compiler API, and this repo is on `typescript@7`, whose package no longer exports it
   (`ts.DiagnosticCategory` is `undefined`). `@angular/compiler-cli@22` peer-requires
   `typescript >=6.0 <6.1`.

Fixing it means either pinning the Angular test harness to its own TypeScript 6.x (for example by
splitting `tests/angular` into its own workspace package) or moving the whole repo off TypeScript 7
— a dependency decision, not a container one.
