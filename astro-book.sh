#!/usr/bin/env bash
# ============================================================
#  █████╗ ███████╗████████╗██████╗  ██████╗
# ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗
# ███████║███████╗   ██║   ██████╔╝██║   ██║
# ██╔══██║╚════██║   ██║   ██╔══██╗██║   ██║
# ██║  ██║███████║   ██║   ██║  ██║╚██████╔╝
# ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
#  ██████╗  ██████╗  ██████╗ ██╗  ██╗
# ██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝
# ██████╔╝██║   ██║██║   ██║█████╔╝
# ██╔══██╗██║   ██║██║   ██║██╔═██╗
# ██████╔╝╚██████╔╝╚██████╔╝██║  ██╗
# ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
# ============================================================
# Script  : astro-book.sh
# Purpose : Bundle an Astro project into a single LLM-friendly
#           Markdown file (astro-sourcebook.md), skipping
#           node_modules, public/, and large/binary files.
#           Also writes node_module_list.md.
# Usage   : ./astro-book.sh [/path/to/astro-project]
# Output  : astro-sourcebook.md   — full source bundle
#           node_module_list.md   — node_modules listing
# Version : 1.0.2
# ============================================================

set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_info()  { echo -e "${CYAN}[astro-book]${RESET} $*"; }
log_ok()    { echo -e "${GREEN}[astro-book]${RESET} $*"; }
log_warn()  { echo -e "${YELLOW}[astro-book]${RESET} $*"; }

# ── Max file size to include (bytes) — default 100 KB ──────
MAX_BYTES="${ASTRO_BOOK_MAX_BYTES:-102400}"

# ── Resolve project root ────────────────────────────────────
PROJECT_DIR="${1:-$PWD}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

if [[ ! -f "$PROJECT_DIR/astro.config.ts" && \
      ! -f "$PROJECT_DIR/astro.config.mjs" && \
      ! -f "$PROJECT_DIR/astro.config.js" ]]; then
  log_warn "No astro.config.* found in $PROJECT_DIR — proceeding anyway."
fi

SOURCEBOOK="$PROJECT_DIR/astro-sourcebook.md"
NODELIST="$PROJECT_DIR/node_module_list.md"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

SKIPPED_COUNT=0
INCLUDED_COUNT=0

# ── Fence language from extension ──────────────────────────
fence_lang() {
  case "${1##*.}" in
    ts|tsx)         echo "typescript" ;;
    js|jsx|mjs|cjs) echo "javascript" ;;
    astro)          echo "astro" ;;
    md|mdx)         echo "markdown" ;;
    html|htm)       echo "html" ;;
    json)           echo "json" ;;
    css)            echo "css" ;;
    scss)           echo "scss" ;;
    sass)           echo "sass" ;;
    less)           echo "less" ;;
    yaml|yml)       echo "yaml" ;;
    toml)           echo "toml" ;;
    sh)             echo "bash" ;;
    svg)            echo "xml" ;;
    *)              echo "" ;;
  esac
}

# ── Collect source files (no public/, no node_modules, etc.) 
collect_files() {
  find "$PROJECT_DIR" \
    -path "$PROJECT_DIR/node_modules"    -prune -o \
    -path "$PROJECT_DIR/public"          -prune -o \
    -path "$PROJECT_DIR/dist"            -prune -o \
    -path "$PROJECT_DIR/.git"            -prune -o \
    -path "$PROJECT_DIR/.astro"          -prune -o \
    -path "$PROJECT_DIR/.cache"          -prune -o \
    -path "$PROJECT_DIR/.turbo"          -prune -o \
    -path "$PROJECT_DIR/.vercel"         -prune -o \
    -path "$PROJECT_DIR/.netlify"        -prune -o \
    -path "$PROJECT_DIR/.output"         -prune -o \
    -path "$PROJECT_DIR/coverage"        -prune -o \
    -path "$PROJECT_DIR/astro-sourcebook.md" -prune -o \
    -path "$PROJECT_DIR/node_module_list.md" -prune -o \
    -type f \( \
      -name "*.ts"    -o -name "*.tsx"  \
      -o -name "*.js"   -o -name "*.jsx" \
      -o -name "*.mjs"  -o -name "*.cjs" \
      -o -name "*.astro" \
      -o -name "*.md"   -o -name "*.mdx" \
      -o -name "*.html" -o -name "*.htm" \
      -o -name "*.json" \
      -o -name "*.css"  -o -name "*.scss" \
      -o -name "*.sass" -o -name "*.less" \
      -o -name "*.yaml" -o -name "*.yml" \
      -o -name "*.toml" \
      -o -name "*.sh" \
      -o -name ".env" \
      -o -name ".env.example" \
      -o -name ".env.local" \
    \) -print | sort
}

# ── File size in bytes (macOS + Linux) ─────────────────────
file_bytes() {
  # macOS: stat -f%z   Linux: stat -c%s
  stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0
}

