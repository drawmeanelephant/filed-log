---
title: "Astro Sourcebook: filed-log"
generated: "2026-04-17T19:19:38Z"
project_dir: "/Users/tbuddy/Documents/GitHub/filed-log"
description: "Full source bundle for LLM consumption. node_modules and public/ excluded."
---

# Astro Sourcebook: `filed-log`

> Generated: 2026-04-17T19:19:38Z  
> Project: `/Users/tbuddy/Documents/GitHub/filed-log`

---

## Project Root

```
astro-book.sh
astro-sourcebook.md
astro.config.mjs
node_modules
package-lock.json
package.json
public
README.md
src
tsconfig.json
```

---

## Source Files


### `astro-book.sh`

```bash
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

```


### `astro.config.mjs`

```javascript
// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import alpinejs from '@astrojs/alpinejs';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [alpinejs({ entrypoint: '/src/entrypoint' })],
});
```


### `package-lock.json`

> ⚠️ Skipped — file too large (201KB > 100KB limit)


### `package.json`

```json
{
  "name": "filed-log",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@alpinejs/focus": "^3.15.11",
    "@astrojs/alpinejs": "^0.5.0",
    "@tailwindcss/vite": "^4.2.2",
    "@types/alpinejs": "^3.13.11",
    "alpinejs": "^3.15.11",
    "astro": "^6.1.7",
    "sass": "^1.97.3",
    "sharp": "^0.34.3",
    "tailwindcss": "^4.2.2"
  },
  "engines": {
    "node": ">=22.12.0"
  }
}

```


### `README.md`

```markdown
# Starlog

## Release notes theme for Astro

![starlog-gh](https://github.com/doodlemarks/starlog/assets/2244813/9c5c2e46-665a-437e-a971-053db4dbff63)

Built with Astro and Sass. Supports both dark and light modes.

```


### `src/components/BaseHead.astro`

```astro
---
import { ClientRouter } from 'astro:transitions';
import { SiteDescription, SiteTitle } from '../consts';
import SEO, { type Props as SEOProps } from './SEO.astro';
import '../styles/global.css';

export type Props = Partial<SEOProps>;
const { title = SiteTitle, name = SiteTitle, description = SiteDescription, ...seo } = Astro.props;
---

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<SEO {title} {description} {name} {...seo} />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
	href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Source+Code+Pro&display=swap"
	rel="stylesheet"
/>

<ClientRouter />

```


### `src/components/Footer.astro`

```astro
---
import '../styles/global.scss';
---

<footer>
	<p>© 2023</p>
	<div class="footer_links">
		<a href="#">Discord</a>
		<a href="#">X</a>
		<a href="#">GitHub</a>
	</div>
</footer>

```


### `src/components/FormattedDate.astro`

```astro
---
import type { HTMLAttributes } from 'astro/types';

type Props = HTMLAttributes<'time'> & {
	date: Date;
};

const { date, ...attrs } = Astro.props;
---

<time datetime={date.toISOString()} {...attrs}>
	{
		date.toLocaleDateString('en-us', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}
</time>

<style>
	time {
		display: block;
	}
</style>

```


### `src/components/Header.astro`

