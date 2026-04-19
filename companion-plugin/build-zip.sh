#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BUILD_DIR="$SCRIPT_DIR/worang-client-companion"
ZIP_PATH="$SCRIPT_DIR/worang-client-companion.zip"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to build the plugin zip" >&2
  exit 1
fi

rm -rf "$BUILD_DIR" "$ZIP_PATH"
mkdir -p "$BUILD_DIR"
cp "$SCRIPT_DIR/worang-client-companion.php" "$BUILD_DIR/"
cp "$SCRIPT_DIR/readme.txt" "$BUILD_DIR/"

python3 - "$BUILD_DIR" "$ZIP_PATH" <<'PY'
import pathlib
import sys
import zipfile

build_dir = pathlib.Path(sys.argv[1])
zip_path = pathlib.Path(sys.argv[2])

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for file_path in build_dir.rglob('*'):
        if file_path.is_file():
            archive.write(file_path, file_path.relative_to(build_dir.parent))
PY

rm -rf "$BUILD_DIR"
printf 'Created %s\n' "$ZIP_PATH"
