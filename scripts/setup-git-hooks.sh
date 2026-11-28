#!/bin/sh
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SOURCE_HOOK="$REPO_ROOT/scripts/pre-push"
TARGET_HOOK="$HOOKS_DIR/pre-push"

mkdir -p "$HOOKS_DIR"
cp "$SOURCE_HOOK" "$TARGET_HOOK"
chmod +x "$TARGET_HOOK"

echo "[SUCCESS] Pre-push branch protection hook installed into: $TARGET_HOOK"
echo "Direct pushes to 'main' or 'master' will now be blocked locally."