```astro
---
import '../styles/global.scss';
import { SiteTitle } from '../consts';
---

<header>
	<nav>
		<h2 id="site_title">
			<a href="/">
				<svg
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					><path
						fill="url(#a)"
						fill-rule="evenodd"
						d="M.654 3.276C0 4.56 0 6.24 0 9.6v4.8c0 3.36 0 5.04.654 6.324a6 6 0 0 0 2.622 2.622C4.56 24 6.24 24 9.6 24h4.8c3.36 0 5.04 0 6.324-.654a6 6 0 0 0 2.622-2.622C24 19.44 24 17.76 24 14.4V9.6c0-3.36 0-5.04-.654-6.324A6 6 0 0 0 20.724.654C19.44 0 17.76 0 14.4 0H9.6C6.24 0 4.56 0 3.276.654A6 6 0 0 0 .654 3.276Zm10.875 16.41a.5.5 0 0 0 .942 0l.628-1.754a8 8 0 0 1 4.833-4.833l1.754-.628a.5.5 0 0 0 0-.942l-1.754-.628A8 8 0 0 1 13.1 6.068l-.628-1.754a.5.5 0 0 0-.942 0l-.628 1.754A8 8 0 0 1 6.068 10.9l-1.754.628a.5.5 0 0 0 0 .942l1.754.628a8 8 0 0 1 4.833 4.833l.628 1.754Z"
						clip-rule="evenodd"></path><path
						stroke="url(#b)"
						stroke-opacity=".5"
						stroke-width=".5"
						d="M.25 9.6c0-1.684 0-2.932.08-3.92.081-.985.24-1.69.547-2.29A5.75 5.75 0 0 1 3.39.877C3.99.57 4.695.41 5.68.33 6.668.25 7.916.25 9.6.25h4.8c1.684 0 2.932 0 3.92.08.985.081 1.69.24 2.29.547a5.75 5.75 0 0 1 2.513 2.513c.306.6.466 1.305.546 2.29.08.988.081 2.236.081 3.92v4.8c0 1.684 0 2.932-.08 3.92-.081.985-.24 1.69-.547 2.29a5.75 5.75 0 0 1-2.513 2.513c-.6.306-1.305.466-2.29.546-.988.08-2.236.081-3.92.081H9.6c-1.684 0-2.932 0-3.92-.08-.985-.081-1.69-.24-2.29-.547A5.75 5.75 0 0 1 .877 20.61C.57 20.01.41 19.305.33 18.32.25 17.332.25 16.084.25 14.4V9.6Zm11.044 10.17c.237.663 1.175.663 1.412 0l.628-1.753a7.75 7.75 0 0 1 4.683-4.683l1.753-.628c.663-.237.663-1.175 0-1.412l-1.753-.628a7.75 7.75 0 0 1-4.683-4.683l-.628-1.753c-.237-.663-1.175-.663-1.412 0l-.628 1.753a7.75 7.75 0 0 1-4.683 4.683l-1.753.628c-.663.237-.663 1.175 0 1.412l1.753.628a7.75 7.75 0 0 1 4.683 4.683l.628 1.753Z"
					></path><defs
						><radialGradient
							id="a"
							cx="0"
							cy="0"
							r="1"
							gradientTransform="rotate(-40.136 32.164 11.75) scale(33.3542)"
							gradientUnits="userSpaceOnUse"
							><stop offset=".639" stop-color="#9818E7"></stop><stop offset="1" stop-color="#DF7F4F"
							></stop></radialGradient
						><linearGradient id="b" x1="12" x2="12" y1="0" y2="24" gradientUnits="userSpaceOnUse"
							><stop stop-color="#fff"></stop><stop offset="1" stop-color="#fff" stop-opacity="0"
							></stop></linearGradient
						></defs
					></svg
				>
				{SiteTitle}
			</a>
		</h2>
		<div class="links">
			<a href="mailto:contactus@yourwebsite.example">Contact</a>
		</div>
	</nav>
</header>

<style>
	.links a {
		text-decoration: none;
	}
</style>

```


### `src/components/Modal.astro`

