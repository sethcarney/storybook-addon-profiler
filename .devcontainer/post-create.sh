#!/usr/bin/env bash
# Provision the dev container: install dependencies and build the addon so the
# per-framework test Storybooks can resolve ../../../dist/preset.js.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> bun $(bun --version) / node $(node --version)"

echo "==> Installing dependencies"
bun install --frozen-lockfile

echo "==> Building addon"
bun run build

cat <<'EOF'

Dev container ready. Test Storybooks:

  bun run storybook:react      # http://localhost:6006
  bun run storybook:vue        # http://localhost:6007
  bun run storybook:angular    # http://localhost:6008

Rebuild the addon after editing src/ (or run `bun run build:watch` alongside).
EOF
