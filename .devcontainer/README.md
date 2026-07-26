# Dev container

Reproducible environment for developing the addon and running the per-framework test Storybooks.

| Piece            | Choice                                                      |
| ---------------- | ----------------------------------------------------------- |
| Base image       | `mcr.microsoft.com/devcontainers/typescript-node:24-bookworm` (Node 24 LTS) |
| Package manager  | Bun, via the `ghcr.io/devcontainers-extra/features/bun` feature — matches `bun.lock` and CI |
| Forwarded ports  | 6006 (React), 6007 (Vue 3), 6008 (Angular)                  |
| postCreate       | `.devcontainer/post-create.sh` → install root deps, install `tests/angular` deps, `bun run build` |

The build step is part of provisioning because each test Storybook loads the addon through
`../../../dist/preset.js`, which does not exist until `bun run build` has run at least once.

Node 24 is not just a "recent LTS" pick: `@angular/cli` refuses to run on anything below
Node 24.15 (or 22.22.3), so the Angular target needs it.

## Usage

```bash
bun run storybook:react      # http://localhost:6006
bun run storybook:vue        # http://localhost:6007
bun run storybook:angular    # http://localhost:6008
```

Re-run `bun run build` (or keep `bun run build:watch` running) after editing `src/`.

## Why tests/angular has its own dependency tree

`tests/angular` is a separate install (its own `package.json`, `bun.lock`, and `node_modules`)
rather than part of the root one. Angular's compiler cannot run on the TypeScript version this
repo uses:

- `@angular/compiler-cli` calls the classic TypeScript compiler API, and `typescript@7` no longer
  exports it (`ts.DiagnosticCategory` is `undefined`). No Angular release supports TypeScript 7
  yet — `@angular/compiler-cli@22` peer-requires `typescript >=6.0 <6.1`, and so does 22.1's RC.
- Nesting the install lets Node resolution give the Angular toolchain its own `typescript@6.0.x`
  while the addon keeps building on `typescript@7`.

A side effect worth knowing: the root install no longer carries `@angular/*`, `@storybook/angular`,
`ag-grid-angular`, or `zone.js`, so it is smaller for anyone not touching the Angular target.

Two details of `tests/angular/angular.json` that look odd but are load-bearing:

- **The `build` target is never executed.** `@storybook/angular` refuses to start unless
  `browserTarget` resolves to a real target (otherwise it throws `AngularLegacyBuildOptionsError`),
  but it only reads that target's options — hence the placeholder `index`/`main` paths.
- **`tsconfig.json` lists `.storybook/**/*` explicitly.** TypeScript's `include` globs skip
  dot-directories, so `.storybook/preview.ts` would otherwise be missing from the compilation.

## Updating Angular dependencies

Dependabot and manual bumps need to run in both places:

```bash
bun update                          # root
bun update --cwd tests/angular      # Angular test Storybook
```