```astro
---
/**
 * Modal.astro — Reusable modal scaffold powered by Alpine.js
 *
 * Usage:
 *   <Modal id="my-modal" triggerLabel="Open settings">
 *     <h2 slot="header">Settings</h2>
 *     <p>Modal body content here.</p>
 *   </Modal>
 *
 * Props:
 *   id           – unique DOM id (required, used for aria-labelledby)
 *   triggerLabel – text rendered inside the default trigger button
 *   triggerClass – optional extra Tailwind classes on the trigger button
 */
export interface Props {
	id: string;
	triggerLabel?: string;
	triggerClass?: string;
}

const {
	id,
	triggerLabel = 'Open',
	triggerClass = '',
} = Astro.props;
---

<!-- Alpine component root -->
<div x-data="{ open: false }" x-id={`['modal-${id}']`}>
	<!-- ─── Trigger button ─── -->
	<button
		type="button"
		class:list={[
			'inline-flex items-center gap-2 rounded-lg px-4 py-2',
			'bg-purple-600 text-white font-medium text-sm',
			'hover:bg-purple-500 active:bg-purple-700',
			'transition-colors duration-150 cursor-pointer',
			'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-950',
			triggerClass,
		]}
		@click="open = true"
		:aria-expanded="open"
		:aria-controls="`modal-panel-${id}`"
	>
		<slot name="trigger-icon" />
		{triggerLabel}
	</button>

	<!-- ─── Modal overlay + panel ─── -->
	<template x-teleport="body">
		<div
			x-show="open"
			x-transition:enter="transition ease-out duration-200"
			x-transition:enter-start="opacity-0"
			x-transition:enter-end="opacity-100"
			x-transition:leave="transition ease-in duration-150"
			x-transition:leave-start="opacity-100"
			x-transition:leave-end="opacity-0"
			class="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="`modal-heading-${id}`"
			@keydown.escape.window="open = false"
			x-cloak
		>
			<!-- Backdrop -->
			<div
				class="absolute inset-0 bg-black/60 backdrop-blur-sm"
				@click="open = false"
				aria-hidden="true"
			></div>

			<!-- Panel -->
			<div
				x-show="open"
				x-transition:enter="transition ease-out duration-200"
				x-transition:enter-start="opacity-0 scale-95 translate-y-2"
				x-transition:enter-end="opacity-100 scale-100 translate-y-0"
				x-transition:leave="transition ease-in duration-150"
				x-transition:leave-start="opacity-100 scale-100 translate-y-0"
				x-transition:leave-end="opacity-0 scale-95 translate-y-2"
				x-trap.noscroll.inert="open"
				:id="`modal-panel-${id}`"
				class="relative z-10 w-full max-w-lg mx-4 rounded-2xl
				       border border-white/10
				       bg-gray-900/90 backdrop-blur-xl
				       shadow-2xl shadow-purple-900/20
				       ring-1 ring-white/5"
			>
				<!-- Header -->
				<div class="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
					<div :id="`modal-heading-${id}`" class="text-base font-semibold text-white">
						<slot name="header">Modal</slot>
					</div>
					<button
						type="button"
						class="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10
						       transition-colors duration-150
						       focus:outline-none focus:ring-2 focus:ring-purple-400"
						@click="open = false"
						aria-label="Close modal"
					>
						<!-- Heroicon: x-mark (mini) -->
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
							<path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
						</svg>
					</button>
				</div>

				<!-- Body -->
				<div class="px-6 py-5 text-sm text-gray-300 leading-relaxed">
					<slot />
				</div>

				<!-- Footer (optional) -->
				<div class="border-t border-white/10 px-6 py-4">
					<slot name="footer">
						<div class="flex justify-end">
							<button
								type="button"
								class="rounded-lg px-4 py-2 text-sm font-medium
								       bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white
								       transition-colors duration-150
								       focus:outline-none focus:ring-2 focus:ring-purple-400"
								@click="open = false"
							>
								Close
							</button>
						</div>
					</slot>
				</div>
			</div>
		</div>
	</template>
</div>

<style is:global>
	/*
	 * Alpine x-cloak: hide elements until Alpine initialises,
	 * preventing a flash of modal content on page load.
	 */
	[x-cloak] {
		display: none !important;
	}
</style>

```


### `src/components/SEO.astro`

