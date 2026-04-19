#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BUILD_DIR="$SCRIPT_DIR/worang-client-companion"
ZIP_PATH="$SCRIPT_DIR/worang-client-companion.zip"

rm -rf "$BUILD_DIR" "$ZIP_PATH"
mkdir -p "$BUILD_DIR"
cp "$SCRIPT_DIR/worang-client-companion.php" "$BUILD_DIR/"
cp "$SCRIPT_DIR/readme.txt" "$BUILD_DIR/"

(
  cd "$SCRIPT_DIR"
  zip -rq "$ZIP_PATH" "worang-client-companion"
)

rm -rf "$BUILD_DIR"
printf 'Created %s\n' "$ZIP_PATH"
