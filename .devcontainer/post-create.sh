#!/usr/bin/env bash
# Provision the dev container: install dependencies and build the addon so the
# per-framework test Storybooks can resolve ../../../dist/preset.js.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> bun $(bun --version) / node $(node --version)"

echo "==> Installing dependencies"
bun install --frozen-lockfile

# tests/angular keeps its own dependency tree: the Angular compiler requires
# TypeScript 6.x, while the addon itself builds on TypeScript 7.
echo "==> Installing Angular test Storybook dependencies"
bun install --frozen-lockfile --cwd tests/angular

echo "==> Building addon"
bun run build

cat <<'EOF'

Dev container ready. Test Storybooks:

  bun run storybook:react      # http://localhost:6006
  bun run storybook:vue        # http://localhost:6007
  bun run storybook:angular    # http://localhost:6008 (first start takes ~30s)

Rebuild the addon after editing src/ (or run `bun run build:watch` alongside).
EOF