```astro
---
import type { ImageMetadata } from 'astro';

type Image = {
	src: string | ImageMetadata;
	alt: string;
};

type SEOMetadata = {
	name: string;
	title: string;
	description: string;
	image?: Image | undefined;
	canonicalURL?: URL | string | undefined;
	locale?: string;
};

type OpenGraph = Partial<SEOMetadata> & {
	type?: string;
};

type Twitter = Partial<SEOMetadata> & {
	handle?: string;
	card?: 'summary' | 'summary_large_image';
};

export type Props = SEOMetadata & {
	og?: OpenGraph;
	twitter?: Twitter;
};

const {
	name,
	title,
	description,
	image,
	locale = 'en',
	canonicalURL = new URL(Astro.url.pathname, Astro.site),
} = Astro.props;

const og = {
	name,
	title,
	description,
	canonicalURL,
	image,
	locale,
	type: 'website',
	...(Astro.props.og ?? {}),
} satisfies OpenGraph;

const twitter = {
	name,
	title,
	description,
	canonicalURL,
	image,
	locale,
	card: 'summary_large_image',
	...Astro.props.twitter,
};

function normalizeImageUrl(image: string | ImageMetadata) {
	return typeof image === 'string' ? image : image.src;
}
---

<!-- Page Metadata -->
<link rel="canonical" href={canonicalURL} />
<meta name="description" content={description} />

<!-- Open Graph Tags -->
<meta property="og:title" content={og.title} />
<meta property="og:type" content={og.type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:locale" content={og.locale} />
<meta property="og:description" content={og.description} />
<meta property="og:site_name" content={og.name} />
{og.image && <meta property="og:image" content={normalizeImageUrl(og.image.src)} />}
{og.image && <meta property="og:image:alt" content={og.image.alt} />}

<!-- Twitter Tags -->
<meta name="twitter:card" content={twitter.card} />
<meta name="twitter:site" content={twitter.handle} />
<meta name="twitter:title" content={twitter.title} />
<meta name="twitter:description" content={twitter.description} />
{twitter.image && <meta name="twitter:image" content={normalizeImageUrl(twitter.image.src)} />}
{twitter.image && <meta name="twitter:image:alt" content={twitter.image.alt} />}

```


### `src/consts.ts`

```typescript
// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SiteTitle = 'Starlog';
export const SiteDescription = 'Welcome to my website!';

```


### `src/content.config.ts`

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const releases = defineCollection({
	// Load Markdown files in the src/content/releases directory.
	loader: glob({ base: './src/content/releases', pattern: '**/*.md' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			versionNumber: z.string(),
			image: z.object({
				src: image(),
				alt: z.string(),
			}),
			// Transform string to Date object
			date: z.coerce.date(),
		}),
});

const topics = defineCollection({
	// Load Markdown files in the src/content/topics directory.
	loader: glob({ base: './src/content/topics', pattern: '**/*.md' }),
	schema: z.object({
		/** Human-readable topic name shown in the UI */
		title: z.string(),
		/** Emoji or short code displayed alongside the topic */
		icon: z.string(),
		/** Tailwind color token used for badges / accents (e.g. "purple-500") */
		color: z.string(),
		/** One-liner explaining what the topic covers */
		description: z.string(),
		/** Whether this topic should appear in public listings (defaults to true) */
		visible: z.boolean().default(true),
	}),
});

export const collections = { releases, topics };

```


### `src/content/releases/1_0.md`

```markdown
---
title: 'Introducing Nebulous 1.0!'
date: '2022-03-21'
versionNumber: '1.0'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-1.jpg'
  alt: 'The full Astro logo.'
---

## A New World with 1.0

![Nebulous 2.0 Release](../../assets/starlog-placeholder-1.jpg)

Hey there, Nebulous users! We're back with some exciting updates that will turbocharge your Nebulous experience. Here's the lowdown:

### 🍿 New Features & Enhancements

- **NebulaProtect Supercharged:** Enjoy beefed-up security and real-time monitoring to keep your digital fortress unbreachable.
- **NebulaConnect for Teams:** Collaboration is a breeze with integrated project management tools.
- **Speed Boost Galore:** We've fine-tuned Nebulous for ultimate speed and responsiveness.

### 🐞 Bug Fixes

- Kicked pesky crashes out the door for NebulaSync.
- Fixed rare data hiccups during file transfers.
- Nebulous is now even friendly with older devices.

Thank you for making Nebulous your tech partner. We thrive on your feedback, so if you have ideas or run into bumps, don't hesitate to drop a line to our support wizards. Together, we're taking Nebulous to the next level!

```


### `src/content/releases/1_4.md`

```markdown
---
title: 'Introducing Nebulous 1.8!'
date: '2022-04-16'
versionNumber: '1.4'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-14.jpg'
  alt: 'The full Astro logo.'
---

## Go further with 1.4

![Nebulous 1.4 Release](../../assets/starlog-placeholder-14.jpg)