# ============================================================
# PHASE 1 — astro-sourcebook.md
# ============================================================
write_sourcebook() {
  log_info "Writing sourcebook → $(basename "$SOURCEBOOK")"
  log_info "Skipping: node_modules/, public/, dist/, .git/ and files > $(( MAX_BYTES / 1024 ))KB"

  {
    echo "---"
    echo "title: \"Astro Sourcebook: ${PROJECT_NAME}\""
    echo "generated: \"${TIMESTAMP}\""
    echo "project_dir: \"${PROJECT_DIR}\""
    echo "description: \"Full source bundle for LLM consumption. node_modules and public/ excluded.\""
    echo "---"
    echo ""
    echo "# Astro Sourcebook: \`${PROJECT_NAME}\`"
    echo ""
    echo "> Generated: ${TIMESTAMP}  "
    echo "> Project: \`${PROJECT_DIR}\`"
    echo ""
    echo "---"
    echo ""
    echo "## Project Root"
    echo ""
    echo "\`\`\`"
    ls -1 "$PROJECT_DIR"
    echo "\`\`\`"
    echo ""
    echo "---"
    echo ""
    echo "## Source Files"
    echo ""

    while IFS= read -r filepath; do
      local relpath="${filepath#$PROJECT_DIR/}"
      local bytes
      bytes="$(file_bytes "$filepath")"

      if (( bytes > MAX_BYTES )); then
        SKIPPED_COUNT=$(( SKIPPED_COUNT + 1 ))
        echo ""
        echo "### \`${relpath}\`"
        echo ""
        echo "> ⚠️ Skipped — file too large ($(( bytes / 1024 ))KB > $(( MAX_BYTES / 1024 ))KB limit)"
        echo ""
        continue
      fi

      INCLUDED_COUNT=$(( INCLUDED_COUNT + 1 ))
      local lang
      lang="$(fence_lang "$filepath")"

      echo ""
      echo "### \`${relpath}\`"
      echo ""
      echo "\`\`\`${lang}"
      cat "$filepath"
      printf '\n'
      echo "\`\`\`"
      echo ""
    done < <(collect_files)

  } > "$SOURCEBOOK"

  local lc
  lc="$(wc -l < "$SOURCEBOOK" | tr -d ' ')"
  log_ok "Sourcebook: $(basename "$SOURCEBOOK") — ${INCLUDED_COUNT} files included, ${SKIPPED_COUNT} skipped (${lc} lines)"
}

# ============================================================
# PHASE 2 — node_module_list.md
# ============================================================
pkg_field() {
  python3 -c "
import json
try:
    d = json.load(open('$1'))
    print(str(d.get('$2', ''))[:${3:-80}])
except:
    print('')
" 2>/dev/null || true
}

write_nodelist() {
  local nm_dir="$PROJECT_DIR/node_modules"
  if [[ ! -d "$nm_dir" ]]; then
    log_warn "node_modules not found — skipping node_module_list.md"
    return 0
  fi

  log_info "Writing module list → $(basename "$NODELIST")"

  {
    echo "---"
    echo "title: \"node_modules Directory: ${PROJECT_NAME}\""
    echo "generated: \"${TIMESTAMP}\""
    echo "description: \"Top-level package listing from node_modules.\""
    echo "---"
    echo ""
    echo "# node_modules: \`${PROJECT_NAME}\`"
    echo ""
    echo "> Generated: ${TIMESTAMP}"
    echo ""
    echo "---"
    echo ""

    local total scoped flat
    total="$(find "$nm_dir" -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
    scoped="$(find "$nm_dir" -maxdepth 1 -mindepth 1 -type d -name '@*' | wc -l | tr -d ' ')"
    flat=$(( total - scoped ))

    echo "## Summary"
    echo ""
    echo "| Stat | Count |"
    echo "|---|---|"
    echo "| Total top-level entries | ${total} |"
    echo "| Flat packages | ${flat} |"
    echo "| Scoped namespaces | ${scoped} |"
    echo ""
    echo "---"
    echo ""
    echo "## Flat Packages"
    echo ""

    while IFS= read -r pkg_dir; do
      local name version desc
      name="$(basename "$pkg_dir")"
      version=""; desc=""
      if [[ -f "$pkg_dir/package.json" ]]; then
        version="$(pkg_field "$pkg_dir/package.json" version)"
        desc="$(pkg_field "$pkg_dir/package.json" description)"
      fi
      echo "- **\`${name}\`**${version:+ \`${version}\`} — ${desc:-*(no description)*}"
    done < <(find "$nm_dir" -maxdepth 1 -mindepth 1 -type d ! -name '@*' | sort)
    echo ""

    if (( scoped > 0 )); then
      echo "---"
      echo ""
      echo "## Scoped Packages"
      echo ""
      while IFS= read -r scope_dir; do
        local scope_name
        scope_name="$(basename "$scope_dir")"
        echo "### \`${scope_name}\`"
        echo ""
        while IFS= read -r pkg_dir; do
          local name version desc
          name="${scope_name}/$(basename "$pkg_dir")"
          version=""; desc=""
          if [[ -f "$pkg_dir/package.json" ]]; then
            version="$(pkg_field "$pkg_dir/package.json" version)"
            desc="$(pkg_field "$pkg_dir/package.json" description)"
          fi
          echo "- **\`${name}\`**${version:+ \`${version}\`} — ${desc:-*(no description)*}"
        done < <(find "$scope_dir" -maxdepth 1 -mindepth 1 -type d | sort)
        echo ""
      done < <(find "$nm_dir" -maxdepth 1 -mindepth 1 -type d -name '@*' | sort)
    fi

  } > "$NODELIST"

  local lc
  lc="$(wc -l < "$NODELIST" | tr -d ' ')"
  log_ok "Module list written: $(basename "$NODELIST") (${lc} lines)"
}

# ============================================================
# MAIN
# ============================================================
main() {
  echo ""
  echo -e "${BOLD}astro-book.sh — Astro Project Bundler${RESET}"
  echo -e "Project : ${CYAN}${PROJECT_DIR}${RESET}"
  echo -e "Max file: ${CYAN}$(( MAX_BYTES / 1024 ))KB${RESET} (override with ASTRO_BOOK_MAX_BYTES=)"
  echo ""

  write_sourcebook
  write_nodelist

  echo ""
  log_ok "Done."
  echo ""
  echo -e "  ${GREEN}✓${RESET} astro-sourcebook.md"
  echo -e "  ${GREEN}✓${RESET} node_module_list.md"
  echo ""
}

main "$@"
