#!/usr/bin/env bash
set -euo pipefail

missing=0

check_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing: $path"
    missing=1
  fi
}

# Base UI/runtime files
for f in \
  index.html levels.html style.css level-cards.css hero-loader.js \
  app-config.js script-loader.js app-boot.js; do
  check_file "$f"
done

# Validate active launchers from app-config.js
mapfile -t launchers < <(rg -o "'[^']+\\.js'" app-config.js | tr -d "'" | sort -u)
for f in "${launchers[@]}"; do
  check_file "$f"
done

# Validate chained scripts referenced by active launchers
for launcher in "${launchers[@]}"; do
  mapfile -t deps < <(rg -o "'[^']+\\.js(\\?v=[0-9]+)?'" "$launcher" | tr -d "'" | sed 's/?v=.*$//' | sort -u)
  for dep in "${deps[@]}"; do
    check_file "$dep"
  done
done

if [[ "$missing" -ne 0 ]]; then
  echo "Smoke check failed"
  exit 1
fi

echo "Smoke check passed"