Hello, Nebulous enthusiasts! It's that time again—time for us to unveil the latest and greatest in our tech universe. Buckle up as we introduce you to the future of Nebulous:

### 🍿 New Features & Enhancements

- **NebulaSync Quantum:** Prepare for a mind-blowing file syncing experience. It's faster, smarter, and more intuitive than ever before.
- **NebulaAI Odyssey:** Welcome to the era of NebulaAI Odyssey—a journey into the boundless possibilities of artificial intelligence. From image manipulation to language translation, Odyssey empowers you like never before.

### 🐞 Bug Fixes

- Squashed even more bugs, making NebulaSync and other features more reliable than ever.
- Streamlined data transfer processes for flawless file exchanges.
- Extended support for older devices to ensure everyone enjoys Nebulous.
- Elevating error handling to the next level, ensuring a hiccup-free experience.

Thank you for being a part of the Nebulous journey. Your feedback fuels our innovation, so don't hesitate to share your thoughts or report any hiccups with our dedicated support team. Together, we're shaping the future of tech with Nebulous!

```


### `src/content/releases/1_8.md`

```markdown
---
title: 'Introducing Nebulous 1.8!'
date: '2022-06-01'
versionNumber: '1.8'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-18.jpg'
  alt: 'The full Astro logo.'
---

## Faster, Stronger, Betterer

![Nebulous 2.0 Release](../../assets/starlog-placeholder-18.jpg)

Hey there, Nebulous users! We're back with some exciting updates that will turbocharge your Nebulous experience. Here's the lowdown:

### New Features & Enhancements

- **NebulaProtect Supercharged:** Enjoy beefed-up security and real-time monitoring to keep your digital fortress unbreachable.
- **NebulaConnect for Teams:** Collaboration is a breeze with integrated project management tools.
- **Speed Boost Galore:** We've fine-tuned Nebulous for ultimate speed and responsiveness.

### 🐞 Bug Fixes

- Kicked pesky crashes out the door for NebulaSync.
- Fixed rare data hiccups during file transfers.
- Nebulous is now even friendly with older devices.

Thank you for making Nebulous your tech partner. We thrive on your feedback, so if you have ideas or run into bumps, don't hesitate to drop a line to our support wizards. Together, we're taking Nebulous to the next level!

```


### `src/content/releases/2_0.md`

```markdown
---
title: 'Introducing Nebulous 2.0!'
date: '2022-07-01'
versionNumber: '2.0'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-2.jpg'
  alt: 'The full Astro logo.'
---

## Introducing Nebulous 2.0!

![Nebulous 2.0 Release](../../assets/starlog-placeholder-2.jpg)

Greetings, Nebulous users! We're excited to bring you the latest updates in our [ever-evolving tech ecosystem](#). In this release, we're introducing some exciting new features and squashing a few pesky bugs. Let's dive in!

### 🍿 New Features & Enhancements

- **NebulaSync v2.0:** We're thrilled to introduce NebulaSync 2.0, our revamped file synchronization tool. It now offers blazing-fast sync speeds, improved reliability, and enhanced cross-device compatibility.
- **Enhanced NebulaProtect:** NebulaProtect, our comprehensive security suite, has received a major update. Enjoy advanced threat detection, and real-time monitoring.
- **NebulaConnect for Teams:** Collaborate effortlessly with NebulaConnect for Teams. This powerful feature allows seamless integration with your favorite project management tools, enabling you to manage tasks, share documents, and track progress in real-time.

### 🐞 Bug Fixes

- Resolved occasional crashing issues when using NebulaSync.
- Fixed a bug causing data corruption in rare cases during file transfers.
- Improved compatibility with older devices to ensure a seamless experience for all users.
- Enhanced error handling and reporting for a smoother user experience.

### 👀 Coming Soon

We can't spill all the beans just yet, but we're thrilled to give you a sneak peek of what's coming in the next Nebulous release:

- **NebulaWallet:** A secure and user-friendly cryptocurrency wallet integrated directly into Nebulous for seamless digital asset management.
- **NebulaConnect Mobile:** Take your collaboration to the next level with our upcoming mobile app, enabling you to work on the go.
- **NebulaLabs:** Our developer tools and API enhancements, providing you with even more customization options and possibilities.

If you have any suggestions or encounter any issues, don't hesitate to reach out to our support team. Together, we'll continue to make Nebulous the ultimate tech solution for you.

```


### `src/content/topics/billing.md`

```markdown
---
title: Billing
icon: "💳"
color: "purple-500"
description: Invoices, subscriptions, and payment processing updates.
visible: true
---

<!-- Topic body reserved for future use -->

```


### `src/content/topics/editor.md`

```markdown
---
title: Editor
icon: "✏️"
color: "orange-500"
description: Rich-text editing, markdown support, and content authoring tools.
visible: true
---

<!-- Topic body reserved for future use -->

```


### `src/content/topics/integrations.md`

```markdown
---
title: Integrations
icon: "🔗"
color: "gray-400"
description: Third-party connectors, webhooks, and API partnership features.
visible: true
---

<!-- Topic body reserved for future use -->

```


### `src/entrypoint.ts`

```typescript
import type { Alpine } from 'alpinejs';
import focus from '@alpinejs/focus';

export default (Alpine: Alpine) => {
	// Register the Focus plugin so x-trap is available in all components
	Alpine.plugin(focus);
};

```


### `src/layouts/IndexLayout.astro`

```astro
---
import BaseHead, { type Props as HeadProps } from '../components/BaseHead.astro';
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';

type Props = HeadProps;

const { ...head } = Astro.props;
---

<!doctype html>
<html lang="en">
	<head>
		<BaseHead {...head} />
	</head>
	<body>
		<div class="glow"></div>
		<Header />
		<slot />
		<Footer />
	</body>
</html>

```


### `src/layouts/PostLayout.astro`

```astro
---
import type { CollectionEntry } from 'astro:content';
import BaseHead from '../components/BaseHead.astro';
import Footer from '../components/Footer.astro';
import FormattedDate from '../components/FormattedDate.astro';
import Header from '../components/Header.astro';

type Props = {
	release: CollectionEntry<'releases'>;
};

const { release } = Astro.props;
---

<!doctype html>
<html lang="en">
	<head>
		<BaseHead
			title={release.data.title}
			description={release.data.description}
			image={release.data.image}
		/>
	</head><body>
		<div class="glow"></div>
		<Header />
		<div class="post single" transition:persist transition:name="post">
			<div class="version_wrapper">
				<div class="version_info">
					<div class="version_number">{release.data.versionNumber}</div>
					<FormattedDate class="date" date={release.data.date} />
				</div>
			</div>
			<div class="content">
				<slot />
			</div>
		</div>
		<Footer />
	</body>
</html>

```


### `src/pages/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../components/FormattedDate.astro';
import Layout from '../layouts/IndexLayout.astro';

const posts = await getCollection('releases');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout>
	<main>
		<h1 class="page_title">Changelog</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/releases/${post.id}`}>
									<div class="version_number">{post.data.versionNumber}</div>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							{render(post).then(({ Content }) => (
								<Content />
							))}
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>

```


### `src/pages/releases/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const releases = await getCollection('releases');

	return releases.map((release) => ({
		params: { slug: release.id },
		props: { release },
	}));
}

const { release } = Astro.props;

const { Content } = await render(release);
---

<Layout {release}>
	<Content />
</Layout>

```


### `src/styles/colors.scss`

```scss
@use 'sass:map';

@function color($color, $tone) {
	// @warn map.get($palette,$color);

	@if map.has-key($palette, $color) {
		$color: map.get($palette, $color);

		@if map.has-key($color, $tone) {
			$tone: map.get($color, $tone);
			@return $tone;
		}

		@warn "unknown tone `#{$tone}` in color";
		@return null;
	}

	@warn "unknown color `#{$color}` in palette";
	@return null;
}

$white: #ffffff;
$palette: (
	purple: (
		50: #f2e8fd,
		100: #e6d1fa,
		200: #cfa3f5,
		300: #ba75f0,
		400: #a846ec,
		500: #9818e7,
		600: #7b13b4,
		700: #5b0e81,
		800: #3a084e,
		900: #15031c,
		950: #020002,
	),
	orange: (
		50: #fbf0ea,
		100: #f8e3d9,
		200: #f2cab7,
		300: #ecb194,
		400: #e59872,
		500: #df7f4f,
		600: #d05f26,
		700: #a1491d,
		800: #713315,
		900: #421e0c,
		950: #2a1308,
	),
	gray: (
		50: #f6f6f9,
		100: #e6e7ef,
		200: #c7c9db,
		300: #a8abc7,
		400: #898eb4,
		500: #6a71a0,
		600: #545b83,
		700: #404664,
		800: #2c3145,
		900: #181b26,
		950: #0e1016,
	),
);

```


### `src/styles/global.css`

```css
@import "tailwindcss";
```


### `src/styles/global.scss`

```scss
@use 'colors.scss';
@use 'type.scss';
@use 'layout.scss';

```


### `src/styles/layout.scss`

```scss
@use 'sass:color';
@use './colors.scss' as colors;
@use './type.scss' as type;

$container: 1040px;
$tablet: 768px;
$mobile: 420px;

* {
	box-sizing: border-box;
}

body {
	margin: 0 auto;
	padding: 0 1em;
	width: 1040px;
	max-width: 100%;
	background-color: colors.$white;
	@media (prefers-color-scheme: dark) {
		background-color: colors.color(gray, 950);
	}
	@media (max-width: $tablet) {
		font-size: 16px;
	}
}

.glow {
	width: 100%;
	height: 100%;
	position: absolute;
	z-index: -1;
	top: 0;
	left: 0;
	overflow: hidden;

	&:after {
		content: '';
		display: block;
		position: absolute;
		top: -120px;
		left: calc(50% - 360px);
		width: 720px;
		height: 240px;
		background: radial-gradient(
			50% 50% at 50% 50%,
			rgba(colors.color(orange, 500), 0.2) 0%,
			rgba(colors.color(orange, 500), 0) 100%
		);
		@media (prefers-color-scheme: dark) {
			background: radial-gradient(
				50% 50% at 50% 50%,
				rgba(255, 255, 255, 0.06) 0%,
				rgba(255, 255, 255, 0) 100%
			);
		}
	}
}

::selection {
	background: colors.color(orange, 200);
	@media (prefers-color-scheme: dark) {
		background: colors.color(orange, 600);
	}
}

a,
a:visited {
	color: colors.color(orange, 600);
	transition: 0.1s ease;
	@media (prefers-color-scheme: dark) {
		color: colors.color(orange, 300);
	}

	&:hover {
		color: colors.color(orange, 500);
	}
}

hr {
	margin: 1em 0;
	border: 0;
	border-bottom: 1px solid colors.color(gray, 100);
	@media (prefers-color-scheme: dark) {
		border-color: colors.color(gray, 900);
	}
}

nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 2em 0;
	padding: 2em 0;

	a {
		transition: 0.1s ease;
		&:hover {
			opacity: 0.6;
		}
	}

	#site_title {
		margin: 0;
	}
	#site_title a {
		display: flex;
		align-items: center;
		gap: 10px;
		color: colors.color(gray, 950);
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 2px;
		line-height: 1;
		text-decoration: none;
		text-transform: uppercase;
		@media (prefers-color-scheme: dark) {
			color: colors.$white;
		}
	}
	.links a {
		margin-left: 1em;
		color: colors.color(gray, 800);
		@media (prefers-color-scheme: dark) {
			color: colors.color(gray, 200);
		}
	}
}

.content {
	ol,
	ul {
		padding-left: 2em;
		margin-bottom: 1em;
	}

	ul {
		list-style: none;

		li {
			position: relative;
			margin-bottom: 0.75em;

			&:before {
				content: '';
				display: block;
				position: absolute;
				left: -1em;
				top: 0.63em;
				width: 8px;
				height: 8px;
				background: linear-gradient(25deg, colors.color(purple, 500), colors.color(orange, 500));
				border-radius: 99px;
			}
		}
	}
}

.page_title {
	margin: 1.5em 0;
	@media (max-width: $tablet) {
		margin: 0.5em 0;
	}
}

.posts {
	list-style: none;
	padding: 0;
}

.post {
	display: flex;
	width: 100%;
	@media (max-width: $tablet) {
		flex-flow: column;
	}

	&:last-child .content,
	&.single .content {
		border-bottom: 0;
	}
}

.version_wrapper {
	flex-basis: 260px;
	flex-grow: 0;
	flex-shrink: 0;
	margin: 4.5em 0 0 0;
	@media (max-width: $container) {
		flex-basis: 140px;
	}
	@media (max-width: $tablet) {
		flex-basis: 0;
		margin-top: 2em;
	}

	.version_info {
		position: sticky;
		top: 1em;
		@media (max-width: $tablet) {
			position: relative;
			top: 0;
		}
	}

	a {
		float: left;
		color: colors.$white;
		text-decoration: none;
		transition: 0.1s ease;

		&:hover {
			opacity: 0.6;
		}
	}
}

.version_number {
	display: inline-block;
	font-family: type.$codeFont;
	line-height: 1;
	margin-bottom: 8px;
	padding: 4px 12px;
	color: colors.$white;
	background: linear-gradient(
		25deg,
		colors.color(purple, 800),
		colors.color(purple, 700),
		color.mix(colors.color(purple, 500), colors.color(orange, 500)),
		colors.color(orange, 500)
	);
	border-radius: 8px;
}

.date {
	clear: both;
	color: colors.color(gray, 800);
	font-family: type.$codeFont;
	font-size: type.$fontSizeSmall;
	@media (max-width: $tablet) {
		display: inline;
		margin-left: 1em;
	}
	@media (prefers-color-scheme: dark) {
		color: colors.color(gray, 200);
	}
}

.content {
	margin: 0;
	padding: 4em 0;
	border-bottom: 1px solid colors.color(gray, 100);
	@media (max-width: $tablet) {
		margin: 1em 0;
		padding: 0 0 2em 0;
	}
	@media (prefers-color-scheme: dark) {
		border-color: colors.color(gray, 900);
	}
	*:first-child {
		margin-top: 0;
	}
	img {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
		border: 1px solid colors.color(gray, 200);
		@media (prefers-color-scheme: dark) {
			border-color: colors.color(gray, 800);
		}
	}
}

footer {
	display: flex;
	padding: 2em 0;
	color: colors.color(gray, 500);
	justify-content: space-between;
	border-top: 1px solid colors.color(gray, 100);
	@media (max-width: $tablet) {
		padding: 1em 0;
	}
	@media (prefers-color-scheme: dark) {
		border-color: colors.color(gray, 900);
	}

	a {
		margin-left: 1em;
		color: colors.color(gray, 500);
		text-decoration: none;
		&:hover {
			color: colors.color(gray, 500);
			opacity: 0.6;
		}
	}
}

```


### `src/styles/type.scss`

```scss
@use './colors.scss' as colors;

$baseFont: 'Lato', sans-serif;
$codeFont: 'Source Code Pro', monospace;
$fontSizeSmall: 15px;

body {
	font-family: $baseFont;
	font-size: 18px;
	line-height: 1.65;
	font-weight: 400;
	color: colors.color(gray, 800);
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-rendering: optimizeLegibility;

	@media (prefers-color-scheme: dark) {
		color: colors.color(gray, 200);
	}
}

h1,
h2,
h3,
h4,
h5 {
	line-height: 1.2;
	margin: 1em 0 0.5em 0;
	color: colors.color(gray, 950);
	font-weight: 700;

	@media (prefers-color-scheme: dark) {
		color: colors.$white;
	}
}

h1 {
	font-size: 3.052em;
}
h2 {
	font-size: 2.441em;
}
h3 {
	font-size: 1.953em;
}
h4 {
	font-size: 1.563em;
}
h5 {
	font-size: 1.25em;
}

p {
	margin: 0 0 1em 0;
}

code {
	font-family: $codeFont;
}

b,
strong {
	font-weight: 700;
	color: #fff;
	color: colors.color(gray, 950);

	@media (prefers-color-scheme: dark) {
		color: colors.$white;
	}
}

```


### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}

```

