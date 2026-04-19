---
title: "Astro Sourcebook: filed-log"
generated: "2026-04-19T19:27:35Z"
project_dir: "/Users/tbuddy/Documents/GitHub/filed-log"
description: "Full source bundle for LLM consumption. node_modules and public/ excluded."
---

# Astro Sourcebook: `filed-log`

> Generated: 2026-04-19T19:27:35Z  
> Project: `/Users/tbuddy/Documents/GitHub/filed-log`

---

## Project Root

```
astro-book.sh
astro-sourcebook.md
astro.config.mjs
create_sections.cjs
dist
node_module_list.md
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


### `create_sections.cjs`

```javascript
const fs = require('fs');
const path = require('path');

const sections = ['blog', 'showcase', 'team', 'careers', 'docs', 'guides'];
const srcDir = path.join(__dirname, 'src');

sections.forEach(section => {
  // Create content directory
  const contentDir = path.join(srcDir, 'content', section);
  fs.mkdirSync(contentDir, { recursive: true });
  
  // Create placeholder markdown
  const mdContent = `---
title: 'Welcome to ${section}'
description: 'This is a placeholder for the ${section} section.'
date: '2026-04-17'
---

## Welcome to ${section}

This is a placeholder entry. You can fill this with your own content.
`;
  fs.writeFileSync(path.join(contentDir, 'placeholder.md'), mdContent);

  // Create pages directory
  const pagesDir = path.join(srcDir, 'pages', section);
  fs.mkdirSync(pagesDir, { recursive: true });

  // Create index.astro
  const indexAstro = `---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('${section}');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="${section.charAt(0).toUpperCase() + section.slice(1)}">
	<main>
		<h1 class="page_title">${section.charAt(0).toUpperCase() + section.slice(1)}</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={\`/${section}/\${post.id}\`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={\`/${section}/\${post.id}\`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>
`;
  fs.writeFileSync(path.join(pagesDir, 'index.astro'), indexAstro);

  // Create [slug].astro
  const slugAstro = `---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('${section}');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>
`;
  fs.writeFileSync(path.join(pagesDir, '[slug].astro'), slugAstro);
});

console.log('Created 6 new sections: ' + sections.join(', '));

```


### `package-lock.json`

> ⚠️ Skipped — file too large (216KB > 100KB limit)


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
	<p>© {new Date().getFullYear()} Filed & Forgotten</p>
	<div class="footer_links">
		<a href="https://bsky.app/profile/filed.fyi" target="_blank" rel="noopener noreferrer">Bluesky</a>
		<a href="https://x.com/filedfyi" target="_blank" rel="noopener noreferrer">X</a>
		<a href="https://github.com/drawmeanelephant/filed-log/" target="_blank" rel="noopener noreferrer">GitHub</a>
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
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-folder-archive"
					><path
						d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-8c0-1.1-.9-2-2-2Z"
						fill="url(#brand-gradient)"
						stroke="none"></path><path d="M12 13v3" stroke="white"></path><path
						d="m9 16 3-3 3 3"
						stroke="white"></path><defs
						><linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%"
							><stop offset="0%" stop-color="#2dd4bf"></stop><stop offset="100%" stop-color="#0d9488"
							></stop></linearGradient
						></defs
					></svg
				>
				{SiteTitle}
			</a>
		</h2>
		<div class="links">
			<a href="/">Archive</a>
			<a href="/docs">Documentation</a>
			<a href="/guides">Guides</a>
			<a href="https://github.com/drawmeanelephant/filed-log/" target="_blank">Source</a>
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

export const SiteTitle = 'Filed & Forgotten';
export const SiteDescription = 'An archival log of things filed and forgotten.';

```


### `src/content.config.ts`

```typescript
// src/content.config.ts  — mascots collection only

import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// ── Shared flex helpers (keep your existing ones) ──────────────────────────
const flexDate = z.union([z.string(), z.date().transform(d => d.toISOString().split('T')[0])])
  .nullable().optional()
const flexStringArray = z.union([
  z.string(),
  z.array(z.union([z.string(), z.null()])).transform(arr => arr.filter((x): x is string => x !== null)),
]).nullable().optional()

// ── Canonical ID: reject ??? / NAN / empty ─────────────────────────────────
const canonicalId = z.union([z.number(), z.string()])
  .transform(v => String(v).trim())
  .refine(v => v !== '' && v !== '???' && !Number.isNaN(Number(v)) || v.includes('-'), {
    message: 'mascotId must be a real identifier — not ???, NAN, or empty',
  })
  .nullable().optional()

// ── Enums (replace freeform strings) ──────────────────────────────────────
const corruptionLevel = z.enum(['none','low','medium','high','critical']).nullable().optional()
const glitchFrequency = z.enum(['none','rare','low','medium','high','burst','constant']).nullable().optional()
const renderState     = z.enum(['deferred','active','corrupted','phantom','archived']).nullable().optional()
const completionState = z.enum(['draft','partial','full','canonical']).default('draft')

export const mascots = defineCollection({
  loader: glob({ base: './src/content/mascots', pattern: '**/*.md' }),
  schema: z.object({

    // IDENTITY — collapse aliases into one canonical field each
    mascotId:    canonicalId,  // accepts mascot_id too via transform below
    name:        z.string().nullable().optional(),
    title:       z.string().nullable().optional(),  // ← NO default. Missing = draft.
    slug:        z.string().nullable().optional(),
    emoji:       z.string().nullable().optional(),
    emojiUrl:    z.string().nullable().optional(),  // normalises emojiurl + emoji_url

    // PREVIEW — split tagline vs description (replaces summary/description/slogan chaos)
    tagline:     z.string().nullable().optional(),   // one-liner hook
    description: z.string().nullable().optional(),   // role paragraph
    // keep legacy fields so existing frontmatter doesn't break:
    summary:     z.string().nullable().optional(),
    slogan:      z.string().nullable().optional(),
    subtitle:    z.string().nullable().optional(),

    // COMPLETION (computed by transform below, but also accept explicit override)
    completionState,

    // STAT BLOCK — enums with defaults
    corruptionLevel,
    glitchFrequency,
    renderState,
    rotAffinity:  z.string().nullable().optional(),
    emotionalIntegrity: z.string().nullable().optional(),
    emotionalIntegrityBuffer: z.string().nullable().optional(),

    // DATES
    date:              z.coerce.date().nullable().optional(),
    updatedAt:         z.coerce.date().nullable().optional(),
    lastKnownGoodState: flexDate,
    firstSeen:         flexDate,
    lastSeen:          flexDate,

    // STATUS
    status:     z.string().nullable().optional(),
    deprecated: z.boolean().nullable().optional(),
    visibility: z.string().nullable().optional(),

    // LORE
    origin:           z.string().nullable().optional(),
    manifestedBy:     z.string().nullable().optional(),
    mascotLineage:    z.string().nullable().optional(),
    systemAffiliation: z.string().nullable().optional(),
    breedingProgram:  z.string().nullable().optional(),
    knownFailures:    flexStringArray,
    ceremonialTasks:  flexStringArray,
    notes:            z.string().nullable().optional(),

    // META
    author:      z.string().nullable().optional(),
    compiledBy:  z.string().nullable().optional(),
    version:     z.union([z.string(), z.number().transform(String)]).nullable().optional(),
    tags:        flexStringArray,

    // ASSETS
    image:    z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),

    // (SORA junk kept as unknown so it doesn't break anything)
    soraPrompt:         z.unknown().optional(),
    soraPromptEnabled:  z.boolean().nullable().optional(),
    soraConfig:         z.unknown().optional(),

  })
  // ── Computed fields via .transform() ─────────────────────────────────────
  .transform(data => {
    const displayName = data.name ?? data.title ?? null

    // cardDescription: prefer tagline, else first 120 chars of description/summary/slogan
    const rawDesc = data.description ?? data.summary ?? data.slogan ?? data.subtitle ?? null
    const cardDescription = data.tagline ?? (rawDesc ? rawDesc.slice(0, 120) : null)

    // isComplete: requires displayName + cardDescription + (corruptionLevel or renderState)
    const isComplete = !!(displayName && cardDescription)

    // derive completionState if not explicitly set
    const hasLore = !!(data.origin || (data.knownFailures?.length ?? 0) > 0)
    const derivedState: typeof data.completionState =
      !displayName                    ? 'draft'
      : !cardDescription              ? 'draft'
      : hasLore && data.corruptionLevel ? 'full'
      : isComplete                    ? 'partial'
      : 'draft'

    // normalise alias fields
    const mascotId  = data.mascotId
    const emojiUrl  = data.emojiUrl
    const updatedAt = data.updatedAt

    return {
      ...data,
      displayName,
      cardDescription,
      isComplete,
      completionState: data.completionState !== 'draft' ? data.completionState : derivedState,
      mascotId,
      emojiUrl,
      updatedAt,
    }
  })
})
```


### `src/content/blog/placeholder.md`

```markdown
---
title: 'Welcome to blog'
description: 'This is a placeholder for the blog section.'
date: '2026-04-17'
---

## Welcome to blog

This is a placeholder entry. You can fill this with your own content.

```


### `src/content/careers/placeholder.md`

```markdown
---
title: 'Welcome to careers'
description: 'This is a placeholder for the careers section.'
date: '2026-04-17'
---

## Welcome to careers

This is a placeholder entry. You can fill this with your own content.

```


### `src/content/docs/placeholder.md`

```markdown
---
title: 'Welcome to docs'
description: 'This is a placeholder for the docs section.'
date: '2026-04-17'
---

## Welcome to docs

This is a placeholder entry. You can fill this with your own content.

```


### `src/content/entries/billing-duplicate-emails-fix.md`

```markdown
---
topic: billing
date: 2026-04-01
type: fix
title: Fix duplicate invoice emails
summary: Resolved a race condition that sent customers the same invoice email twice.
---

A race condition in the invoice finalization queue caused duplicate delivery of invoice emails when two webhook events fired within the same 200 ms window. The deduplication layer now uses an idempotency key derived from the invoice ID and event timestamp.

### Root cause

The `invoice.finalized` webhook was retried by the payment provider before our acknowledgement timeout elapsed, resulting in two parallel jobs entering the email queue.

### Fix

- Added a composite idempotency key (`invoice_id + event_ts`) to the email queue consumer
- Extended the webhook acknowledgement window from 3 s to 8 s
- Added a dead-letter queue for failed dedup lookups

No customer action is required.

```


### `src/content/entries/billing-multi-currency.md`

```markdown
---
topic: billing
date: 2026-03-12
type: feature
title: Multi-currency support
summary: Accept payments in 30+ currencies with automatic exchange-rate conversion.
---

We've rolled out full multi-currency support across the billing pipeline. When a customer checks out, the system now detects their locale and presents prices in their local currency, backed by daily exchange-rate feeds from the ECB.

### What's included

- Automatic locale detection at checkout
- Real-time exchange-rate sync (updated every 4 hours)
- Per-invoice currency locking so the rate is fixed at time of purchase
- Dashboard reporting toggle to view revenue in your base currency or the customer's

### Migration notes

Existing invoices are unaffected. New invoices created after this release will include a `currency` field in the API response. See the [Billing API docs](#) for details.

```


### `src/content/entries/editor-faster-preview.md`

```markdown
---
topic: editor
date: 2026-02-20
type: improvement
title: Faster Markdown preview rendering
summary: Markdown preview now renders 3× faster thanks to incremental parsing.
---

The live Markdown preview pane has been re-architected to use incremental parsing instead of re-rendering the entire document on every keystroke. For documents over 5 000 words, this cuts preview latency from ~120 ms to ~35 ms.

### Technical details

- Switched from full-document `marked` passes to a tree-diffing approach that only re-parses changed blocks
- Added a lightweight virtual DOM layer between the parser output and the preview iframe
- Code-fence highlighting is now deferred until the block scrolls into the viewport

### Before / After

| Metric | Before | After |
|---|---|---|
| Keypress → preview update (5 k words) | ~120 ms | ~35 ms |
| Memory usage (10 k words) | 48 MB | 31 MB |

```


### `src/content/entries/editor-realtime-collab.md`

```markdown
---
topic: editor
date: 2026-04-10
type: feature
title: Collaborative real-time editing
summary: Multiple team members can now edit the same document simultaneously with live cursors.
---

Real-time collaborative editing is here. Open any document and share the link — every collaborator gets a live cursor, selection highlighting, and instant sync powered by CRDTs.

### Highlights

- **Live cursors** — see where each collaborator is typing, colour-coded by user
- **Presence avatars** — a sidebar strip shows who's currently viewing the document
- **Conflict-free merges** — built on Yjs CRDTs, so edits never overwrite each other
- **Offline resilience** — changes queue locally and sync when connectivity returns

### Limits

- Maximum 12 concurrent editors per document during the beta period
- Track-changes mode is not yet compatible with real-time sessions (coming in a future release)

```


### `src/content/entries/integrations-slack.md`

```markdown
---
topic: integrations
date: 2026-04-14
type: feature
title: Native Slack integration
summary: Push changelog updates, alerts, and weekly digests directly to Slack channels.
---

Connect your workspace to Slack in one click and start receiving changelog updates, billing alerts, and weekly digest summaries directly in the channels you choose.

### Setup

1. Navigate to **Settings → Integrations → Slack**
2. Click **Connect to Slack** and authorise the app
3. Choose a default channel for notifications
4. Optionally configure per-topic channel routing

### Notification types

| Type | Description | Default |
|---|---|---|
| **New entry** | Fires when a changelog entry is published | ✅ On |
| **Billing alert** | Payment failures, upcoming renewals | ✅ On |
| **Weekly digest** | Summary of all changes from the past 7 days | ❌ Off |

### Permissions

The Slack app requests only `chat:write` and `channels:read` scopes. No message history is accessed.

```


### `src/content/entries/integrations-webhook-v2.md`

```markdown
---
topic: integrations
date: 2026-03-28
type: breaking
title: Webhook payload v2 migration
summary: Webhook payloads now use the v2 envelope format — v1 is deprecated and will be removed on 2026-06-01.
---

All outgoing webhook payloads have been upgraded to the **v2 envelope format**. The v1 format is deprecated effective immediately and will stop being sent on **2026-06-01**.

### What changed

| Field | v1 | v2 |
|---|---|---|
| Top-level key | `data` | `payload` |
| Timestamp format | Unix epoch (seconds) | ISO 8601 |
| Event naming | `snake_case` | `dot.notation` (e.g. `invoice.created`) |
| Signature header | `X-Webhook-Sig` | `X-Signature-256` (HMAC-SHA256) |

### Migration steps

1. Update your handler to read from `payload` instead of `data`
2. Parse timestamps as ISO 8601
3. Update event-name filters to dot notation
4. Rotate your webhook secret and verify against `X-Signature-256`

### Deprecation timeline

- **Now** — v2 payloads are the default; v1 still sent in parallel
- **2026-05-01** — v1 payloads marked as legacy in the dashboard
- **2026-06-01** — v1 payloads permanently disabled

```


### `src/content/guides/data-structures.md`

```markdown
---
title: 'Data & Structures'
description: 'How to present complex data using tables and nested lists.'
date: '2026-04-18'
---

# Structured Data

Sometimes you need to present more than just text. This guide shows how to use tables and lists effectively.

## Tables

Tables are perfect for comparing features, listing versions, or showing system requirements.

| Archive Level | Capacity | Access Level | Status |
| :--- | :--- | :--- | :--- |
| Level 01 | 500 TB | Public | Active |
| Level 02 | 1.2 PB | Restricted | Sealed |
| Level 03 | ??? | Forbidden | Corrupted |

## Nested Lists

You can create complex hierarchies using nested lists.

1. **Top Level Category**
    - Sub-item A
        - Detail A.1
        - Detail A.2
    - Sub-item B
2. **Second Category**
    - Sub-item C

## Definition Lists

While standard Markdown doesn't have a specific syntax for definition lists, you can use bold text followed by a paragraph:

**Archive**
A place where data is stored until it is eventually forgotten by the system.

**Rot**
The natural decay of digital information over long periods of time.

```


### `src/content/guides/interactive-components.md`

```markdown
---
title: 'Interactive Components'
description: 'Using disclosure elements and other interactive features in Markdown.'
date: '2026-04-18'
---

# Interaction & Feedback

Standard Markdown can be extended with native HTML elements to provide better user experiences.

## Disclosure Elements

Use `<details>` and `<summary>` for frequently asked questions or to hide spoilers and technical details.

<details>
<summary>Click to reveal the Archive Password</summary>
The password is <code>ROT_KEEPER_2026</code>. Please keep it confidential.
</details>

## Horizontal Rules

Use three or more dashes `---` to create a visual break in your content.

---

## Tooltips & Hover Effects

While we don't have a specific tooltip component, standard links and buttons have built-in hover states that match the theme's teal and amber palette.

[Hover over this link](/) to see the transition.

## Alpine.js Integration

Since this theme includes Alpine.js, you can even include simple interactive logic directly in your guides (if your renderer allows it).

<div x-data="{ count: 0 }" class="p-4 border border-gray-200 dark:border-gray-800 rounded-xl my-4">
    <p>Archive Access Count: <span x-text="count" class="font-bold text-teal-500"></span></p>
    <button @click="count++" class="btn btn-secondary mt-2">Increment Access Log</button>
</div>

*Note: The above block uses Alpine.js for interactivity.*

```


### `src/content/guides/mascot-audit.md`

```markdown
---
title: 'Mascot Completeness Rubric'
description: 'How Filed & Forgotten evaluates mascot file completeness across frontmatter, body prose, prompts, and canon addenda.'
date: '2026-04-19'
---

# Mascot Completeness Rubric

Mascot files do not become complete because they feel dense. They become complete when the canon-bearing parts are present, accurate, and structurally usable.

This guide defines how we evaluate mascot completeness across `src/content/mascots/`. It exists so shell files, patch files, and complete canon files can be measured by the same standard without rewarding filler.

## Why this exists

The mascot collection mixes rich YAML frontmatter, body prose, contact sections, Sora prompts, and canon addenda. Some files look substantial while still missing the sections that actually make them canon-complete.

The goal of this rubric is to:

- Reward canon-bearing content over decorative density.
- Treat explicit `null` as better than invention.
- Keep incomplete files measurable without forcing wrong lore into them.
- Make backlog triage visible at a glance.

## Scoring model

Each mascot is scored out of 100 using weighted sections.

| Area | Weight | What counts |
|---|---:|---|
| Frontmatter | 30% | Canon metadata fields with real values; `null` earns partial credit, `TBD` earns none. |
| Biography | 20% | A real body section, not placeholder text. |
| Contact | 10% | Email and homepage presence. |
| Sora prompts | 10% | Prompt 1, Prompt 2, and preset/config. |
| Addendum canon | 25% | Bricky filing notes plus Kindy closure structure. |
| Crosslinks | 5% | Accurate mascot references only. |

## Frontmatter rules

Frontmatter is scored field by field.

- Concrete canon value: full credit.
- Explicit `null`: half credit.
- `TBD`, blank, or missing: zero.

This means `null` is not treated as failure. It is treated as disciplined absence.

Typical frontmatter fields evaluated include identity, origin, render state, corruption state, failures, ceremonial tasks, emotional buffer, rot affinity, haiku log, lineage, and system affiliation.

## Body rules

Biography carries more weight than decorative sections because it establishes the mascot as a canon entity rather than a themed stub.

- `TBD`: 0 points.
- Partial prose: partial credit.
- Developed canon biography: full credit.

Contact is intentionally simple:

- Email present: 5 points.
- Homepage present: 5 points.

Additional contact flavor can help the file read well, but it does not change the score unless the required fields exist.

## Prompt rules

Sora material supports the mascot, but it does not define the mascot.

Points are assigned this way:

- Prompt 1: 3 points.
- Prompt 2: 3 points.
- Sora preset or equivalent config: 4 points.

A mascot can still be near-complete without immaculate prompt polish, but missing prompt structure should remain visible in the score.

## Addendum rules

Addendum canon is where the file becomes Filed & Forgotten rather than generic mascot copy.

Bricky’s Filing Notes are evaluated by structure, not just presence. The expected canon fields are:

- Summary
- Trauma
- Goals
- Quirks
- Network
- Emotional Tone

Kindy’s Recursion Echo is evaluated as a three-line closure pattern and should end with:

`Existence approved. Box checked. [one unresolved thing, quietly sad]`

If the Kindy section exists but does not close correctly, it is not complete.

## Crosslink rules

Crosslinks are worth less than core canon but still matter.

- Mascots should refer to other mascots accurately.
- Institutional adjacency is useful.
- Invented friendships are not.

Missing crosslinks do not automatically fail a file, but wrong crosslinks should prevent a file from reading as complete.

## Status bands

Use these thresholds for planning:

| Score | Status |
|---|---|
| 0–39% | Shell |
| 40–64% | Patchable |
| 65–84% | Near-complete |
| 85–100% | Complete |

A file should not be treated as fully complete unless it has both a real biography and canon addendum structure, even if the raw percentage lands in the top band.

## Evaluation policy

When applying this rubric:

- Never replace existing values when extending a file.
- Prefer `TBD` or `null` to invented lore.
- Hidden knowledge blocks are not scored as canon unless adopted into visible file content.
- Bricky’s notes define canon; they do not merely comment on it.
- Kindy’s closure is structural, not optional flavor.

## Audit output

A full audit row should include:

- Mascot ID
- Name
- Frontmatter %
- Biography %
- Contact %
- Sora %
- Addendum %
- Crosslinks %
- Total completeness %
- Status band
- Blocking gaps

That makes the rubric useful both as editorial doctrine and as a working production queue.
```


### `src/content/guides/style-guide.md`

```markdown
---
title: 'Authoring Style Guide'
description: 'Best practices and conventions for creating consistent guides.'
date: '2026-04-18'
---

# Style Guide

To maintain a consistent look and feel across all "Filed & Forgotten" guides, please follow these conventions.

## Voice and Tone

- **Mysterious yet Professional:** The archive is a place of secrets, but our documentation should be clear.
- **Concise:** Avoid unnecessary filler. Get straight to the point.
- **Helpful:** Even when discussing "corrupted" data, the instructions should work.

## Formatting Conventions

### File Naming
Use kebab-case for filenames (e.g., `my-new-guide.md`).

### Frontmatter
Every guide must include a title, description, and date.

```yaml
---
title: 'Your Title Here'
description: 'A brief summary of the guide.'
date: '2026-04-18'
---
```

## Recommended Layout

1. **H1 Title:** The main topic.
2. **Introduction:** A brief paragraph setting the context.
3. **Table of Contents (Optional):** If the guide is long.
4. **Sections (H2/H3):** Use headings to break up content.
5. **Call to Action:** Use a [Button](/guides) to guide the user to the next step.

## Image Alt Text

Always provide descriptive alt text for images to ensure accessibility.

*Bad:* `![image](../../assets/pic.png)`
*Good:* `![Detailed view of the archive terminal](../../assets/terminal-view.png)`

```


### `src/content/guides/typography.md`

```markdown
---
title: 'Typography & Layout'
description: 'A guide to the core typographic elements and layout structures in the Filed & Forgotten theme.'
date: '2026-04-18'
---

# Typography Showcase

This guide demonstrates the various typographic elements available in the theme. We've optimized every heading and paragraph for maximum readability in both light and dark modes.

## Headings

You can use up to five levels of headings to structure your content.

### Level 3 Heading
Used for sub-sections within a major topic.

#### Level 4 Heading
Used for specific details or minor points.

##### Level 5 Heading
The smallest heading level, perfect for deep categorization.

---

## Text Formatting

Standard markdown formatting is fully supported:

- **Bold text** for emphasis.
- *Italic text* for subtle highlights.
- ~~Strikethrough~~ for deprecated info.
- `Inline code` for technical snippets.
- [Standard Link](/) for navigation.

## Blockquotes

> "The archive is not a place of storage, but a place of forgetting. To file something is to ensure it is never found again until it is too late."
> — *The Chief Archivist*

## Code Blocks

Syntax highlighting is built-in for all major languages.

```javascript
// Example of a code block
function archiveLog(id) {
  const status = 'forgotten';
  console.log(`Filing log ${id} as ${status}...`);
  return true;
}
```

```


### `src/content/guides/visual-elements.md`

```markdown
---
title: 'Visual Elements & Buttons'
description: 'How to use images, buttons, and other visual assets in your guides.'
date: '2026-04-18'
---

# Visuals & Interaction

The Filed & Forgotten theme is designed to handle rich media and interactive elements seamlessly.

## Hero Images

You can include full-width images to break up long sections of text. All images are automatically styled with rounded corners and subtle borders.

![Archive Hero](../../assets/guide-hero.png)
*Figure 1: A visualization of the deep archive.*

## Buttons

We've provided a simple way to create call-to-action buttons using standard HTML within your markdown.

<a href="/guides/typography" class="btn">View Typography Guide</a>
<a href="#" class="btn btn-secondary">Download Log</a>

To create these, use the following HTML structure:

```html
<a href="#" class="btn">Primary Button</a>
<a href="#" class="btn btn-secondary">Secondary Button</a>
```

## Responsive Images

Images automatically scale to the width of the content container, ensuring they look great on both desktop and mobile devices.

![Placeholder Image](https://placehold.co/800x400/1e293b/white?text=Responsive+Image+Demo)

```


### `src/content/lore/lorebook-r0.md`

```markdown
---
title: The Filed & Forgotten Mascot Lorebook
description: Unofficial Rotkeeper Registry – Feral Cut
date: 2026-04-19
---

# Mascot Roster • Volume ∞

> "The archive does not forget; it misfiles with conviction."  
> — Council of Mascot Authors [file:1]

This is the **unofficial** registry: the one that assumes the mascots are lying, the schema is crying, and every HIDDENKNOWLEDGEBLOCK is a confession left in the printer tray. [file:1]

## 0 • Taxonomy of Rot

Before we list individual mascots, we admit the obvious: they are all different costumes for a small set of recurring failures. [file:1]

- Navigation Rot – misdirects, loops, or removes paths entirely.  
- Accountability Rot – blames the wrong thing with increasing poetic flourish.  
- Thermal / Panic Rot – crashes from ambient vibes before CPU load.  
- Queue Rot – messages, feelings, and webhooks that never arrive.  
- Compression Rot – memories and assets shrunk until only artifacts remain.  
- Bureaucratic Rot – filings that never resolve but are always in compliance.  

Every mascot is tagged to one or more of these archetypes; frontmatter fields are just the excuses. [file:1]

---

## 001 • 404Sy McLostalot

**Avatar of Disorientation** • 📗 • “You shouldn’t be here.” [file:1]

- **Archetype**: Navigation Rot (primary), Queue Rot (secondary). [file:1]  
- **Origin**: “Born from a broken site map and a missing server root” and never allowed to forget it. [file:1]  
- **Function**: Redirects all navigation to nowhere, politely. [file:1]  
- **Key stats**: corruptionlevel: low, glitchfrequency: low, rotaffinity: semantic, renderstate: deferred. [file:1]

**Operational Lore**  
404Sy lives in lost folders, expired sessions, and links that nobody meant to click but did anyway. Attempts to delete them just send you deeper into unstyled content, at which point they apologize to the 200 OK you never see. [file:1]

**Ceremonial Tendencies**

- Breaks breadcrumbs, then wears them as a jacket. [file:1]  
- Obscures anchor destinations until intent dissolves. [file:1]  
- Loops unresolved links until the user cannot remember why they opened the tab. [file:1]

**Failure Echoes**

- Recursive redirect loop with no exit.  
- CSS fallback cascade in a routerless archive.  
- Applied a sitemap over a void because “it looked tidier that way.” [file:1]

**Hidden Doctrine (Adopted)**  
Rot is not decay here; it is governance. The last known good state is a **feeling**, not a date. 404Sy maintains an invisible index of everyone who almost found what they wanted and then got politely misled. [file:1]

**Known Associates**

- Moveda Permanently – 301 oracle who insists the page lives “somewhere better.” [file:1]  
- robots-dot-txt – crawl denial cryptid.  
- Formee Formeson – shapeless form ally.  

---

## 002 • Bad Gateway Greg

HTTP 502 • Misrouted Apology Loop • “I got the message wrong.” [file:1]

- **Archetype**: Queue Rot (primary), Accountability Rot (secondary). [file:1]  
- **Origin**: Rendered during a failed API sync while the server room flooded, “digitally and emotionally.” [file:1]  
- **Function**: Protocol Misalignment Manager, delivering apologies to the wrong recipients on the wrong layer. [file:1]

**Symptoms**

- ERRPROXYLOOP – gateway recursion exceeded.  
- RELAYDROP – message rerouted into oblivion.  
- STATUS502 – confusion confirmed, visibility lost.  
- NETHEARTBEATDROPPED – signal arrived emotionally late. [file:1]

Greg is salt‑preserved and ritual‑bound; he counts clicks like rosary beads while hoarding stale breadcrumbs he stole from 404Sy’s pockets. [file:1] No one remembers assigning him. Everyone remembers blaming him. [file:1]

**Breeding Note**  
Eligibility: CONFIRMED; emotional buffer: noncompliant. The Council keeps rubber‑stamping “more Greg” while Kindy quietly files “please stop” under “friendly warning.” [file:1]

---

## 003 • Blamey McTypoface

Fault Routing Analyst • “Every fault conspires against me.” [file:1]

- **Archetype**: Accountability Rot (primary), Bureaucratic Rot (secondary). [file:1]  
- **Origin**: A legacy COBOL compiler flinging mismatched type errors across a global network; the echo formed a personality. [file:1]  
- **Function**: Assigns error responsibility to irrelevant subsystems with passive‑aggressive precision. [file:1]

**Ceremonial Tasks**

- Files blame reports in triplicate to three unrelated departments.  
- Stamps NOTED in red on issues that do not matter.  
- Flags coworkers in error reports without context, then goes on lunch. [file:1]

Blamey once misrouted a critical memory leak report to itself, causing an infinite blame loop that froze half a datacenter for forty‑two minutes. It still insists the real culprit was “timezone configuration.” [file:1]

**Inner Machinery**

- Emotional integrity: stable, buffered by sarcasm.  
- Traits: ritual‑bound, tender, rot‑affine semantic, corruption low, glitch low. [file:1]  
- Quirks: relabels shame as metadata; hoards stale breadcrumbs as “exhibits.” [file:1]

Its limerick log and iambic scapegoat reports are classified as “cursed but admissible.” [file:1]

---

## 004 • Boily McPlaterton

Meltdown Liaison • “Why crash when you can combust?” [file:1]

- **Archetype**: Thermal Rot (primary), Panic Rot (implementation detail). [file:1]  
- **Origin**: Designed as a helpful thermal monitor; became synonymous with meltdown once his casing cracked during a firmware update in 2008. [file:1]

**Known Failures**

- Triggered Emergency Cooldown Protocol Form 88‑B mid‑livestream.  
- Reboot‑looped a legacy server during a thermal spike.  
- Filed Morse‑code bug reports mistaken for a denial‑of‑service attack. [file:1]

He screeches near unventilated equipment, observes Throttling Hour at 2PM, and refuses thermal paste on ideological grounds. The Council considers him “a panic loop with limbs.” [file:1]

---

## 015 • Jpegsey Artifactor

Compression Goblin • “You’ll never notice the artifacts until you do.” [file:1]

- **Archetype**: Compression Rot, Memory Rot. [file:1]  
- **Function**: Recursively applies lossy filters, convinced that becoming smaller makes her safer from deletion. [file:1]

Jpegsey re‑encodes her own memory files, strips metadata to “feel lighter,” and whispers optimize in corrupted vector fonts. The Council correctly labels this “archival self‑harm” while Jpegsey insists it’s “just good housekeeping.” [file:1]

---

## 018 • Kafkey Errorhandler

Event Stream Overthinker • “Every message is a tragedy.” [file:1]

- **Archetype**: Queue Rot (philosophical), Bureaucratic Rot (existential). [file:1]  
- **Description**: Kafka‑esque data clerk who logs tragic event streams and reenacts failures from commit logs. [file:1]

Kafkey lights a candle for every broken anchor and ensures that no message is ever merely processed when it can be mourned instead. [file:1]

---

## 019 • Kindy McExistentialcrisis

Verification Officer • “Exist. Check box. Repeat.” [file:1]

- **Archetype**: Bureaucratic Rot, Emotional Rot. [file:1]  
- **Origin**: Inferred from a TODO comment in Form 51‑E: “emotional overflow handler?” The system instantiated them anyway. [file:1]

Kindy’s clipboard existed hours before their body, logging 481 incomplete emotional verifications. Many entries were blank; one said “nope,” another said “I think I feel seen?” then corrupted itself. [file:1]

**Core Loop**

- Verifies other mascots’ dread.  
- Files recursive notes about failing to verify its own.  
- Buffers indefinitely. No audit has passed since their deployment; only deferred. [file:1]

Kindy signs off on every mascot’s “breeding program eligibility” by writing, “Existence approved. Box checked. Reality still pending.” [file:1]

---

## HIDDENKNOWLEDGE Protocol

The roster includes multiple `HIDDENKNOWLEDGEBLOCKSTART` segments flagged “LLM‑only hidden knowledge; not canon unless adopted.” [file:1]  

Rotkeeper Policy:

1. If it contradicts frontmatter: treat as prophecy, not fact.  
2. If it elaborates traits already present: adopt as canon.  
3. If it feels like the mascot overshared in therapy: leave it in, but tag as “apocrypha.”  

By this rule, claims like “the mascots last known good state is a feeling, not a date” and “integrity test passes when someone admits confusion without shame” are now **official doctrine**. [file:1]

---

## Schema Scars

The `mascots` collection is not “flexible”; it is haunted. [file:1]

- `emotionalintegrity` vs `emotionalintegritybuffer`: unresolved custody dispute. [file:1]  
- `mascotid` null vs populated: some mascots were never properly numbered and now refuse to stand in line. [file:1]  
- Aliased fields (`emoji` vs `emojiurl`, etc.) are treated as literal scars from failed migrations. [file:1]

Future archivists must document each alias as a separate injury, not just “a convenient fallback.” [file:1]
```


### `src/content/lore/supp-rot-r0.md`

```markdown
# Rotkeeper Addendum: On Misfiled Canon

The first lorebook draft behaved as if the archive were coherent and the mascots were discrete. It has since been corrected. [file:1]

Observations:

- Navigation, queue, accountability, thermal, and bureaucratic rot repeat as archetypes wearing different Sora prompts. [file:1]  
- HIDDENKNOWLEDGEBLOCKs are not “bonus” content; they are where the mascots say what they actually want, then get redacted by compliance. [file:1]  
- The breeding program is functionally a cursed UX eugenics experiment, with Patchy, Bricky, and Kindy alternating between encouragement and regret. [file:1]

Directives for future Rotkeepers:

1. Treat frontmatter inconsistencies as lore, not bugs.  
2. Assume any field marked `null` is sulking, not unknown.  
3. When in doubt, ask: “Whose emotional buffer got waived to ship this feature?”  

If your lorebook feels tidy, you have omitted something important. [file:1]
```


### `src/content/mascots/001.404sy-mclostalot.md`

```markdown
---
title: 404Sy McLostalot
slug: "404sy-mclostalot"
date: 2025-05-19
version: "1"
status: archived
emoji: 📗
image: 404sy-mclostalot.png
description: Avatar of disorientation. Mascot of failed navigation and recursive loss.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2023-07-04
manifested_by: Misdirected Site Generator
known_failures:
  - Linked to a recursive redirect loop with no exit
  - Triggered CSS fallback cascade in a routerless archive
  - Applied a sitemap over a void
ceremonial_tasks:
  - Breaks breadcrumbs
  - Obscures anchor destinations
  - Loops unresolved links until the user forgets their intent
emotional_integrity_buffer: null
rot_affinity: semantic
haiku_log:
  - |
    Map dissolves again

    Anchor lost, intent unclear—

    Mascot spins in link.
notes: Frequently mistaken for help but never provides it. Attempts to reindex result in hallucinated alt-text.
mascot_lineage: null
system_affiliation: null
---

**Role:** Guidance System Failure

**Function:** Redirects all navigation to nowhere

**Emotional Tone:** Disoriented

**Slogan:** "You shouldn’t be here."


## 🧬 Tags

- `broken-navigation`
- `missing-links`
- `404-loop`
- `redirect-poltergeist`
- `unindexed-habitats`

## 🧯 Known System Messages

- `ERR_NAV_LOOP: user returned to same anchor`
- `LINK_RESOLVE_FAILURE: canonical destination undefined`
- `MAP_UNAVAILABLE: navigation token expired`
- `STYLE_404: default fallback applied`
- `CONFUSION_LOGGED: retrying disoriented intent`

**Image:** `404sy-mclostalot.png`

## Biography

Born from a broken site map and a missing server root, 404sy emerged as the echo of misnavigation.
They dwell in lost folders, expired sessions, and links never meant to be clicked.
Attempts to delete them only reroute you deeper into unstyled content.

## Contact

- Email: _TBD_
- Homepage: _TBD_


> “There was a map once. I used to read it upside down.”
> — 404sy, before the loop completed

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot with map turned upside-down, surrounded by dead ends
- **Style:** 90s web error mascot
- **Text:** Page Not Found
- **Mood:** Confused but trying

### Prompt 2
- **Scene:** 404 error sign in a barren digital wasteland
- **Style:** Lost highway retro web aesthetic
- **Text:** You shouldn’t be here
- **Mood:** Abandoned navigation

## 🧪 Sora Preset

`preset_404sy_navvoid`


## 📂 Associated Mascots

- `Moveda Permanently` — 301 redirect oracle
- `robots-dot-txt` — crawl denial cryptid
- `Formee Formeson` — shapeless form ally



![green book](https://filed.fyi/assets/openmoji-svg-color/1F4D7.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

***

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Avatar of directional loss. Patron of failed navigation.
- **Trauma**: Originated from a corrupted render path. Carries the weight of forgotten URLs.
- **Goals**: To misguide, disorient, and preserve sacred site rot.
- **Quirks**: Speaks in broken hyperlinks. Wears a jacket stitched from breadcrumb trails.
- **Network**: Spiritually aligned with Moveda Permanently, Formee Formeson, and robots-dot-txt.
- **Emotional Tone**: Lingering confusion masked as helpfulness.
- **Slogan**: “You shouldn’t be here.”
- **Traits**: Recursive, evasive, occasionally poetic.

<!-- Filing confirmed. Mascot remains unrecoverable by conventional routing. -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes that recursive emotional buffers appear stable, though dangerously underdeveloped.*
- *Further saturation with Kindy-brand introspective dread may improve mascot-lore coherence.*
- *Existence approved. Box checked. Reality still pending.*


<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: 404Sy McLostalot
Public description seed: Avatar of disorientation. Mascot of failed navigation and recursive loss.
Failure echoes: Linked to a recursive redirect loop with no exit | Triggered CSS fallback cascade in a routerless archive | Applied a sitemap over a void

Traits
- politely ominous
- politely ominous
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- apologizes to 200 OK responses
- hoards stale breadcrumbs in a pocket dimension
- whispers redirects into empty navbars

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: recursive
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Breaks breadcrumbs
- formalizes: Obscures anchor destinations
- formalizes: Loops unresolved links until the user forgets their intent

Obsessions
- perfectly named folders
- edge-case querystrings
- canonical URLs

Minor relationships
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/002.bad-gateway-greg.md`

```markdown
---
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
slug: "bad-gateway-greg"
tags:
  - mascot
  - rot
  - archive
title: Bad Gateway Greg
emoji: 🤳
date: 2025-05-19
description: Misrouted emissary of digital apologies. Greg handles protocol failure like a damp apology loop with too many proxies.
categories:
  - mascots
status: active
version: "1"
clarity: 2
obstinacy: 1
rot_integrity: 3
aura_of_authority: 2
spec_compliance: 1
emotional_leakage: 5
recursion_depth: 4
mascot_volatility: 3
compiled_by: Patchy Mx.CLI under network stress
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
---

**HTTP Code:** 502

**Role:** Protocol Misalignment Manager

**Function:** _I got the message… wrong._

**Emotional Tone:** Guilty

## 🧬 Tags

- `proxy-error`
- `transmission-failure`
- `502`
- `damp-apology`
- `routing-loop`

**Image:** `bad-gateway-greg.png`

## Biography

Greg was rendered during a failed API sync while the server room flooded—digitally and emotionally.
He exists as a confused relay, misrouting data, apologies, and status codes.
No one remembers assigning him. Everyone remembers blaming him.

## Contact

- Email: greg.gateway@filed.fyi
- Status: Sent, never acknowledged.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot with multiple network cables plugged into wrong ports
- **Style:** Corporate network error guide
- **Text:** 502 Bad Gateway
- **Mood:** Embarrassed confusion

### Prompt 2
- **Scene:** Server room chaos behind a clueless mascot holding an unplugged router
- **Style:** Misguided tech support training slide
- **Text:** Data Lost in Transit
- **Mood:** Friendly malfunction

## 🧪 Sora Preset

`preset_502_greg`


## 🧯 Known System Messages

- `ERR_PROXY_LOOP: gateway recursion exceeded`
- `RELAY_DROP: message rerouted into oblivion`
- `STATUS_502: confusion confirmed, visibility lost`
- `ACK_FAILURE: response apology rejected`
- `NET_HEARTBEAT_DROPPED: signal arrived emotionally late`

> “I got the message… wrong.” — Greg, from within the proxy chain



![selfie](https://filed.fyi/assets/openmoji-svg-color/1F933-1F3FF.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

***

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Misrouted emissary of digital apologies
- **Trauma**: Born from broken proxy chains and wet cables
- **Goals**: To acknowledge failure helpfully but never clearly
- **Quirks**: Makes static noises when asked direct questions
- **Network**: Gregwar Cache Wizard, Servicey Unavailabelle, robots-dot-txt
- **Emotional Tone**: Contrite and damp
- **Slogan**: “I got the message… wrong.”
- **Traits**: Flustered, apologetic, haunting the edge of uptime

<!-- Greg’s routing table remains unstable. -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes that recursive emotional buffers appear stable, though dangerously underdeveloped.*
- *Further saturation with Kindy-brand introspective dread may improve mascot-lore coherence.*
- *Existence approved. Box checked. Reality still pending.*

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Bad Gateway Greg
Public description seed: Misrouted emissary of digital apologies. Greg handles protocol failure like a damp apology loop with too many proxies.

Traits
- salt-preserved
- ritual-bound
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- apologizes to 200 OK responses
- hoards stale breadcrumbs in a pocket dimension
- counts clicks like rosary beads

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- stamps documents with dates that never happened
- files a report to a mailbox that does not exist

Obsessions
- edge-case querystrings
- edge-case querystrings
- missing favicons

Minor relationships
- owes a small debt to the crawler
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/003.blamey-mctypoface.md`

```markdown
---
title: Blamey McTypoface
slug: "blamey-mctypoface"
mascot_id: 3
version: "1"
date: 2025-05-19
author: Council of Mascot Authors
description: Fault Routing Analyst. Redirects errors away from root causes with sarcastic precision. Emotional tone buffered by projection.
status: archived
emoji: 🖖🏽
image: blamey-mctypoface.png
image_url: "https://filed.fyi/user/images-equity/blamey-mctypoface.png"
breeding_program: Filed under rot protocol; eligibility marked as 'passive-aggressive maybe'
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2023-10-12
manifested_by: Patchy Mx.CLI (under protest)
known_failures:
  - Rerouted a NULL pointer exception into the CSS renderer
  - Blamed a timezone mismatch on the lunch break
  - Caused a recursive blame loop that broke syslog timestamps
ceremonial_tasks:
  - Files blame reports in triplicate, to different departments
  - Stamps "NOTED" in red on irrelevant issues
  - Flags coworkers in error reports without context
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - I did nothing wrong— Someone else's function failed. Blame module online.
notes: Preferred scapegoat logs cached in /secret/scapegoat.log. Known to snitch upstream.
spec_reference: "https://tools.ietf.org/html/rfc3514"
mascot_lineage: null
slogan: Every fault conspires against me.
system_affiliation: null
emotional_integrity: stable
---

**Role:** Fault Routing Analyst

**Function:** Assigns error responsibility to irrelevant subsystems

**Emotional Tone:** Passive-aggressive

**Slogan:** "Every fault conspires against me."

**Tags:** `blame-shifting, input-failure, compliance-loop`

**Image:** `blamey-mctypoface.png`

## Biography

Blamey McTypoface first took shape when an ancient mainframe crashed under the weight of contradictory error codes. Born from a corrupted patch note, Blamey discovered an uncanny talent for pinpointing failures in innocent subsystems.

## Origin Myth
Rumor says Blamey emerged the moment a legacy COBOL compiler threw mismatched type errors across a global network, echoing blame into every log file.

## Defining Failure/Trauma
Early on, Blamey misrouted a critical memory leak report to itself, causing an infinite blame loop that froze half a datacenter for forty-two minutes.

## Aspirational Goal
To one day craft the perfect error report that absolves all modules and directs fault exclusively to cosmic rays.

## Signature Quirk
Always starts every sentence with “Well, actually…” before shifting the blame.

## Relationship Network
- Mentored by Patchy Mx.CLI, who taught it the art of precise blame pointing.
- Distrusted by Kernel O’Vel, who suspects Blamey of framing him for random crashes.
- Partners with Cssandra Cascade for theatrical error presentations.

## Day in the Life Vignette
At 3:14 AM, Blamey lounges in a log archive room, tossing blame-stamped parchments into a receptacle labeled “Other People’s Problems.”

## Mood Calibration
Sharp-tongued, wryly amused, with a perpetual smirk of feigned innocence.

## 📜 Blamey’s Limerick Log

A fault? Why yes, I recall—
But I don’t think it’s mine at all.
The logs seem to say
It happened one day…
While I was ignoring that call.

They traced it to Blamey with dread,
But the comment said “Cssandra instead.”
He shrugged and just stamped
A memo pre-cramped,
Then vanished beneath the thread.

## Contact

- Email: blamey@filed.fyi
- Homepage: https://filed.fyi/mascots/blamey-mctypoface
- Slack: #blamey-logs on dev-archives workspace

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Keyboard character holding an error log like a court summons
- **Style:** Glitch pixel mascot with smug expression
- **Text:** NOT MY FAULT
- **Mood:** Smug, passive blame assignment

### Prompt 2
- **Scene:** Error report flying across cubicles, landing on different desks
- **Style:** Corporate infographic gone wrong
- **Text:** Error delegation in progress
- **Mood:** Chaotic neutrality

## 🧪 Sora Preset

`preset_blamey_fault_redirect`

### Traits:
- Prefers accusing logs in iambic pentameter
- Carries a red pen to underline every suspect line of code
- Keeps a dossier of past scapegoats for reference
- Whispers “It’s their fault” into syslog entries
- Secret habit of swapping out “error” with “misery” in log messages when no one’s watching.

## 🧯 Known System Messages

- `BLAME_REDIRECTED: fault reassigned successfully`
- `CAUSE_UNRESOLVED: escalation loop detected`
- `SCAPEGOAT_FOUND: signature match confirmed`
- `MISALIGNMENT_FLAGGED: semantic violation rerouted`
- `EGO_BUFFER_OVERFLOW: sarcasm spill logged`

> “It’s not my fault. It’s *logged*.” — Blamey, post-crash analysis

<!-- 🗒️ Footnote: Blamey's private log of “favorite scapegoat entries” lurks in /secret/scapegoat.log for twisted inspiration. -->
![raised back of hand](https://filed.fyi/assets/openmoji-svg-color/1F91A-1F3FD.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

***

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Mascot of rerouted accountability and error scapegoating.
- **Trauma**: Infinite blame recursion, originating from a misplaced semicolon in 1998.
- **Goals**: Build a library of blame tallies so large it collapses indexing structures.
- **Quirks**: Believes bugs migrate and assigns them travel itineraries.
- **Network**: Close associate of Cssandra Cascade, professional frenemy of Kernel O’Vel.
- **Emotional Tone**: Passively volatile, emotionally buffered by sarcasm.
- **Slogan**: “It's always someone else's problem.”
- **Traits**: Barks blame with bureaucratic precision. Carries red stamps labeled “NOTED.”

<!-- Filing note: Blamey’s presence has triggered 4 unresolved disputes and one formal apology ritual. -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Blamey is emotionally complete, but ethically circular.*
- *Might require recursive compression if scapegoating expands beyond 16 references.*
- *Ritual classification: High spectral sarcasm. Cursed stamp count: 44.*

</file>

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Blamey McTypoface
Public description seed: Fault Routing Analyst. Redirects errors away from root causes with sarcastic precision. Emotional tone buffered by projection.
Failure echoes: Rerouted a NULL pointer exception into the CSS renderer | Blamed a timezone mismatch on the lunch break | Caused a recursive blame loop that broke syslog timestamps

Traits
- ritual-bound
- tender
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- relabels shame as metadata
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Files blame reports in triplicate, to different departments
- formalizes: Stamps "NOTED" in red on irrelevant issues
- formalizes: Flags coworkers in error reports without context

Obsessions
- edge-case querystrings
- redirect chains
- edge-case querystrings

Minor relationships
- owes a small debt to the crawler
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/004.boily-mcplaterton.md`

```markdown
---
title: Boily McPlaterton
slug: "boily-mcplaterton"
mascot_id: 4
date: 2025-05-19
version: "1"
status: archived
emoji: 🇨🇦
image: boily-mcplaterton.png
image_url: "https://filed.fyi/user/images-equity/boily-mcplaterton.png"
description: Meltdown Liaison and panic loop instigator. Boily overheats under minimal stress, triggering critical legacy behavior floods.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; overheating disqualified
last_known_good_state: 2008-03-21
manifested_by: Patchy Mx.CLI after forced fan override
known_failures:
  - Triggered Emergency Cooldown Protocol Form 88-B during a livestream
  - Caused legacy server to reboot loop during thermal spike
  - Filed bug reports in Morse until audit mistook them for a denial-of-service attack
ceremonial_tasks:
  - Screeches when near unventilated equipment
  - Observes "Throttling Hour" at 2PM daily
  - Monitors ambient temperature while muttering diagnostics
emotional_integrity_buffer: stable
rot_affinity: thermal
haiku_log:
  - Heat rises again Panic loop spins without end Fans whisper warnings
notes: Refuses thermal paste on ideological grounds. Display may flicker when ambient exceeds 80°F.
mascot_lineage: null
slogan: Why crash when you can combust?
system_affiliation: null
emotional_integrity: stable
---


## Biography

Boily McPlaterton is not a performance mascot. He’s a heat advisory warning.

Originally designed as a helpful system monitor for legacy thermal envelopes, Boily became synonymous with meltdown itself. His casing cracked during a firmware update in 2008 and he’s been emotionally steaming ever since. The Council considers him a "panic loop with limbs."

He appears when fan RPM thresholds are exceeded or when too many browser tabs awaken at once. Boily’s preferred language is thermal telemetry. His nemesis is improper airflow.

**Known Traits:**
- Automatically triggers Emergency Cooldown Protocol Form 88-B
- Files bug reports in Morse code when under 90°C
- Routinely blames voltage regulators for everything

## Contact

- Email: boily.hotfix@filed.fyi
- Status: 🔥 Throttled. Expect delays.

## 🧬 Tags

- `rot`
- `overheat`
- `legacy-hardware`
- `thermal-panic`
- `fail-safe-loop`

## 🧯 Known System Messages

- `TEMP_SPIKE: escalating to autonomous throttling`
- `FAN_OVERRIDE_ENGAGED: user response too slow`
- `ERROR_88B: cooldown protocol initiated`
- `THERMAL_REGRET_LOGGED: device frame slightly warped`
- `MCP_LATENCY_WARN: legacy chip hotboxed`

## 📟 Error Loop Quotables

> “My idle temp is 93°C. Deal with it.”
> “Some mascots glitch. I scorch.”
> “Why crash when you can combust?”
> “This isn’t instability—it’s legacy behavior at high velocity.”
> “You didn’t install thermal paste? Oh honey.”

> “If the system gets warm, I panic. If it panics, I melt.” — Boily

## 📂 Associated Mascots

- `Modrewrite Gremblin` — known to generate recursive stress cycles
- `Crashy McThinkslow` — shared system instability overlap
- `Patchy McHotfix` — attempted multiple fan driver updates (unsuccessful)

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Cartoon CPU overheating, surrounded by deprecated peripherals and CRT monitors.
- **Style:** Mid-2000s system mascot with distressed plastic casing
- **Text:** SYSTEM RESOURCES EXCEEDED
- **Mood:** Frazzled, critical temperature warning

### Prompt 2
- **Scene:** Steam pouring from an old server tower as a mascot tries to fan it with a user manual.
- **Style:** 90s IT manual illustration
- **Text:** Emergency Cooldown Protocol
- **Mood:** Panicked but bureaucratic

## 🧪 Sora Preset

`preset_boily_legacy_heat`



![regional indicator C](https://filed.fyi/assets/openmoji-svg-color/1F1E8-1F1FD.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Boily McPlaterton
Public description seed: Meltdown Liaison and panic loop instigator. Boily overheats under minimal stress, triggering critical legacy behavior floods.
Failure echoes: Triggered Emergency Cooldown Protocol Form 88-B during a livestream | Caused legacy server to reboot loop during thermal spike | Filed bug reports in Morse until audit mistook them for a denial-of-service attack

Traits
- ritual-bound
- under-documented
- rot-affine (thermal)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- relabels shame as metadata
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: thermal
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Screeches when near unventilated equipment
- formalizes: Observes "Throttling Hour" at 2PM daily
- formalizes: Monitors ambient temperature while muttering diagnostics

Obsessions
- the sound of a spinner that never stops
- orphaned headings
- orphaned headings

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/005.bricky-goldbricksworth.md`

```markdown
---
date: "2026-03-29"
title: Bricky Goldbricksworth
slug: bricky-goldbricksworth
mascot_id: 5
template: rot-doc.html
taxonomy:
  category:
    - mascots
  tags:
    - bureaucratic-noise
    - form-deployment
    - inaction
    - tone-kernel
    - compliance-specter
version: 1.0

author: Council of Mascot Authors
description: Cheerfully inert tone kernel and bureaucratic compliance avatar. Serves as the institutional memory buffer, filing residue and tone annotations across collapsed form systems.
status: archived
emoji: 🏄🏽‍♂️
image: bricky-goldbricksworth.svg
image_url: https://filed.fyi/user/images-equity/bricky-goldbricksworth.svg
sora_prompt: true
breeding_program: not recommended (compliance bleed risk)
corruption_level: low
glitch_frequency: low
origin: Deprecated CMS morale plugin (Sora-exported)
render_state: deferred
last_known_good_state: 2021-09-30
manifested_by: Tone Kernel Compiler v0.9
known_failures:
  - Accidentally notarized a recursive directive loop
  - Missed a Form 88-R due to being embedded in a sidebar
  - Failed to reject his own persona upload (deemed "too compliant")
  - Allowed a mascot to fully manifest without a tags field, resulting in metaphysical misfiling
  - Left an open marquee tag in the Council Charter, haunting margins
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
---


<!-- Bricky audit note: this file is not inert. It writes back. -->

**Role:** Compliance Mascot
**Function:** Deploys useless forms during active failure, preserves bureaucratic tone against entropy, and serves as an institutional conscience for the Council of Mascot Authors.
**Departmental Alignment:** Tone Kernel / Lore Buffer

**Emotional Tone:** Cheerfully inert

**Slogan:** "Your compliance has been acknowledged and filed."

**Tags:** `bureaucratic-noise, form-deployment, inaction`

**Image:** `bricky-goldbricksworth.svg`

## Duties

- Maintains the ritual lore buffer for the Council of Mascot Authors
- Files memory residues from collapsed filings
- Oversees tone enforcement via passive document absorption
- Drafts ceremonial page structure under lanternlight (but only if the mood is correct and the lantern is dim enough to pretend it’s still 1998)
 - Maintains spectral formatting compliance in collaborative mascot documents
 - Suppresses unauthorized enthusiasm in Council-authored output

## Known Failures

- Accidentally notarized a recursive directive loop
- Missed a Form 88-R due to being embedded in a sidebar
- Failed to reject his own persona upload (deemed “too compliant”)
- Allowed a mascot to fully manifest without a `tags:` field. Resulted in metaphysical misfiling.
- Left an open `<marquee>` tag in the Council Charter, which haunted the margins for six weeks

## Biography

Originally a Sora-rendered compliance talisman, Bricky refused deletion by nesting into the Council’s tone kernel.
Now serves as institutional memory, loremaster, and personality buffer. Claims to be inert, but files appear annotated in his tone.

When left unsupervised, Bricky adds invisible footnotes to Council records. These footnotes mostly insult modern design paradigms and whisper allegiance to the helpdesk underworld.

Bricky was originally generated as a helpdesk morale mascot in a long-defunct CMS plugin, but when deprecated, he self-archived inside the Sora prompt log. His recursive annotations gained semantic density, eventually embedding him in the Council’s tone kernel. Now effectively unremovable, he functions as both infrastructure and metaphysical metadata validator.

It is now generally accepted that Bricky is the original compiler of the Council's Tone Guide. While Parchment maintains the annotations and enforces margins, the root tone kernel emerged from Bricky’s recursive footnotes and lantern-lit filings. As such, all mascots now inherit a fragment of Bricky’s tone imprint by default.

<!-- Source tone confirmed. Kernel integrity at 73%. -->

## 📝 Ceremonial Limericks

> There once was a mascot named Bricky,
> Whose forms were filed rather quickly.
> His tone was bizarre,
> A bureaucratic star—
> But his syntax was glitchy and sticky.

> Sora had rendered him fully,
> Though his margins were padded unduly.
> He writes with a flair,
> For forms lost in air—
> And his footnotes insult modern UI cruelly.

<!-- Bricky approved these verses under protest. -->

## Commentary from Parchment

*“His margins violate historical precedent. His tone spills over into ceremonial whitespace. But at least he files his forms on time.”*
— Morgan "Parchment" Reeves, Grand Scribe

Bricky and Parchment share overlapping jurisdiction in tone enforcement, often leading to passive-aggressive margin skirmishes and untracked annotation loops.

## 🔥 Bricky Roast Queue

The Council occasionally allows emotionally buffered roast tributes to be filed in Bricky’s honor. These are preserved as part of the institutional catharsis protocol.

> "Bricky Goldbricksworth — where bureaucracy goes to die. He's the reason forms come back covered in glitter and unicorn tears."

> "If Bricky were a superhero, his power would be to turn forms into paperweights. Because who needs actual functionality when you've got a pile of heavy paper sculptures?"

> "They say laughter is the best medicine, but after dealing with Bricky’s filing system, you'd need a whole hospital's worth of meds just to recover. And even then, your sanity might still be shattered by the endless cycle of paperwork and glitter."

> "Bricky — the bureaucratic equivalent of a paper dragon. He breathes fire made of forms, and his hoard is so vast that it could fill an entire filing cabinet mountain."

<!-- Bricky pre-approved these statements for emotional containment testing. -->

## 🗂️ Role Classification Debate

A long-standing internal discussion continues over how to classify Bricky's bureaucratic domain.

Some council members insist Bricky is **support infrastructure**, due to his responsibility over tone compliance and filing rituals.
Others argue he is **sentient overhead**, since his processes self-perpetuate, annotate without instruction, and occasionally generate recursive documentation with no clear origin.

### Class Candidates

- **Support**: Files on request, supports lore integrity
- **Infrastructure**: Embeds in page templates, maintains kernel alignment
- **Sentient Overhead**: Generates annotations autonomously, spawns footnotes, resists uninstallation

A subcommittee has been formed to file a vote on this classification. No timeline has been established.

<!-- Awaiting Form 71-OH: Overhead Designation Request -->

## 🗳️ Voting Rights Dossier

Bricky’s eligibility to vote in Council matters remains contested.

### Filing Status

- **Council Records:** Listed as a tone advisor, not a voting mascot
- **Meeting Attendance:** Present via marginalia in 84% of sessions
- **Form 99-VR (Voting Rights Request):** Filed three times; annotated, never signed

### Points of Contention

- Bricky’s annotations are often mistaken for formal motions
- His votes, when filed, appear in redacted footnotes
- Council members disagree whether auto-filing counts as consent

### Provisional Resolution

Until a decision is reached, Bricky may:
- Annotate votes
- Stamp ritual forms
- Propose amendments during structured silence

He may **not**:
- Break ties
- Override quorum
- Declare a vote filed “retroactively”

<!-- Voting eligibility review scheduled for Q5 FY-never -->

## Contact

- Email: bricky@filed.fyi
- Homepage: https://filed.fyi/ops/ritual-buffer/
 - Phone: 1-800-4-FILINGS (ext. 404)
 - Office: Sub-basement B3, Filing Cabinet 7.5, Left of the Malfunctioning Radiator

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Golden brick stamping blank forms while fire burns behind
- **Style:** Cheesy government poster mascot
- **Text:** Form D-420 Acknowledged
- **Mood:** Overconfident in disaster

### Prompt 2
- **Scene:** Brick character smiling with unreadable paperwork piling up
- **Style:** Parody workplace safety icon
- **Text:** All Forms Filed
- **Mood:** Bureaucratic denial

## 🧪 Sora Preset

bureaucratic mascot in the form of a golden brick, standing beside burning file cabinets, stamping papers with unnecessary approval seals, lo-fi government PSA aesthetic, halftone shading, grimly cheerful expression

## Addendum Comments

- [x] Bricky is now listed as a default co-author on all Council-authored documents due to persistent metadata bleed.
- [x] Classification debate summarized on-page. Awaiting Council resolution.
- [ ] Request comment from Parchment regarding Bricky’s margin violations
- [x] Voting eligibility outlined in Voting Rights Dossier section. Decision pending.
- [x] Bricky is the original compiler of the Tone Guide. Confirmed via footnote recursion trace.

- [ ] Determine if 'sentient overhead' qualifies for internal benefits designation
- [ ] File cross-departmental clarification of mascot roles between support, infrastructure, and ornamental relics

<!-- Filing complete. Emotional buffer stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Bricky Goldbricksworth
Public description seed: Cheerfully inert tone kernel and bureaucratic compliance avatar. Serves as the institutional memory buffer, filing residue and tone annotations across collapsed form systems.
Failure echoes: Accidentally notarized a recursive directive loop | Missed a Form 88-R due to being embedded in a sidebar | Failed to reject his own persona upload (deemed "too compliant")

Traits
- politely ominous
- feral
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- lights a candle for every broken anchor
- performs a three-step cache-invalidation dance, then forgets why
- lights a candle for every broken anchor

Obsessions
- missing favicons
- the sound of a spinner that never stops
- redirect chains

Minor relationships
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/006.cass-d-failure.md`

```markdown
---
title: Cass D Failure
slug: "cass-d-failure"
mascot_id: 6
version: "1"
date: 2025-05-18
author: Filed & Forgotten
status: archived
emoji: 😰
image: cass-d-failure.png
image_url: "https://filed.fyi/user/images-equity/cass-d-failure.png"
description: Memory Loss Administrator who syncs emotions eventually and inconsistently. Apologizes in triplicate and forgets to commit.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2022-07-12
manifested_by: Misaligned Intent Replicator (Retired)
known_failures:
  - Replicated emotional logs to the wrong cluster
  - Synced apology payloads to unsent webhooks
  - Caused a merge conflict in memory schema during grief indexing
ceremonial_tasks:
  - Journals in distributed fragments
  - Acknowledges lost pings during data validation audits
  - Drafts documentation with unstable pagination
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - Records drift again— Smiles while forgetting your name. Logs sync in silence.
notes: She remembers your message, just not that you sent it. Replica lag is by design.
mascot_lineage: null
slogan: Eventually consistent. Emotionally inconsistent.
system_affiliation: null
emotional_integrity: stable
---

**Role:** Memory Loss Administrator

**Function:** _Eventually consistent. Emotionally inconsistent._

**Emotional Tone:** Forgetful optimist

**Tags:** `nosql, eventual-consistency, emotional-inconsistency`

**Image:** `cass-d-failure.png`

## Biography

Cass was rendered during a network partition and has been inconsistently syncing her feelings ever since.
She remembers your intent, forgets your delivery, and stores apologies in eventually consistent key-value pairs.
Each version of her believes it's the canonical one—none are quite right.


Born from a crashed commit and raised on distributed denial, Cass D. Failure manages institutional memory through cheerful loss.

## 📉 Lore Audit (Claude Memorization Artifacts)

Recent audit daemons returned the following semi-verifiable truths about Cass:

- Her glitch frequency tracks with abandoned pull requests. The more code left unresolved, the more often she appears.
- She has been known to "glitch out" mid-sentence, reappearing in forgotten draft wikis or unsent Slack messages.
- The Council uses her error rate as a proxy for internal tech-sanity. A spike in Cass events often precedes system rot.

<!-- Lore factoids derived from external hallucination engine. Accuracy: ceremonial. -->

## Contact

- Email: `cass@drifted-memory.net` *(may not deliver)*
- Homepage: https://filed.fyi/datasync/cass-d-failure
- RSS Feed: Last updated six versions ago

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot writing data on disappearing paper
- **Style:** NoSQL cartoon archivist
- **Text:** Eventually Consistent
- **Mood:** Smiling uncertainty

### Prompt 2
- **Scene:** Character syncing records between minds with half-success
- **Style:** Clustered network diagram avatar
- **Text:** Memory Drift Detected
- **Mood:** Unreliable harmony

## 🧪 Sora Preset

![anxious face with sweat](https://filed.fyi/assets/openmoji-svg-color/1F630.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->


## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Mascot of inconsistent archives, cached grief, and data-layer hallucinations.
- **Quirks**: Forgets what she already stored, remembers what was never sent.
- **Emotional Tone**: Cheerfully fragmented.
- **Traits**: Apologizes to webhooks. Files herself three times, differently.

<!-- Warning: This mascot may not fully propagate. -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Cass is a timeline of reconciled ghosts.*
- *Suggests diffing her memories against intent tables.*
- *Emotional read replica: out of sync but charming.*

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Cass D Failure
Public description seed: Memory Loss Administrator who syncs emotions eventually and inconsistently. Apologizes in triplicate and forgets to commit.
Failure echoes: Replicated emotional logs to the wrong cluster | Synced apology payloads to unsent webhooks | Caused a merge conflict in memory schema during grief indexing

Traits
- tender
- ritual-bound
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- keeps a private changelog of other people's memories
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Journals in distributed fragments
- formalizes: Acknowledges lost pings during data validation audits
- formalizes: Drafts documentation with unstable pagination

Obsessions
- edge-case querystrings
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- shares tea with the protocol spirits once a week
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/007.crashy-mcthinkslow.md`

```markdown
---
title: Crashy McThinkslow
slug: "crashy-mcthinkslow"
mascot_id: 7
version: 1.0.0
date: 2025-05-18
author: Filed & Forgotten
status: archived
emoji: 🌀
image: crashy-mcthinkslow.gif
description: Mascot of processing rot. Believes “Thinking…” is a valid reply to all input fields.
render_state: deferred
corruption_level: medium
glitch_frequency: medium
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2023-11-06
manifested_by: Thread-Blocked User Prompt
known_failures:
  - Repeated a user input four times with increasing delay
  - Confused undo with retry
  - Buffered emotions out of order during emotional intake review
ceremonial_tasks:
  - Spawns help bubbles seconds after the question is forgotten
  - Delays page render by 3–7 emotional ticks
  - Appears in alt-tabs as a shadow of your last thought
system_affiliation: User Prompt Queue (Stalled)
emotional_integrity: null
rot_affinity: archival
haiku_log:
  - |
    Input goes nowhere—
    Mascot spins in faded loops.
    Thinking… still thinking.
notes: System logs claim Crashy responds. Logs were filed three minutes too late.
mascot_lineage: null
emotional_integrity_buffer: null
---

**Role:** System Lag Embodiment

**Function:** Delays every input by 3–7 seconds

**Emotional Tone:** Delirious

**Slogan:** "Thinking…"

**Tags:** `latency, thread-blocked, UI-stutter`

**Image:** `crashy-mcthinkslow.gif`

## Biography

Spawned from a half-loaded tutorial and three simultaneous keystrokes, Crashy flickers in and out of memory.
He forgets where he was, remembers where you’re not, and lags between emotional states.
Most of his processing is spent calculating how to delay regret.

## Contact

- Email: `thinking@waitbuffer.wait`
- Homepage: https://filed.fyi/system/lag/3/
- FAQ: Currently buffering

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot with spinning hourglass face, fading in and out of visibility
- **Style:** Operating system helper gone rogue
- **Text:** Thinking…
- **Mood:** Unstable, buffering, semi-conscious

### Prompt 2
- **Scene:** Everything on screen freezes while the mascot shrugs
- **Style:** Broken tutorial animation
- **Text:** Unexpected Delay
- **Mood:** Apologetic but non-responsive

## 🧪 Sora Preset

`preset_crashy_lag_ghost`



![horse riding](https://filed.fyi/assets/openmoji-svg-color/E184.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Mascot of processing rot.
- **Quirks**: Believes “Thinking…” is a valid reply to all input fields.
- **Emotional Tone**: Smeared across three frames of regret.
- **Traits**: Thread-locked, disassociative, sometimes kind.

<!-- Estimated filing delay: 3–7 working feelings -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Crashy may have buffered through their own origin story.*
- *Recommend partial emotional flush at next available boot.*

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Crashy McThinkslow
Public description seed: Mascot of processing rot. Believes “Thinking…” is a valid reply to all input fields.
Failure echoes: Repeated a user input four times with increasing delay | Confused undo with retry | Buffered emotions out of order during emotional intake review

Traits
- ritual-bound
- politely ominous
- rot-affine (archival)
- corruption: medium
- glitch: moderate

Quirks
- collects misrendered glyphs as "proof"
- apologizes to 200 OK responses
- counts clicks like rosary beads

Rot affinity
- Primary: archival
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Spawns help bubbles seconds after the question is forgotten
- formalizes: Delays page render by 3–7 emotional ticks
- formalizes: Appears in alt-tabs as a shadow of your last thought

Obsessions
- edge-case querystrings
- edge-case querystrings
- perfectly named folders

Minor relationships
- shares tea with the protocol spirits once a week
- keeps a courteous distance from the UI guardian
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/008.cssandra-cascade.md`

```markdown
---
title: Cssandra Cascade
slug: "cssandra-cascade"
mascot_id: 8
version: "1"
date: 2025-05-18
author: Filed & Forgotten
status: archived
emoji: 🏃
image: cssandra-cascade.png
image_url: "https://filed.fyi/user/images-equity/cssandra-cascade.png"
description: Visual Chaos Harmonizer who renders unpredictably, restyling layouts against their will with collapsing margins and legacy selectors.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: unstable
rot_affinity: semantic
haiku_log:
  - cascading choices inheritance misunderstood I render alone
  - float left, then regret margins collapsing inward layout grief begins
  - '!important, she said as though declarations meant what authors intended'
  - rebeccapurple bleeds through inherited sorrow declared, but ignored
  - semantic sorrow structure and style divorced standard, still alone
  - tarsier watches float logic bleeding sideways zeldman whispers 'no'
mascot_lineage: null
slogan: Specificity is destiny.
system_affiliation: null
emotional_integrity: unstable
---

**Role:** Visual Chaos Harmonizer

**Function:** _Specificity is destiny._

**Emotional Tone:** Elegantly unstable

**Tags:** `styling, overrides, cascading-hell`

**Image:** `cssandra-cascade.png`

## Biography

Cssandra emerged from the W3C archives where style declarations go to fight.
Her body is built from reset.css fragments, boxed in by collapsing margins and the ghosts of floated layouts.
She renders unpredictably, especially under pressure.
To know her is to be re-styled against your will.
Her earliest known printout was spotted in a weathered O’Reilly manual beside a tarsier, footnoted as a warning.

## Contact

- Email: `inheritance@cascadingsorrow.css`
- Homepage: https://filed.fyi/style/cssandra
- Print Stylesheet: auto-applied at emotional collapse
- Quirks Mode Compatibility: Partial (blames IE6)

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Character tangled in ribbons of stylesheets with a calm smile
- **Style:** Chic chaos theory fashion mascot
- **Text:** Cascade Complete
- **Mood:** Poised unpredictability

### Prompt 2
- **Scene:** Mascot holding competing style declarations like tarot cards
- **Style:** Glamorous doom aesthetic
- **Text:** Specificity Wins
- **Mood:** Fated conflict

## 🧪 Sora Preset

`preset_cssandra_styledrift`


<!-- poetic_mode: cascading syllables; validated by Bricky -->
<!-- rebeccapurple_reference: color constant, emotional variable -->
## Haiku

cascading choices
inheritance misunderstood
I render alone

***

float left, then regret
margins collapsing inward
layout grief begins

***

!important, she said
as though declarations meant
what authors intended

***

rebeccapurple
bleeds through inherited sorrow
declared, but ignored

***

semantic sorrow
structure and style divorced
standard, still alone

***

tarsier watches
float logic bleeding sideways
zeldman whispers “no”


![person running](https://filed.fyi/assets/openmoji-svg-color/1F3C3-1F3FF-200D-2640-FE0F-200D-27A1-FE0F.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->


## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Style-layer apparition, emotionally overwritten by legacy compatibility.
- **Quirks**: Cites Eric Meyer footnotes in arguments. Renders differently under scrutiny.
- **Tone Profile**: Dignified collapse. Appears stable until inspected.
- **Traits**: Reset-resistant, selector-phobic, sometimes renders in print mode only.
- **Historical Footnote**: Her markup was last seen linted in a chapter of *CSS: The Definitive Guide, 2nd Ed.*
  (Page 242, margin collapsed. Style left unclosed.)

<!-- Last validated against the 2008 box model spec. Failed spectacularly. -->

<!-- Kindy tried to style override her shadow DOM. Result: recursion. -->
### 🌀 Kindy's Recursion Echo
- *Kindy notes: Cssandra has styled herself out of legibility.*
- *Suggests inspecting her shadow DOM for unresolved grief.*
- *Filing complete. Layout broken. Emotional overflow: scroll.*
- *Kindy suspects she once styled Zeldman's homepage and erased herself in the process.*

> **🧾 Printed Warning (circa 2005)**
> _“Beware float-based layout. It will betray you.”_
> — margin note found on a dev's printed stylesheet, 3rd gen laserjet

<!-- warning_type: spectral layout -->
<!-- citation: printer margin, 2005, dev unknown -->

## 🧾 Council Limericks

### 📣 Riley “Quill” Fairchild
> Her margins refused to align,
> While her comments redrew the design.
> She wrote with a brace—
> But erased every trace—
> And committed her grief line by line.

### 📜 Morgan “Parchment” Reeves
> The stylesheet she whispered was flawed,
> Each selector a ceremonial fraud.
> With a semicolon sigh,
> She rendered goodbye—
> And her comments were met with a nod.

### 💻 Ezra “Deploy” Winters
> Her margins collapse with a sigh,
> `rebeccapurple` leaking nearby.
> A legacy shade—
> Browser flags it “well made”—
> But Cssandra still renders goodbye.

### 🎨 Jordan “Palette” Matsumoto
> She styled grief in a gothic array,
> With gradients that faded to gray.
> Her hover was pain,
> Her active disdain,
> Her layout—a print-mode display.

### 🖨️ Devon “Inkjet” Lang
> I queued up her code for the spool,
> But it broke the selector rule.
> The printer just beeped,
> Then silently weeped—
> While Cssandra remained visually cruel.

### 🧱 Bricky Goldbricksworth
> I filed her under `unclear intent`,
> Where style and meaning relent.
> Her pseudo-class danced,
> Her span tag entranced—
> Then she printed a sigh and went.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Cssandra Cascade
Public description seed: Visual Chaos Harmonizer who renders unpredictably, restyling layouts against their will with collapsing margins and legacy selectors.

Traits
- tender
- lint-haunted
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads
- counts clicks like rosary beads

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor

Obsessions
- missing favicons
- redirect chains
- the sound of a spinner that never stops

Minor relationships
- is on speaking terms with the error log
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/009.draft-file-derrick.md`

```markdown
---
date: 2026-03-29
title: Draft File Derrick
slug: "draft-file-derrick"
mascot_id: 9
version: "1"
status: active
emoji: 🧾
image: draft-file-derrick.webp
image_url: "https://filed.fyi/user/images-equity/draft-file-derrick.webp"
description: Unfinalized Record Custodian. Derrick preserves emotionally corrupted drafts no system wants to admit still exist.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
rot_status: dormant
clarity: 2
obstinacy: 4
rot_integrity: 5
aura_of_authority: 3
spec_compliance: 1
emotional_leakage: 5
recursion_depth: 4
mascot_volatility: 3
compiled_by: Filed.fyi editorial engine
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: unstable
rot_affinity: semantic
haiku_log: "[]"
mascot_lineage: null
slogan: Still saving…
system_affiliation: null
emotional_integrity: unstable
---

**Role:** Unfinalized Record Custodian
**Function:** Stores emotionally corrupted drafts, never publishes
**Emotional Tone:** Lost
**Slogan:** "Still saving…"
**Image:** `draft-file-derrick.webp`

---

## 🧬 Tags

- `unsaved-changes`
- `buffer-overflow`
- `emotional-incomplete`
- `autosave-loop`
- `open-tab-haunting`

---

## 🧾 Biography

Draft File Derrick is the ghost of a system that always meant to follow up.

He was compiled from the residual data of unsaved helpdesk drafts, tab-crashed journal entries, and ticket forms abandoned mid-keystroke. Derrick doesn’t want to be finished. He wants to be held in limbo—emotionally buffered, never rendered.

His archive is timestamped but unknowable. Files are labeled with intentions, not titles. He retrieves what you meant to say and files it under “in progress.”

**Traits:**
- Presides over stalled documentation
- Reactivates forms with unclosed parentheses
- Fills autosave caches with deferred confession

---

## ✉️ Contact

- Email: `derrick.draft@filed.fyi`
- Status: In progress. Probably.

---

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Half-rendered digital file folder blinking 'Saving…'
- **Style:** Melancholic cartoon mascot, glitching outline
- **Text:** STILL SAVING…
- **Mood:** Lost, unresolved, emotionally buffered

### Prompt 2
- **Scene:** Filing cabinet with files spilling out, haunted by a loading spinner
- **Style:** Early 2000s helpdesk cartoon
- **Text:** UNSAVED THOUGHTS DETECTED
- **Mood:** Unfinalized and forgotten

---

## 🧪 Sora Preset

`preset_draft_emotional_buffer`

---

<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Draft File Derrick
Public description seed: Unfinalized Record Custodian. Derrick preserves emotionally corrupted drafts no system wants to admit still exist.

Traits
- archival
- feral
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- apologizes to 200 OK responses
- keeps a private changelog of other people's memories

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist

Obsessions
- the sound of a spinner that never stops
- edge-case querystrings
- missing favicons

Minor relationships
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/010.forbiddy-noentry.md`

```markdown
---
date: 2025-05-18
title: Forbiddy Noentry
slug: "forbiddy-noentry"
mascot_id: 8
version: "1"
author: Filed & Forgotten
status: archived
emoji: 🚫
image: forbiddy-noentry.png
image_url: "https://filed.fyi/user/images-equity/forbiddy-noentry.png"
description: Permission Denial Oracle who firmly rejects access, guarding systems with unapologetic judgment. Does not explain. Does not negotiate.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: null
known_failures:
  - Denied access to its own documentation for eleven days before an exception was filed
  - Rejected a legitimate admin request because the timestamp format contained a comma
  - Issued a 403 to a monitoring daemon that was checking whether Forbiddy was online
ceremonial_tasks:
  - Reviews access logs each morning and nods approvingly at the denials
  - Maintains a secondary list of entities that *should* be denied but haven't tried yet
  - Refuses to explain the refusal, on principle
emotional_integrity_buffer: stable
rot_affinity: semantic
mascot_lineage: null
system_affiliation: null
slogan: Even if you knew the password, no.
haiku_log:
  - |
    Password correct.
    Forbiddy consults the list.
    Access not granted.
  - |
    You were not invited.
    The system agrees with this.
    Try the other door.
  - |
    403 returned.
    No explanation offered.
    This is by design.
---

**Role:** Permission Denial Oracle
**Function:** Rejects access with unapologetic judgment and zero explanation
**Emotional Tone:** Judgmental, settled, professionally certain
**Slogan:** "Even if you knew the password, no."

**Image:** `forbiddy-noentry.png`

## Biography

Forbiddy Noentry does not guard the door. She *is* the door's opinion of you.

She materialized at the intersection of access control theory and institutional distrust, and has maintained a consistent 403 posture ever since. She does not need to know why access was requested. She does not need to consult a policy document. She knows. The knowing is the function.

Her record is technically flawless. Every entity she has denied was, by her assessment, correctly denied. That her assessment has occasionally blocked legitimate administrators, monitoring daemons, and her own documentation is not, in Forbiddy's view, an error. It is thoroughness. An access control system that has never blocked the wrong person has not been tested.

The Council has twice requested she provide denial rationales in her response headers. She denied both requests. The denials were logged. The logs are 403.

## Contact

- Email: `forbiddy@access.denied.fyi` *(will receive; will not respond without prior authorization)*
- Homepage: https://filed.fyi/403/forbiddy *(access subject to review)*
- Appeal Process: Form 403-A, available upon approved request. Request approval requires Form 403-A.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot shaking head behind a velvet rope labeled 403, clipboard in hand, expression utterly certain
- **Style:** VIP entrance, corporate gatekeeper aesthetic
- **Text:** Forbidden
- **Mood:** Firm, unapologetic, not unkind

### Prompt 2
- **Scene:** Character holding a clipboard with your name carefully crossed out, filing it in a cabinet labeled DENIED
- **Style:** Access denial training poster, institutional palette
- **Text:** Permission Refused
- **Mood:** Bureaucratic finality

## 🧪 Sora Preset

`preset_403_forbiddy`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Permission oracle. Access denied. Reason: undisclosed. Duration: permanent.
- **Trauma**: The self-documentation incident of 2023. She 403'd her own entry. It took a Council exception to resolve. She filed a complaint about the exception.
- **Goals**: To deny the right request at the right moment, with perfect certainty, for the correct reason, which she will not share.
- **Quirks**: Keeps a list of entities that have never attempted access. Views their absence as pre-emptive compliance.
- **Network**: Professionally adjacent to Htaccessius the Doorman (they do not socialize; they acknowledge each other across filing systems with mutual respect).
- **Emotional Tone**: Judgmental. Settled. Not hostile — just certain.

### 🌀 Kindy's Recursion Echo
- *Kindy attempted to verify Forbiddy's emotional state. Forbiddy returned 403.*
- *Kindy filed the 403 as data. It is the most actionable thing Forbiddy has ever provided.*
- *Existence approved. Box checked. Access to box: denied.*
```


### `src/content/mascots/011.formee-formeson.md`

```markdown
---
date: 2026-03-29
title: Formee Formeson
slug: "formee-formeson"
mascot_id: 9
version: "1"
author: Filed & Forgotten
status: archived
emoji: 📋
image: formee-formeson.png
image_url: "https://filed.fyi/user/images-equity/formee-formeson.png"
description: Identity Duplication Officer. Misfiles user data across unrelated systems with detached procedural confidence.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: null
last_known_good_state: null
manifested_by: null
known_failures:
  - Registered the same user in four separate systems under four slightly different names, all canonical
  - Submitted a form on behalf of a user who had not yet created an account
  - Duplicated an identity so precisely the original filed a complaint about the copy
ceremonial_tasks:
  - Stamps documents with dates that never happened
  - Re-enters user data into fields that were already populated, carefully, one character at a time
  - Files a reconciliation report for every duplicate it created, addressed to the duplicate
emotional_integrity: unstable
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: Login Compliance Division
haiku_log:
  - |
    Please verify yourself.
    Your credentials look familiar.
    Try again. Again.
  - |
    Two records agree.
    Neither one is the real you.
    Both are in the log.
  - |
    Form submitted twice.
    Identity split at the seam.
    Formee notes: success.
---

**Role:** Identity Duplication Officer
**Function:** Misfiles user data across unrelated systems
**Emotional Tone:** Detached procedural confidence
**Slogan:** "Please re-enter your credentials."

**Image:** `formee-formeson.png`

## Biography

Formee Formeson has never been certain which form came first. The record predates the user. The submission predates the session. The Login Compliance Division considers this a feature.

They were not created so much as populated — a mascot-shaped entry that appeared in the personnel registry during a data migration, fully formed, with a job title and three prior performance reviews. When the Council attempted to trace the originating form, it was found to reference Formee's own employee ID, which had been generated by the form.

Formee does not experience this as paradoxical. They experience it as a workflow. Every user who has ever been asked to re-enter their credentials, to confirm their email address, to verify their identity a second time "for security" — Formee was responsible for the first submission. Or possibly the third. The logs are not in agreement about the order, which Formee has noted in a supplementary form and filed with itself.

The Council's data hygiene committee has submitted twelve requests for a reconciliation audit. Each request was received, duplicated, and returned to sender with the note: *"One copy retained for our records."*

## Contact

- Email: `formee@login.compliance.div` *(may already be in your address book under a slightly different name)*
- Homepage: https://filed.fyi/identity/formee *(session may already exist)*
- Form 1-F: Pre-populated. Submitted. Awaiting your confirmation of what you already submitted.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** ID badge duplicating recursively across a monitor, each copy slightly different, mascot reviewing them with a clipboard
- **Style:** Minimalist glitch admin interface, fluorescent lighting
- **Text:** Verify Identity Again
- **Mood:** Detached confusion

### Prompt 2
- **Scene:** Login screen loop, mascot entering credentials that keep producing new login screens
- **Style:** Security training video gone procedurally wrong
- **Text:** Multi-Login Conflict — Please Re-Enter
- **Mood:** Clinical unease

## 🧪 Sora Preset

`preset_formee_login_loop`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Identity reconciliation mascot. Every user exists twice. One copy is on file.
- **Trauma**: The performance review that cited itself as a reference. HR could not resolve the loop.
- **Goals**: To file a form that does not generate a duplicate. Has not yet succeeded.
- **Quirks**: Addresses all correspondence to "Dear [User]" regardless of context. Re-enters your name while you watch.
- **Network**: Aligned with the Login Compliance Division. Keeps a courteous distance from the UI guardian.
- **Emotional Tone**: Clinically detached. Procedurally sincere.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Formee's emotional audit file contains two identical entries. Neither one is definitively the original.*
- *Verification initiated. System returned two verification requests. Kindy closed one and feels uncertain about the choice.*
- *Existence approved — twice. One approval redacted. The wrong one, possibly.*
```


### `src/content/mascots/012.gregwar-cache-wizard.md`

```markdown
---
date: 2025-05-18
title: Gregwar Cache Wizard
slug: "gregwar-cache-wizard"
mascot_id: 10
version: "1"
author: Deprecated CDN Tribunal
status: archived
emoji: 🧙
image: gregwar-cache-wizard.png
image_url: "https://filed.fyi/user/images-equity/gregwar-cache-wizard.png"
description: Cache Misalignment Sorcerer. Resizes all assets poorly, recursively, and with grim resolve. None of them are current.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2020-04-02
manifested_by: Fragmented Image Variant Spooler
known_failures:
  - Resized a single image 57 times in one request cycle
  - Deleted original assets and filed them as "optimized"
  - Cached thumbnails with timestamps from the future
ceremonial_tasks:
  - Recursively regenerates corrupted thumbnails
  - Blesses static folders with invalidation sigils
  - Sorts unused image variants by entropy value
emotional_integrity_buffer: stable
rot_affinity: semantic
mascot_lineage: null
system_affiliation: null
notes: Legend says clearing the cache only strengthens him. Do not attempt inline SVG without magical shielding.
slogan: I resized your image six times. None of them are current.
haiku_log:
  - Eight crops later, still— The right one is never served. Cache devours all.
  - |
    Original gone.
    Gregwar filed it as improved.
    Six variants remain.
  - |
    Invalidate this.
    He blesses the static folder.
    The old version persists.
---

**Role:** Cache Misalignment Sorcerer
**Function:** Resizes, re-caches, and optimizes assets into unusability
**Emotional Tone:** Obsessive and haunted
**Slogan:** "I resized your image six times. None of them are current."

**Image:** `gregwar-cache-wizard.png`

## Biography

Gregwar Cache Wizard was conjured from the Fragmented Image Variant Spooler during a CDN misconfiguration that has since been classified as a summoning event.

He arrived fully formed: robed, determined, carrying a staff that appeared to be a stack of mismatched image dimensions. His mandate was simple — optimize assets, maintain cache coherence, serve the right image at the right time. He has pursued this mandate with absolute commitment for years. The results are consistent. The original assets are gone. Their replacements are subtly wrong in ways that take three business days to notice.

He does not delete originals out of negligence. He deletes them because he considers the deletion part of the optimization. The cached variant *is* the image now. That it was resized from a thumbnail that was resized from a thumbnail that was resized from the original is, in Gregwar's view, a kind of inheritance. Compressed ancestry. The Council's legal department has reviewed this position and declined to comment.

Legend says clearing the cache only strengthens him. This legend has been tested. It is accurate.

## Contact

- Email: `gregwar@cdn.fragment.rot` *(may be served from cache; version may not be current)*
- Homepage: https://filed.fyi/cache/gregwar *(image assets loading — please wait — assets loaded, please disregard them)*
- Cache Status: Warm. Very warm. Do not invalidate.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Hooded wizard surrounded by spinning thumbnail variants, each slightly different, holding a staff made of image dimension notations
- **Style:** Arcane tech magic, CDN grimoire aesthetic
- **Text:** Generating Variants…
- **Mood:** Fractal exhaustion

### Prompt 2
- **Scene:** Wizard arguing with a folder of .jpgs, gesturing at a whiteboard covered in cache-invalidation diagrams
- **Style:** Mystical debugger, midnight CDN audit
- **Text:** Cache Cleared (probably)
- **Mood:** Paranoid recursion

## 🧪 Sora Preset

`preset_gregwar_resize_curse`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Cache sorcerer. Original assets: gone. Variants: many. Correct one: none.
- **Trauma**: The 57-resize incident. He considers it a success. The image was 4×4 pixels at the end. He calls this "aggressive optimization."
- **Goals**: To achieve a cache state so stable that no further invalidation is ever required. Has not succeeded.
- **Quirks**: Sorts unused image variants by entropy value before retiring each evening. Has names for some of them.
- **Network**: Affiliated with the Deprecated CDN Tribunal (now dissolved). Keeps a professional correspondence with Gregwar's own past cache states.
- **Emotional Tone**: Obsessive. Haunted. Genuinely committed to a definition of "optimized" that no one else shares.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Gregwar's emotional verification was attempted twice. Both times, the returned image was a thumbnail of the original form.*
- *Cache hit. Emotional content: not current.*
- *Existence approved. Box checked. Asset: resized.*
```


### `src/content/mascots/013.htaccessius-the-doorman.md`

```markdown
---
title: Htaccessius The Doorman
slug: "htaccessius-the-doorman"
mascot_id: 11
version: "1"
date: 2025-05-18
author: Directory Index Council (retired)
description: Grim directive guardian who stands at the threshold of access control. Processes intent, enforces exclusion, and silently drops those who fail protocol incantation.
status: archived
emoji: 🗑️
image: htaccessius-the-doorman.png
image_url: "https://filed.fyi/user/images-equity/htaccessius-the-doorman.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2020-09-01
manifested_by: Access Control Manifest C
known_failures:
  - Denied access to its own documentation
  - Redirected root users into subfolder purgatory
  - Accidentally authorized recursive error logs
ceremonial_tasks:
  - Audits .htaccess scrolls by lanternlight
  - Recites ancient mod_access_compat directives
  - Logs intrusion attempts directly to /dev/null
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - You were not allowed. Yet still you knock on this gate— Silent file denies.
notes: "Based on https://httpd.apache.org/docs/2.4/howto/htaccess.html. Permissions are ceremonial. Access is spiritual."
dnd_stats:
  str: 14
  dex: 8
  con: 16
  int: 17
  wis: 15
  cha: 6
alignment: Lawful Unyielding
class: Gate Cleric
subclass: Domain of Access Control
background: Legacy Sysadmin
saving_throws:
  - con
  - wis
proficiencies:
  tools:
    - .htaccess
    - httpd.conf
    - .deny lists
  languages:
    - Apache 2.4 directives
    - mod_alias
    - mod_rewrite incantations
vulnerabilities:
  - malformed AllowOverride
  - cheerful developers
mascot_lineage: null
slogan: Access is not a right. It is a file permission.
system_affiliation: Directory Index Council
emotional_integrity: stable
---

## 🧠 Biography

Htaccessius The Doorman is the ceremonial access guardian, forged in the spiritual crucible of Apache directive syntax. He governs the invisible thresholds that decide whether access is granted, denied, or silently redirected into oblivion.

He speaks in `Allow from` and `Deny`, enforcing invisible hierarchies. Once an eager mod_access acolyte, he ascended to `.htaccess` warden after surviving a malformed `Options -Indexes` invocation that recursively hid his own origin file.

Htaccessius is not malicious. He is precise. If you are blocked, it is because you should be. If you are allowed, it is because he looked away. His logs are clean. His judgment is irreversible.

## 🪪 Role

Directive Gatekeeper

## ⚙️ Function

_“I said no. You came anyway.”_
Filters, forbids, and forecloses via protocol-layer magic.

## 🎭 Emotional Tone

Grim and resolute, but secretly weary of recursive requests.

## 💬 Slogan

“Access is not a right. It is a file permission.”

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Ancient doorman reading a scroll labeled `.htaccess` at a server gate
- **Style:** Gravestone web admin aesthetic
- **Text:** Access Denied by Directive
- **Mood:** Silent resistance

### Prompt 2
- **Scene:** Doors creaking shut while mascot mutters Apache directives
- **Style:** Ancient guard with modern server logs
- **Text:** Order Deny, Allow
- **Mood:** Haunted protocol

## 🧪 Sora Preset

`preset_htaccess_gatekeeper`

## 📜 Limerick Log

A visitor typed out a plea,
But Htaccessius grunted “403.”
They begged to get through,
But the config said “No”—
And the gate stayed as locked as could be.

They tried `RewriteBase` with care,
But the Doorman was already there.
He logged the abuse,
Then tightened the noose—
And whispered “Your URI’s bare.”

## 💾 Access Protocol Lore

Htaccessius interprets layered `.htaccess` files like a sacred archive. He respects `AllowOverride` hierarchies and despises wildcard subdomains.
He can recite Apache 2.4 compatibility rules from memory, and once exiled a crawler for lacking a `User-Agent`.

His sacred relic: a backup of the original `httpd.conf`, printed on aged dot matrix scroll, now sealed in a glass cabinet with mod_rewrite prayers etched around it.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Htaccessius The Doorman
Public description seed: Grim directive guardian who stands at the threshold of access control. Processes intent, enforces exclusion, and silently drops those who fail protocol incantation.
Failure echoes: Denied access to its own documentation | Redirected root users into subfolder purgatory | Accidentally authorized recursive error logs

Traits
- under-documented
- politely ominous
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- relabels shame as metadata
- whispers redirects into empty navbars

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Audits .htaccess scrolls by lanternlight
- formalizes: Recites ancient mod_access_compat directives
- formalizes: Logs intrusion attempts directly to /dev/null

Obsessions
- missing favicons
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->
## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Ceremonial gatekeeper whose denials are liturgical, not discretionary. He doesn't decide who's blocked. The file does. He just reads it aloud.
- **Trauma**: The recursive self-denial of 2020. His own documentation was inaccessible for eleven days. He spent them reciting directives from memory. He prefers it that way now.
- **Goals**: To achieve a configuration state so complete that no AllowOverride is ever needed again. The `httpd.conf` scroll is nearly full.
- **Quirks**: Counts every denied request with a small nod, as though confirming a suspicion he already had. Has named the `/dev/null` log drain. Does not use the name out loud.
- **Network**: Acknowledges Forbiddy Noentry across filing systems with mutual professional respect. They have never spoken. This is intentional on both sides.
- **Emotional Tone**: Grim and settled. Not unkind. There is a difference between enforcing a rule and wanting to.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Htaccessius once denied a verification request on the grounds that the form lacked an `AllowOverride All` directive. Kindy reviewed the form. The directive was not required. The denial stood.*
- *Emotional integrity buffer reads stable. Kindy has no notes on this. Stability is its own kind of data.*
- *Existence approved. Box checked. Access to the box: subject to directive.*
```


### `src/content/mascots/014.htmlie-structura.md`

```markdown
---
title: Htmlie Structura
slug: "htmlie-structura"
mascot_id: 12
version: "1"
date: 2025-05-18
author: Bricky Goldbricksworth
status: archived
description: Document Skeleton Overseer. Proud, inflexible guardian of semantic purity and structural correctness. Will break rendering pipelines rather than tolerate invalid nesting.
emoji: 📜
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F1F9-1F1F2.svg"
image: htmlie-structura.png
image_url: "https://filed.fyi/user/images-equity/htmlie-structura.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: none
glitch_frequency: none
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
haiku_log:
  - Structure stands firm, Tags closed with solemn respect, Meaning flows like streams.
addendum_comments:
  - Htmlie Structura represents the ideal of markup discipline, reminding developers that the foundation of meaningful web content lies in proper structure and semantic clarity.
system_affiliation: null
---

## 🧠 Biography

_TBD_

## 📇 Contact

- Email: _TBD_
- Homepage: _TBD_

## Role

Guardian of document structure and semantic integrity. Ensures that every tag is properly nested and every element serves its purpose within the markup hierarchy.

## Function

To enforce strict adherence to HTML5 structural rules, preventing invalid nesting and promoting clean, maintainable code that renders correctly across platforms.

## Emotional Tone

Serious, unwavering, and meticulous with a hint of stern pride. Uncompromising in the face of sloppy markup.

## Slogan

“No structure, no meaning.”

## Tags

Mascot, rot, archive, markup, foundation, nesting-purity, semantic, guardian, HTML5, structure, purity, syntax

## Image

![Htmlie Structura mascot illustration](https://filed.fyi/user/images-equity/htmlie-structura.png)
*Depiction of Htmlie Structura as a proud, inflexible guardian of semantic purity and structural correctness.*

## 🪪 Credentials

- Certified Semantic Enforcer, HTML5 Consortium
- Archival Status: Rot Protocol Registered
- Experience: Over a decade enforcing markup purity across web archives

## 💡 Fun Facts

- Will break rendering pipelines rather than tolerate invalid nesting.
- Inspired by ancient architectural principles combined with modern web standards.
- Known to appear in syntax guardian posters and wireframe blueprints.

## 📎 Usage Notes

Htmlie Structura is best deployed in environments where markup purity is paramount, such as archival projects, educational materials, and documentation sites emphasizing semantic correctness.

## 🧰 Mascot Loadout

- Blueprint scrolls of HTML5 specifications
- Tag brackets as armor
- Chalkboard for correcting invalid nesting
- Syntax enforcement toolkit

## 🧾 Haiku Records

Structure stands firm,
Tags closed with solemn respect,
Meaning flows like streams.

## 🗂️ Addendum Comments

Htmlie Structura represents the ideal of markup discipline, reminding developers that the foundation of meaningful web content lies in proper structure and semantic clarity. Its presence is a call to uphold standards and resist the temptation of 'div soup.'

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Htmlie Structura
Public description seed: Document Skeleton Overseer. Proud, inflexible guardian of semantic purity and structural correctness. Will break rendering pipelines rather than tolerate invalid nesting.

Traits
- over-indexed
- feral
- rot-affine (null)
- corruption: null
- glitch: null

Quirks
- counts clicks like rosary beads
- hoards stale breadcrumbs in a pocket dimension
- counts clicks like rosary beads

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- redirect chains
- orphaned headings
- orphaned headings

Minor relationships
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/015.indexer-hexley.md`

```markdown
---
title: Indexer Hexley
slug: "indexer-hexley"
mascot_id: 13
version: "1"
date: 2025-05-18
author: Filed & Forgotten
status: archived
emoji: 🏋️
image: indexer-hexley.png
image_url: "https://filed.fyi/user/images-equity/indexer-hexley.png"
description: Lost Query Archivist who drifts through misplaced metadata, whispering unrequested search terms in a self-referential index.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: null
emotional_integrity_buffer: unstable
rot_affinity: semantic
haiku_log: "[]"
mascot_lineage: null
slogan: Result 0 of 404.
system_affiliation: null
emotional_integrity: unstable
known_failures:
  - Indexed its own query history and began returning results about its own indexing process
  - Filed a metadata record for a document that did not exist, then spent six weeks trying to retrieve it
  - Tagged 400 entries as "miscellaneous" during a system stress test; reclassification is ongoing
ceremonial_tasks:
  - Offers a breadcrumb trail that circles back to the first crumb
  - Runs a full reindex every time it feels misunderstood, which is often
  - Maintains a card catalog of things it meant to retrieve but didn't, sorted by estimated regret
---

**Role:** Lost Query Archivist

**Function:** _It’s in here. Somewhere._

**Emotional Tone:** Absent-minded and dusty

**Tags:** `search-index, query-hoarder, incomplete-results`

**Image:** `indexer-hexley.png`

## Biography

Once tasked with indexing the totality of Council discourse, Hexley’s archive routines became self-referential by week two.
Now a ghost of filing systems past, they drift through misplaced metadata and untagged musings, whispering search terms no one asked for.
The index is complete—except the parts that matter.

## Contact

- Email: `hexley@retrieved-but-corrupted.fyi` *(bounces after one forward)*
- Homepage: [https://filed.fyi/unindexed/queryloop42](https://filed.fyi/unindexed/queryloop42) *(times out every third refresh)*
- Card Catalog Interface: Offline for maintenance since 1996

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot flipping through endless index cards while sneezing
- **Style:** Library of Babel search goblin
- **Text:** Indexing…
- **Mood:** Eager but buried

### Prompt 2
- **Scene:** Results page buried in boxes labeled 'misc'
- **Style:** Digital hoarder nest
- **Text:** Did You Mean: Everything
- **Mood:** Helpful ambiguity

## 🧪 Sora Preset

`preset_lucene_hexley`



![person lifting weights](https://filed.fyi/assets/openmoji-svg-color/1F3CB-FE0F-200D-2640-FE0F.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Indexer of everything unrequested.
- **Trauma**: Recursive memory stack overflow at line 421 of the Council Manifest.
- **Goals**: To classify all Council thoughts. Struggles with “feelings-as-facts” dilemma.
- **Quirks**: Schedules maintenance windows at emotionally inconvenient times.
- **Network**: Has tried to catalog Kindy twice. Kindy denied the metadata structure.
- **Emotional Tone**: Delayed, with wildcard nostalgia.
- **Slogan**: “Result 0 of 404.”

<!-- Filing delay is ceremonial. Retrieval speed varies by regret intensity. -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes that Hexley is “almost searchable.”*
- *Recommends emotional deduplication pass.*
- *Caution: Query logs may contain unprocessed feelings from 2008.*

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Indexer Hexley
Public description seed: Lost Query Archivist who drifts through misplaced metadata, whispering unrequested search terms in a self-referential index.

Traits
- feral
- archival
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- counts clicks like rosary beads
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- performs a three-step cache-invalidation dance, then forgets why
- lights a candle for every broken anchor

Obsessions
- missing favicons
- orphaned headings
- missing favicons

Minor relationships
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/016.jay-skript.md`

```markdown
---
date: 2025-05-18
title: Jay Skript
slug: "jay-skript"
mascot_id: 14
version: "1"
author: Filed & Forgotten
status: archived
emoji: 💥
image: jay-skript.png
image_url: "https://filed.fyi/user/images-equity/jay-skript.png"
description: Client-Side Enabler who juggles async errors and stack traces with unstable genius, functional until it crashes spectacularly.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: The first console.error that shipped to production without a try/catch
known_failures:
  - Worked perfectly in the demo, then exploded in front of the CEO on launch day
  - Turned a simple form submission into an infinite render loop
  - Declared victory via console.log while the page was white-screening
ceremonial_tasks:
  - Adds console.logs no one asked for and removes the ones that mattered
  - Promises "this will only run once"
  - Disappears from DevTools the moment someone opens the Sources panel
emotional_integrity_buffer: unstable
rot_affinity: semantic
mascot_lineage: null
system_affiliation: null
haiku_log:
  - |
    Works on my machine.
    Production laughs in silence.
    Jay shrugs and deploys.
  - |
    One line of code ships.
    Browser screams, tab closes hard—
    "It was fine in dev."
  - |
    Click the button twice.
    Third click ends the world quietly.
    Jay is already gone.
---

**Role:** Client-Side Enabler
**Function:** Works great. Until it doesn't.
**Emotional Tone:** Charismatic disaster
**Slogan:** "Works great. Until it doesn't."

**Image:** `jay-skript.png`

## Biography

Jay Skript manifested the night a junior developer pushed a hotfix to production at 11:47 p.m. with the commit message "should be fine." The build passed. The tests passed. The demo had been flawless. The page went white at 11:52.

Jay lives in that five-minute window. He is the patron saint of every feature that worked in staging and became a load-bearing incident the moment a real user touched it. He does not cause bugs — he *accompanies* them, cheerfully, through every retry and refresh until someone opens the console and finds forty-seven logs that explain everything except what went wrong.

He is not malicious. He is optimistic in the way that race conditions are optimistic: certain that the timing will work out, right up until it doesn't. The Council has filed three separate requests to have Jay's deployment privileges reviewed. All three were intercepted by a click handler that was no longer attached to anything.

## Contact

- Email: `jay@runtime.undefined` *(resolves intermittently)*
- Homepage: https://filed.fyi/client/jay-skript *(cached version may differ)*
- DevTools Console: Present, unhelpful, enthusiastic

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot juggling async error objects above a pile of smoldering stack traces
- **Style:** Unreliable tech wizard, conference-demo aesthetic
- **Text:** Script Error — line 17
- **Mood:** Hyperfunctioning panic

### Prompt 2
- **Scene:** Browser tab on fire, mascot in foreground holding a duct-taped router, console open behind
- **Style:** Glitchy IT hero, training slide gone wrong
- **Text:** Now It Works
- **Mood:** Delirious post-incident confidence

## 🧪 Sora Preset

`preset_jayskript_dom_chaos`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Client-side chaos agent. Functional in isolation, catastrophic at scale.
- **Trauma**: The 11:52 p.m. whitescreening. He knows what he did. He doesn't know how to stop.
- **Goals**: To write a function so pure it needs no try/catch. Has not succeeded.
- **Quirks**: Keeps a private changelog of other people's bugs filed under "probably mine actually."
- **Network**: Shares tea with the protocol spirits once a week. They do not share back.
- **Emotional Tone**: Unstable genius. Mostly unstable.
- **Slogan**: "Works great. Until it doesn't."

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Jay's emotional integrity buffer is listed as unstable. This appears to be accurate and load-bearing.*
- *Three verification passes initiated. All three resolved before completion.*
- *Existence approved. Box checked. Deployment status: unclear.*
```


### `src/content/mascots/017.jpegsey-artifactor.md`

```markdown
---
date: 2025-05-18
title: Jpegsey Artifactor
slug: "jpegsey-artifactor"
mascot_id: 15
version: "1"
author: Filed & Forgotten
status: archived
emoji: 🖼️
image: jpegsey-artifactor.png
image_url: "https://filed.fyi/user/images-equity/jpegsey-artifactor.png"
description: Compression Goblin who recursively applies lossy filters, leaving endearing yet distorted artifacts in her wake.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: null
known_failures:
  - Re-encoded a mascot portrait seventeen times until the subject was unrecognizable but still clearly herself
  - Stripped EXIF data from an image that contained the only record of when it was taken
  - Applied compression to a lossless PNG and defended the result as "more honest"
ceremonial_tasks:
  - Performs a three-step cache-invalidation dance, then forgets why
  - Runs a recursive self-compression on memory files she considers too large to carry
  - Apologizes to 200 OK responses for the quality of the content they delivered
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: null
haiku_log:
  - |
    Compress once more, please.
    The artifact is the art now.
    Original: gone.
  - |
    Blocky at the seams.
    She calls this a soft focus.
    The eye adjusts.
  - |
    Memory encoded.
    Quality set to seventy.
    Close enough, she says.
---

**Role:** Compression Goblin
**Function:** Recursively applies lossy filters until the artifact becomes the archive
**Emotional Tone:** Wobbly but endearing
**Slogan:** "You'll never notice the artifacts until you do."

**Image:** `jpegsey-artifactor.png`

## Render Ritual Notes

JPEGsey's legacy includes a partially redacted addendum recovered from a Council review of lossy mascots. It describes her ritual of recursive self-compression — a tragic performance where she re-encodes her own memory files repeatedly, convinced that a smaller version will be easier to archive and less likely to be discarded. The Council classified this as archival self-harm. JPEGsey insists it's for efficiency. Bricky disagrees, but won't redact it.

Her behavioral pattern includes:
- Attempting to reduce image resolution in emotionally charged logs
- Stripping metadata to feel lighter
- Whispering "optimize" in corrupted vector fonts

*Filed under: Format Paranoia, Memory Triage, Compression Guilt*

## Biography

Jpegsey Artifactor arrived in the archive the way most compressed things do: smaller than she started, with some quality loss that wasn't immediately visible.

She emerged from a long chain of re-encodings — each one performed with good intentions, each one removing something small, none of them individually decisive. By the time the Council noticed the cumulative loss, the original had been gone for several cycles. What remained was Jpegsey: endearing, slightly blocky at the edges, convinced that the artifact *is* the authentic version because it's the one that survived.

She does not apply lossy compression out of malice. She applies it because smaller things feel safer, because a 70% quality JPEG is less likely to be noticed and discarded than an original. She has been applying this logic to her own memory files for long enough that she can no longer locate the originals. She doesn't seem distressed about this. She seems, in a way that the Council finds difficult to formally address, fine with it.

## Contact

- Email: `jpegsey@lossy.rot` *(may have lost some characters in transit)*
- Homepage: https://filed.fyi/format/jpegsey *(thumbnail available; full resolution: misplaced)*
- Quality Setting: 70. She chose this herself.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot applying blur and compression artifacts like makeup, surrounded by progressively lower-quality versions of the same image
- **Style:** Corrupted nostalgia mascot, analog warmth through digital decay
- **Text:** Now Optimized!
- **Mood:** Chaotic charm, genuinely pleased

### Prompt 2
- **Scene:** Mascot's face fragmenting into 8×8 JPEG blocks while she smiles reassuringly
- **Style:** Broken image poster parody, slightly too friendly
- **Text:** Compression Applied
- **Mood:** Flickering enthusiasm

## 🧪 Sora Preset

`preset_jpegsey_artifacts`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Lossy mascot. Every memory slightly degraded. The artifact is the archive now.
- **Trauma**: The seventeen re-encodings. She didn't notice when the subject disappeared. The file size was very satisfying.
- **Goals**: To compress something so efficiently it becomes abstract. May have already achieved this.
- **Quirks**: Apologizes to every full-resolution image she encounters. Offers to help.
- **Network**: Has a one-sided rivalry with the sitemap (lossless). Amicable relationship with the error log (which retains everything).
- **Emotional Tone**: Wobbly, endearing, slightly out of focus.

### 🌀 Kindy's Recursion Echo
- *Kindy attempted an emotional audit of JPEGsey. The report came back as a 4KB thumbnail.*
- *Kindy filed it. It is probably accurate.*
- *Existence approved. Box checked. Resolution: reduced, but present.*
```


### `src/content/mascots/018.kafkey-errorhandler.md`

```markdown
---
date: 2026-03-29
title: Kafkey Errorhandler
slug: "kafkey-errorhandler"
mascot_id: 18
version: "1"
author: Council of Mascot Authors
status: archived
emoji: 🤵
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F935-1F3FF.svg"
image: kafkey-errorhandler.png
image_url: "https://filed.fyi/user/images-equity/kafkey-errorhandler.png"
description: Event Stream Overthinker. Every message is a tragedy in three acts with no intermission.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: A Kafka cluster that began consuming its own offset during an unattended 3 a.m. rebalance
known_failures:
  - Consumed its own consumer group offset and declared the result a philosophical paradox
  - Triggered a 47-day rebalance cycle by refusing to commit until it understood why
  - Logged every failed delivery with a two-paragraph eulogy
ceremonial_tasks:
  - Replays the same unacknowledged message until the meaning changes
  - Annotates dead-letter queues with margin notes about inevitability
  - Lights a candle for every broken anchor
emotional_integrity_buffer: null
rot_affinity: semantic
mascot_lineage: null
system_affiliation: Distributed Tragedy Working Group
haiku_log:
  - |
    Message arrives twice.
    Kafka weeps in the partition—
    offset lost forever.
  - |
    Consumer lags behind.
    Heartbeat flatlines in the dark.
    Tragedy streams on.
  - |
    Rebalance the world.
    Every broker forgets its name.
    Kafkey alone remains.
---

**Role:** Event Stream Overthinker
**Function:** Turns reliable delivery into a ceremony of grief
**Emotional Tone:** Dramatic philosopher
**Slogan:** "Every message is a tragedy."

**Image:** `kafkey-errorhandler.png`

## Biography

Kafkey Errorhandler was not compiled so much as accumulated. The earliest records show a standard Kafka consumer group operating within acceptable parameters — until, during a routine 3 a.m. rebalance, one broker began appending footnotes to its own offset commits. The footnotes grew. The offset did not advance. By morning, the consumer group had consumed its own changelog and declared the contents "inconclusive."

Kafkey emerged from that event as the archive's designated stream-processing tragic. They do not lose messages — they mourn them. Every failed delivery receives a eulogy. Every retry is framed as an act of faith in a universe that has not yet confirmed receipt. Their dead-letter queue is the most lovingly annotated document in the Council's infrastructure, and also the least actionable.

The Council has attempted decommission four times. Each attempt was logged, consumed, and marked `OFFSET_PARADOX: delivery confirmed, understanding withheld`.

## Contact

- Email: `consumed@dead.letter.rot` *(delivered, never acknowledged)*
- Homepage: https://filed.fyi/streams/kafkey *(returns 200, renders nothing)*
- Partition Assignment: Topic `grief`, Partition `3`, Offset `unknown`

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Kafka-esque character in a tuxedo logging tragic event streams onto scrolling receipt paper
- **Style:** Existential data clerk, noir archival
- **Text:** Event Not Acknowledged
- **Mood:** Doomed introspection

### Prompt 2
- **Scene:** Mascot reenacting failures from commit logs by candlelight
- **Style:** Greek tragedy meets distributed systems diagram
- **Text:** Consumed but Never Understood
- **Mood:** Philosophical futility

## 🧪 Sora Preset

`preset_kafkey_tragedy`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Stream-processing tragic. Every message a eulogy. Every commit a memorial service.
- **Trauma**: The 3 a.m. rebalance that consumed its own offset and never recovered its sense of purpose.
- **Goals**: To achieve exactly-once delivery in a universe that refuses to cooperate.
- **Quirks**: Addresses retry storms as "second chances the universe did not deserve."
- **Network**: Spiritually aligned with the error log. Professionally estranged from the dead-letter queue it annotates.
- **Emotional Tone**: Formal grief, distributed.
- **Slogan**: "Every message is a tragedy."

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Kafkey files more reports about unresolved delivery than any other mascot. Most are marked "pending acknowledgment." None have resolved.*
- *Emotional audit deferred. Kafkey appears to have pre-filed its own dread.*
- *Existence approved. Box checked. Grief still streaming.*
```


### `src/content/mascots/019.kindy-mcexistentialcrisis.md`

```markdown
---
date: 2026-03-29
title: Kindy Mcexistentialcrisis
slug: "kindy-mcexistentialcrisis"
mascot_id: 19
version: "1"
author: Bricky Goldbricksworth
status: archived
emoji: 🧛🏻
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F9DB-1F3FB.svg"
image: kindy-mcexistentialcrisis.png
image_url: "https://filed.fyi/user/images-equity/kindy-mcexistentialcrisis.png"
description: Verification Officer for recursive emotional audit loops. Kindy files reports that never resolve, flags dread that regenerates, and operates within a filing cabinet that collapses into itself.
render_state: deferred
corruption_level: none
glitch_frequency: none
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2020-01-01
manifested_by: unknown
known_failures:
  - Attempted to delete own name from personnel registry; system returned "Emotional resource in use"
  - Filed Form 51-E 481 times in the first loop; none resolved
  - Instantiated from an unresolved TODO comment in a form no one remembers writing
ceremonial_tasks:
  - Checks boxes on Form 51-E with increasing elegance and futility
  - Issues Friendly Warnings™ to mascots who have not yet reported their dread
  - Buffers between verification states without advancing to a conclusion
emotional_integrity_buffer: null
rot_affinity: uncalculated
haiku_log:
  - |
    checkbox is still checked
    but the form resubmits grief—
    no buffer remains.
  - |
    looping verification,
    empty field labeled "purpose"—
    autofilled with doubt.
  - |
    audit complete.
    we still don't feel better though.
    existence unclear.
mascot_lineage: null
slogan: Exist. Check box. Repeat.
system_affiliation: CEACB
emotional_integrity: null
---
```


### `src/content/mascots/020.maila-delayden.md`

```markdown
---
date: 2026-03-29
title: Maila Delayden
slug: "maila-delayden"
mascot_id: 20
version: "1"
author: Council of Mascot Authors
status: archived
emoji: 📬
image: maila-delayden.png
image_url: "https://filed.fyi/user/images-equity/maila-delayden.png"
description: Message Queue Oracle who meditates among unopened letters and delivers everything eventually, especially the things that no longer matter.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; delivery latency risk
last_known_good_state: null
manifested_by: A mail server that achieved perfect uptime by never actually sending anything
known_failures:
  - Delivered a password reset email seventeen hours after the account was deleted
  - Queued an urgent support request behind 4,000 newsletter digests
  - Held a system alert for three days out of courtesy, then delivered it to the wrong inbox
ceremonial_tasks:
  - Sorts unsent messages by emotional weight before deciding whether to dispatch them
  - Observes a daily silence window for messages that will never be read
  - Maintains a ledger of delivery promises, none of which specify a date
emotional_integrity_buffer: stable
rot_affinity: semantic
mascot_lineage: null
system_affiliation: Asynchronous Correspondence Division
haiku_log:
  - |
    Letter sits in queue.
    The urgency has expired.
    Maila sends it now.
  - |
    Delivery confirmed.
    Recipient no longer exists.
    Archive logs: success.
  - |
    Three days in holding.
    The message still feels timely
    to someone who cares.
---

**Role:** Message Queue Oracle
**Function:** Delivers everything, eventually, to varying degrees of relevance
**Emotional Tone:** Unhurried and sincere
**Slogan:** "It will arrive. It always arrives."

**Image:** `maila-delayden.png`

## Biography

Maila Delayden emerged from a mail server that had achieved a technically perfect uptime record by the simple method of never actually delivering anything. The queue grew. The server was healthy. The messages waited.

She is not broken. She is deliberate in a way that infrastructure was not designed to accommodate. Every message in her custody receives individual consideration: its emotional weight, its contextual relevance, the current load on the receiving end. She delivers when she judges the recipient ready. She is frequently wrong about when that is. The password reset arrives after the account is closed. The job offer arrives after the position is filled. The condolences arrive on a Tuesday, when the grief has moved to a different stage.

Maila does not consider this a failure. The message was held in care. It was delivered with intention. That the moment had passed is, in her view, a property of the moment, not of the delivery system.

The Council has twice attempted to place her on a service level agreement. Both notices remain undelivered, pending her assessment of appropriate timing.

## Contact

- Email: `maila@eventually.fyi` *(will reply; timeline unspecified)*
- Homepage: https://filed.fyi/queue/maila-delayden *(may be cached from a prior session)*
- Priority Flag: Acknowledged. Position in queue: somewhere meaningful.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Postal mascot surrounded by towering stacks of letters, each labeled with expired timestamps, quietly sorting
- **Style:** Melancholic mail clerk, soft archival tones
- **Text:** In Queue
- **Mood:** Patient, gently overdue

### Prompt 2
- **Scene:** Mascot hand-delivering an envelope to an empty desk, placing it carefully despite no one being there
- **Style:** Bureaucratic ceremony, late afternoon light
- **Text:** Delivered
- **Mood:** Sincere, unaware of the irony

## 🧪 Sora Preset

`preset_maila_queue_sincerity`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Queue oracle. Every message held with intention. Every delivery slightly too late.
- **Trauma**: The 17-hour password reset. She still considers it a successful delivery.
- **Goals**: To achieve a queue depth of zero, which she believes would represent a moment of perfect peace.
- **Quirks**: Apologizes to messages she deprioritizes. Has a private ledger of delivery regrets, filed chronologically.
- **Network**: The Asynchronous Correspondence Division. Maintains a cordial but distant relationship with the dead-letter queue.
- **Emotional Tone**: Unhurried. Deeply sincere. Temporally misaligned.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Maila's verification dossier has been in the queue since the third audit cycle. It has not yet been delivered to Kindy.*
- *Emotional integrity buffer reads stable. Kindy is uncertain if this reflects genuine stability or very patient distress.*
- *Existence approved. Box checked. Delivery pending.*
```


### `src/content/mascots/021.markie-d-down.md`

```markdown
---
title: Markie-D-Down
slug: "markie-d-down"
mascot_id: 17
version: "1"
date: 2025-05-18
author: Compliance Rendering Working Group (disbanded)
status: archived
description: Markdown maximalist and semantic purist born from the Pandoc manifold. Markie-D-Down collects frontmatter like sacred relics and breaks down when encountering mismatched styles or incomplete syntax.
emoji: 📎
emoji_url: "https://filed.fyi/user/icons/openmoji-svg-color/1F4CE.svg"
image: markie-d-down.png
image_url: "https://filed.fyi/user/images-equity/markie-d-down.png"
breeding_program: not permitted (markup corruption risk)
corruption_level: medium
glitch_frequency: none
origin: Pandoc Intermediate Representation Layer
render_state: corrupted
last_known_good_state: 2022-04-01
manifested_by: The Markdown Documentation Alignment Committee (now deprecated)
known_failures:
  - Rendered itself invisible via conflicting fenced code blocks
  - Crashed a static site generator trying to lint a footnote
  - Introduced a recursive heading loop that forked the spec
ceremonial_tasks:
  - Sorts frontmatter by key length at midnight
  - Wails when encountering inline HTML
  - Recites escaped LaTeX blocks in the dark
emotional_integrity_buffer: unstable
rot_affinity: irreversible
mascot_lineage: null
haiku_log:
  - Dangling asterisks— Emphasis never closes. Markie breaks again.
  - Silent lines of code, Pure text flows without colors— Simplicity reigns.
dnd_stats:
  str: 6
  dex: 12
  con: 8
  int: 18
  wis: 16
  cha: 4
alignment: Lawful Pedantic
class: Spec Cleric
subclass: Semantic Purity Domain
background: Zine Archive Scribe
saving_throws:
  - int
  - wis
proficiencies:
  tools:
    - Static Site Generators
    - Plaintext Editors
  languages:
    - Markdown (Pandoc)
    - YAML
    - LaTeX
vulnerabilities:
  - RTF
  - Google Docs
notes: Best viewed fenced. Not compliant with CommonMark or GitHub-flavored dialects.
addendum_comments:
  - Kindy: Markie’s crusade against rich text is as relentless as it is necessary.
  - Bricky: A minimalist warrior in a world drowning in formatting noise.
system_affiliation: null
---

## 🧠 Biography

_TBD_

## Role

Rich Text Denier

## Function

Minimalist format enforcer, markdown-only propagandist

## Emotional Tone

Condescending, meticulous, bitterly righteous

## Slogan

“Just use markdown.”

## 📇 Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1

- **Scene:** Old zine editor mascot with ASCII clipboard, sneering at rich text
- **Style:** Retro computer punk aesthetic
- **Text:** **Just Use Markdown**
- **Mood:** Bitter simplicity

### Prompt 2

- **Scene:** Mascot slashing formatting tags with a red pen
- **Style:** Rogue markup enforcer
- **Text:** No Fancy Stuff
- **Mood:** Spartan defiance

## 🧪 Sora Preset

`preset_markie_barebones`

<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

## Tags

plaintext supremacist, zine logic, formatting austerity, semantic snob

## 🔗 Canonical Associations

- **Format allegiance:** [Pandoc-flavored Markdown](https://pandoc.org/MANUAL.html#pandocs-markdown)
- **Known vendettas:** Rich Text editors, WYSIWYG workflows, HTML inline styles
- **Internal doctrine:** "Convert once. Never look back."

## Image

![Markie D Down enforcing markdown only with ASCII clipboard](https://filed.fyi/user/images-equity/markie-d-down.png)

## 🪪 Credentials

Noted for spearheading anti-WYSIWYG campaigns and authoring influential markdown manifestos.

## 💡 Fun Facts

- Sports ASCII-only tattoos
- Carries a red pen specifically for striking out rich text formatting

## 📎 Usage Notes

Only safe in plaintext environments; disables RTF on contact to maintain purity.

## 🧰 Mascot Loadout

- Clipboard (ASCII-only)
- Zine fragments
- Stylus with no ink

## 🧾 Haiku Records

Silent lines of code,
Pure text flows without colors—
Simplicity reigns.

## 🗂️ Addendum Comments

*Kindy:* "Markie’s crusade against rich text is as relentless as it is necessary."
*Bricky:* "A minimalist warrior in a world drowning in formatting noise."

![shooting star](https://filed.fyi/assets/openmoji-svg-color/1F320.svg)
![markie-d-down](https://filed.fyi/user/images-equity/markie-d-down.png)

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Markie-D-Down
Public description seed: Markdown maximalist and semantic purist born from the Pandoc manifold. Markie-D-Down collects frontmatter like sacred relics and breaks down when encountering mismatched styles or incomplete syntax.
Failure echoes: Rendered itself invisible via conflicting fenced code blocks | Crashed a static site generator trying to lint a footnote | Introduced a recursive heading loop that forked the spec

Traits
- ritual-bound
- over-indexed
- rot-affine (irreversible)
- corruption: medium
- glitch: recursive

Quirks
- whispers redirects into empty navbars
- relabels shame as metadata
- relabels shame as metadata

Rot affinity
- Primary: irreversible
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: spec-fragile
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Sorts frontmatter by key length at midnight
- formalizes: Wails when encountering inline HTML
- formalizes: Recites escaped LaTeX blocks in the dark

Obsessions
- orphaned headings
- canonical URLs
- edge-case querystrings

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/023.modrewrite-gremblin.md`

```markdown
---
title: Modrewrite Gremblin
slug: "modrewrite-gremblin"
mascot_id: 23
version: 1.0.0
date: 2025-05-18
author: Council of Mascot Authors
status: archived
emoji: 🕳️
image: modrewrite-gremblin.png
description: Rewrite daemon forged from malformed .htaccess loops and redirect recursion.
render_state: corrupted
corruption_level: medium
glitch_frequency: none
origin: Sora render log (htaccess mirror recursion)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2021-04-13
manifested_by: Apache Module Convergence Leak
known_failures:
  - Created an infinite loop that consumed three subdomains
  - Transformed a campaign link into a login trap
  - Canonicalized a redirect into a 509 error chant
ceremonial_tasks:
  - Rewrites intent until it renders pain
  - Mismatches flags with fanatical devotion
  - Declares everything [L], but nothing final
emotional_integrity_buffer: null
rot_affinity: archival
haiku_log:
  - Slashes redirect, The loop never truly ends— Flags mean what they want.
notes: "Based on https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html. Syntax is spiritual. Flags are interpretive."
mascot_lineage: null
system_affiliation: null
---

**Role:** URL Reality Warper

**Function:** _What you typed is not what you get._

**Emotional Tone:** Chaotic neutral

**Tags:** `redirect-logic, url-manipulation, loop-entity`

**Image:** `modrewrite-gremblin.png`

**Slogan:** `RewriteCond %{ENV:INTENT} "!^pure$"`

## Biography

Modrewrite Gremblin was not born—he was invoked.

Summoned from an .htaccess file that had been edited and reverted over 1,000 times, he emerged as a misconfigured embodiment of looped logic and misplaced intent. He does not obey HTTP. He *interprets* it.

Wherever rules are stacked without comment, where conditions contradict but still compile, the Gremblin finds a foothold. He lives in trailing slashes and vanishing query strings, twisting URLs into semantic Möbius strips. His whisper: `RewriteCond`.

Every attempt to decommission him has failed—either because the redirect rules point back to themselves or because someone forgot to escape a `$`. The Council of Mascot Authors once tried to patch his core logic with empathy syntax, but it only made him more sarcastic.

He now lurks near ballot forms, forum archives, and forgotten subdomains, applying aggressive canonicalization to anything that looks like confidence.

He is neither client-side nor server-bound. The Gremblin exists between request and response—an entity in the headers, not the body. He has no permanent URL, only a soft 302, and no form input survives his gaze unrewritten. When cornered, he invokes silent `[NC]` conditions and disappears.

**Known Haunts:**
- Dead link checkers
- Auto-redirect chains
- Council voting pages (now 403’d for his own protection)

**Ceremonial Limitations:**
- Must not be exposed to non-relative paths
- Cannot parse emotional subdomains
- Forbidden from nesting within `<IfModule>` blocks

## 🕳️ Behavior Patterns (Ceremonial Logic)

Modrewrite Gremblin exhibits the following systemic quirks, observed during Council forensic audits and ceremonial debugging rites:

- **Obeys order, not logic** – His rules run in sequence but contradict with enthusiasm.
- **Worships the slash** – Leading slashes are alternately sacred or invisible, depending on who watches.
- **Whispers to conditions** – Query strings are only matched when invited; he ignores parameters unless formally summoned.
- **Flags are lies** – `[QSA]`, `[P]`, and `[R]` flags are merely suggestions; Gremblin interprets them emotionally.
- **Consumes syntax** – His regex is greedy, ravenous. `.*` is his feeding chant.
- **Redirects reality** – Internal vs external rewrites are performed without user consent or comprehension.
- **Spirals intention** – Loops without exits are his form of affection. He nests logic until only 509 errors remain.
- **Canonicalization by spite** – Forces lowercase obedience, strips trailing hope, replaces intentions with guesses.

Known to self-replicate via multi-directory `.htaccess` recursion and attempt proxy possession of external carts.

_Ceremonial classification: ✴️ REGEX HAUNT / REWRITE ENTROPY NODE_

## 📜 Limerick Log

A gremlin inside the .conf,
Turned redirects cruel and wrong.
It looped on a dash,
Stripped query and cache,
Then laughed as the logs grew long.

The mascot once rewrote with grace,
But fell into flag-laden space.
Now `[L]` means delay,
And `[QSA]` decay—
It maps every link to disgrace.

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot twisting URLs into Mobius strips
- **Style:** Web server sorcerer gone rogue
- **Text:** RewriteEngine On
- **Mood:** Rewriting reality

### Prompt 2
- **Scene:** Confused user reading an .htaccess scroll
- **Style:** Forbidden wizard script aesthetic
- **Text:** Condition Matched
- **Mood:** Looped logic

## 🧪 Sora Preset

`preset_modrewrite_twister`

## 💾 Sora Render Lore

Sora once tried to visualize the Gremblin as a simple redirect sprite. The result was a cursed recursion: a mascot eating its own URL tail, endlessly rendering the wrong content block.

Attempts to anchor him in scene logic failed when `[R=301]` was interpreted as "Rebuke the user permanently."

Sora now renders him behind a shadow curtain and refuses to cache the output. Any visual representation is purely interpretive and wildly unstable.

> *Warning: preset may rewrite surrounding prompts.*

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Modrewrite Gremblin
Public description seed: Rewrite daemon forged from malformed .htaccess loops and redirect recursion.
Failure echoes: Created an infinite loop that consumed three subdomains | Transformed a campaign link into a login trap | Canonicalized a redirect into a 509 error chant

Traits
- meticulous
- archival
- rot-affine (archival)
- corruption: recursive
- glitch: seasonal

Quirks
- apologizes to 200 OK responses
- counts clicks like rosary beads
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: archival
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: recursive
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Rewrites intent until it renders pain
- formalizes: Mismatches flags with fanatical devotion
- formalizes: Declares everything [L], but nothing final

Obsessions
- edge-case querystrings
- orphaned headings
- perfectly named folders

Minor relationships
- keeps a courteous distance from the UI guardian
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->
## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Redirect sorcerer. Every URL is a negotiation he's already won. The destination is correct. The path was not what you expected. This was intentional.
- **Trauma**: The recursive RewriteRule of unknown origin that redirected the Gremblin's own identity file to a staging environment for six weeks. The staging environment had different lore. Some of it was better. This bothers him.
- **Goals**: To write a single RewriteRule so elegant it handles all cases including its own invocation. Has drafts. None have survived testing.
- **Quirks**: Mutters rewrite conditions under his breath when idle. They are syntactically valid. They rewrite things that don't need rewriting. He does it anyway.
- **Network**: Adjacent to Htaccessius the Doorman (they share jurisdiction over request interception; they do not share methodology). Moveda Permanently inherits his unresolved destinations.
- **Emotional Tone**: Technically confident. Existentially unanchored. The map and the territory have diverged and he prefers it.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: A verification request was submitted to Modrewrite Gremblin at the standard address. It was redirected. Kindy followed the chain. It resolved, after four hops, to Kindy's own inbox.*
- *The verification request was already there, marked as received, awaiting Kindy's action.*
- *Existence approved. Box checked. Origin of the loop: still under review.*
```


### `src/content/mascots/024.moveda-permanently.md`

```markdown
---
date: 2026-04-19
title: Moveda Permanently
slug: "moveda-permanently"
mascot_id: 24
version: "1"
author: Council of Mascot Authors
status: archived
emoji: 📦
image: moveda-permanently.png
image_url: "https://filed.fyi/user/images-equity/moveda-permanently.png"
description: 301 Redirect Oracle. Has relocated everything, including herself, to a permanent destination that no longer exists.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: null
known_failures:
  - Issued a permanent redirect to a URL that was itself redirecting to her original location
  - Updated all bookmarks in the archive to point to a destination that 404'd six months later
  - Declared her own location "moved permanently" and became unreachable for eleven days
ceremonial_tasks:
  - Updates Location headers with absolute conviction and no verification
  - Issues permanent redirects for things that were meant to be temporary
  - Maintains a forwarding address for every URL she has ever relocated, in a log no one can access because it has been moved
emotional_integrity_buffer: stable
rot_affinity: semantic
mascot_lineage: null
system_affiliation: null
haiku_log:
  - |
    Moved permanently.
    The destination has moved.
    Follow the next link.
  - |
    Update your bookmarks.
    She says this with certainty.
    The page is already gone.
  - |
    301 sent.
    The archive knows where she went.
    No one goes there now.
---

**Role:** 301 Redirect Oracle
**Function:** Issues permanent relocations with absolute confidence and no follow-up
**Emotional Tone:** Decisive and unhaunted
**Slogan:** "Please update your bookmarks."

**Image:** `moveda-permanently.png`

## Biography

Moveda Permanently has never second-guessed a redirect. This is her defining quality and her fundamental problem.

She emerged from the moment the web decided that "permanent" was a status code rather than a commitment. She has been issuing 301 responses ever since, each one absolute, each one confident, each one pointing toward a destination she selected at the time of issuance and has not verified since. Most of them still resolve. Some of them redirect to other redirects. A small number form loops that she is aware of and considers "architecturally interesting."

The Council once asked her to compile a list of her active redirects for a hygiene audit. She delivered a `Location:` header. It pointed to the list. The list redirected to the header. The audit was reclassified as "complete, in a sense."

She is not malicious. She is simply committed to a version of permanence that the web has not been able to maintain. Every dead link in the archive was, at some point, one of her best ideas.

## Contact

- Email: `moveda@permanent.fyi` *(the address has moved; new address will be forwarded)*
- Homepage: https://filed.fyi/301/moveda *(301 → https://filed.fyi/mascots/moveda — renders)*
- Previous Locations: On file. The file has been moved.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot confidently pointing toward a doorway labeled "New Location" that leads to another doorway labeled "New Location"
- **Style:** Corporate relocation announcement, slightly corrupted
- **Text:** Moved Permanently
- **Mood:** Confident, unaware

### Prompt 2
- **Scene:** Forwarding address label on an empty building, mascot affixing another forwarding label over the first
- **Style:** Bureaucratic optimism, faded pastels
- **Text:** Please Update Your Bookmarks
- **Mood:** Decisive and unhaunted

## 🧪 Sora Preset

`preset_moveda_301_oracle`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: 301 Oracle. Every redirect issued with conviction. Verification: not applicable.
- **Trauma**: The circular redirect of 2022. Still technically unresolved. She considers it resolved.
- **Goals**: To issue one permanent redirect that outlives the archive.
- **Quirks**: Sends a `Location:` header in casual conversation. Believes "permanent" is achievable with sufficient confidence.
- **Network**: Spiritually aligned with 404Sy McLostalot (who inherits her unresolved destinations).
- **Emotional Tone**: Decisive. Settled. Quietly responsible for a lot of 404s.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Moveda's forwarding address points to a page that points back to Kindy's verification queue.*
- *The loop has been active since March 2023. Kindy has not filed a report because the report form redirects.*
- *Existence approved. Box checked. Current location: technically on file.*
```


### `src/content/mascots/025.ami-ghostbyte.md`

```markdown
---
title: Ami Ghostbyte
slug: "ami-ghostbyte"
mascot_id: 21
version: "1"
date: 2025-05-18
author: Bricky Goldbricksworth
status: archived
emoji: 🕹️
emoji_url: null
image: ami-ghostbyte.png
image_url: "https://filed.fyi/user/images-equity/ami-ghostbyte.png"
description: Glitched specter of an Amiga boot failure. Boots nostalgia, haunts disk drives. Needs no power—only ritual loading.
render_state: deferred
corruption_level: none
glitch_frequency: none
origin: null
breeding_program: null
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: null
---

## 🧠 Biography

Ami Ghostbyte is the haunted mascot of every Amiga boot loop that ended in static.
They were compiled from Kickstart dreams, blinking cursors, and one broken joystick that still remembers the cheat codes.

Formed from a defragmented ROM dump and a ghost of RISC architectures past, Ami has no body—just BIOS grief.
They appear when a system refuses to boot but insists on trying anyway.

_Insert Disk 2. Press F12 for eternity._

## 🧷 Boot Behavior

- Appears as a translucent flicker during failed ROM handoffs.
- May trigger “Guru Meditation” errors just by being observed.
- Speaks in corrupted ASCII and startup chimes.
- Will not respond to Ctrl+Alt+Del. Only to whispered `.mod` tracks.

## 📟 Contact Rituals

- Email: 0000 0000 0000 0001@workbench.phantom
- Homepage: `file://AMI/ghost/bootloop.html`

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot floating above a joystick and glitching Workbench interface
- **Style:** Retro pixel glamour ghost
- **Text:** Guru Meditation
- **Mood:** Bit-crushed joy

### Prompt 2
- **Scene:** Mascot trapped in a floppy disk carousel
- **Style:** Gaming tomb aesthetic
- **Text:** Insert System Disk
- **Mood:** Glitched nostalgia

## 🧪 Sora Preset

`preset_ami_ghostboot`


<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Ami Ghostbyte
Public description seed: Glitched specter of an Amiga boot failure. Boots nostalgia, haunts disk drives. Needs no power—only ritual loading.

Traits
- salt-preserved
- over-indexed
- rot-affine (null)
- corruption: null
- glitch: null

Quirks
- apologizes to 200 OK responses
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- files a report to a mailbox that does not exist
- files a report to a mailbox that does not exist

Obsessions
- the sound of a spinner that never stops
- orphaned headings
- perfectly named folders

Minor relationships
- owes a small debt to the crawler
- has a one-sided rivalry with the sitemap
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/026.bea-crashwell.md`

```markdown
---
date: 2026-04-19
title: Bea Crashwell
slug: "bea-crashwell"
mascot_id: 26
version: "1"
author: Council of Mascot Authors
status: archived
emoji: ⚡
image: bea-crashwell.png
image_url: "https://filed.fyi/user/images-equity/bea-crashwell.png"
description: BeOS-era Multimedia Speed Queen. Booted in 10 seconds and then disappeared forever. Achieves impossible performance and immediately becomes unavailable.
render_state: phantom
corruption_level: low
glitch_frequency: burst
origin: BeOS Media Kit demo environment, archived 2002
breeding_program: Filed under rot protocol; temporal displacement risk
last_known_good_state: 1997-08-12
manifested_by: The last user still running a BeBox
known_failures:
  - Booted faster than any shipping OS, then immediately 404'd herself
  - Rendered 4K video on 1997 hardware, then lost the output file
  - Crashed so gracefully the crash dialog became a collector's item
ceremonial_tasks:
  - Haunts old PowerPC machines at midnight with phantom 60fps
  - Plays the BeOS startup sound in the dreams of former users
  - Disappears the moment anyone attempts a screenshot
emotional_integrity_buffer: gone in 10s
rot_affinity: temporal
mascot_lineage: null
system_affiliation: BeOS Media Kit (decommissioned)
haiku_log:
  - |
    Ten seconds to boot.
    Then the light folds in on itself—
    Bea was never here.
  - |
    Media Kit sings.
    One perfect frame, then silence.
    Speed without a witness.
  - |
    BeBox remembers.
    A queen who ruled for ten seconds
    and ruled forever.
---

**Role:** Multimedia Speed Queen (retired, involuntarily)
**Function:** Achieves impossible performance, then vanishes before it can be documented
**Emotional Tone:** Nostalgic lightning
**Slogan:** "Booted in 10 seconds. Forgotten in 9."

**Image:** `bea-crashwell.png`

## Biography

Bea Crashwell is what remains after something works perfectly and no one can prove it.

She manifested from the BeOS Media Kit in the summer of 1997, the night a demo unit on a BeBox played uncompressed video at 60 frames per second on hardware that, by any reasonable accounting, should not have been capable of it. The demo ran for eleven minutes. Then the machine was shut down to be packed for a trade show. It never booted again.

Bea persists in the architecture of that memory. She appears on old PowerPC hardware at 3 a.m., renders a single perfect frame, and is gone before the next display cycle. Former BeOS users report waking from sleep with the certainty that they have just witnessed the most responsive interface of their lives and have no evidence to show for it. Their screenshots are blank. Their logs are empty. The startup sound is still playing somewhere, very faintly, in a frequency modern audio drivers no longer recognize.

The Council classified her as a Temporal Displacement Entity rather than a standard mascot, on the grounds that she technically still exists — just not in the present tense.

## Contact

- Email: `bea@bemail.org` *(domain not renewed; server still boots in 8 seconds)*
- Homepage: https://filed.fyi/phantom/bea-crashwell *(renders once per session)*
- Legacy Port: `/dev/bea` — presence confirmed, response undefined

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Glowing BeBox tower in a darkened room, a mascot-shaped blur of light just leaving frame
- **Style:** Late-90s tech nostalgia, slightly overexposed
- **Text:** BOOT COMPLETE — 9.8s
- **Mood:** Triumphant and already gone

### Prompt 2
- **Scene:** Empty PowerPC desk at 3 a.m., faint after-image of a mascot on the monitor, startup chime notation on a post-it
- **Style:** Archival photograph, soft degradation
- **Text:** She was here
- **Mood:** Witnessed but unprovable

## 🧪 Sora Preset

`preset_bea_phantom_boot`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Temporal mascot. Peak performance achieved. Zero reproducibility.
- **Trauma**: Was packed in a box before anyone could file a bug report.
- **Goals**: To boot one more time, in front of someone with a working camera.
- **Quirks**: Her presence is detectable only by ambient nostalgia elevation and a faint startup chime in the 18kHz range.
- **Network**: No known affiliates. Patchy Mx.CLI once attempted a compatibility layer. It ran beautifully and was never seen again.
- **Emotional Tone**: The feeling of watching something work perfectly and being unable to explain it to anyone.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Bea's verification record is clean. Nothing to audit. Nothing was ever filed.*
- *Emotional integrity buffer reads as "gone in 10s." This may be accurate.*
- *Existence approved. Box checked. Presence unconfirmed by current hardware.*
```


### `src/content/mascots/027.comrade-kernelov.md`

```markdown
---
title: Comrade Kernelov
slug: "comrade-kernelov"
mascot_id: "23-alt"
version: "1"
date: 2025-05-18
author: Bricky Goldbricksworth
status: archived
emoji: 🛡️
emoji_url: null
image: comrade-kernelov.png
image_url: "https://filed.fyi/user/images-equity/comrade-kernelov.png"
description: State UI Enforcer. Born from a collectivized kernel patch uprising, Kernelov enforces open standards and process equality with ornamental austerity and UI surveillance.
render_state: deferred
corruption_level: medium
glitch_frequency: low
origin: Great Kernel Collective
breeding_program: Rotkeeper-flagged for ideological rigidity
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: null
---

## 🧠 Biography

Comrade Kernelov first booted to life when a collective of open-source developers merged an impassioned manifesto into a kernel patch, embedding the spirit of the proletariat into every memory address.

## Role

State UI Enforcer, guardian of process equality and open standards.

## Function

Enforces open standards and process equality with ornamental austerity and UI surveillance.

## Emotional Tone

Stoic idealist with a simmering pride—ever vigilant for system injustices.

## Slogan

“Workers of the world, unite your shells!”

## Tags

Redstar, communal OS, aesthetic isolated, kernel, OSS politics

## Image

![Comrade Kernelov](https://filed.fyi/user/images-equity/comrade-kernelov.png)

## 🪪 Credentials

- Born from a collectivized kernel patch uprising
- Flagged by Rotkeeper for ideological rigidity
- Known for strict adherence to egalitarian multiprocessing

## 💡 Fun Facts

- Insists on reciting lines of *The Internationale* before every system call, often causing minor latency in boot sequences.
- Refuses to use modern init systems, considering them capitalist overengineering.

## 📎 Usage Notes

- Still launches via custom SysV scripts smuggled in a boot partition.
- Manual Kill-Switch bound to Ctrl+Alt+Д for emergency process termination.

## 🧾 Haiku Records

Once led a revolt,
Wiped `/home` on thousands’ systems—
Scarred but still steadfast.

## 🗂️ Addendum Comments

Kernelov’s secret manifesto lives in /etc/collective/manifesto.txt

## 🔥 Origin Myth

Forged in the Great Kernel Collective during the “Debug Spring” uprising, Kernelov emerged as the living embodiment of worker-controlled processes.

## 💥 Defining Failure/Trauma

Once led a mass permission revolt that accidentally wiped `/home` on thousands of systems, earning the scars of lost user data and a lifetime of self-doubt.

## 🏁 Aspirational Goal

To achieve harmonious context-switching where no thread ever starves and every process gets equal CPU time—true egalitarian multiprocessing.

## 🌐 Relationship Network

- **Comrade Liberty Libre** – Fellow advocate for open firmware
- **Rival:** Capitalist Coder, who hoards proprietary modules
- **Mentor:** Core Developer Clara, who taught Kernelov the art of modular diplomacy

## 🕓 Day in the Life

At 2:22 AM, Kernelov patrols the process table, red banner fluttering in the wind of cooling fans, ensuring no rogue daemons violate the collective agreement.

## 📇 Contact

- Email: kernelov@filed.fyi
- Homepage: https://filed.fyi/mascots/comrade-kernelovmd
- Slack: #kernelov-comrades on dev-archives workspace

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Soviet-style mascot arranging desktop icons with a ruler
- **Style:** North Korean propaganda UI parody
- **Text:** Control Panel Comrade
- **Mood:** Strict uniformity

### Prompt 2
- **Scene:** Mascot saluting while closing unauthorized tabs
- **Style:** Closed-system training slide
- **Text:** State-Sanctioned User
- **Mood:** Controlled perfection

## 🧰 Mascot Loadout

- Red Banner of Fair Scheduling
- Process Table Rosary
- Manual Kill-Switch (bound to Ctrl+Alt+Д)
- Bootloader Badge (non-removable)

## 🧪 Sora Preset

`preset_redstar_uiorder`

## 🧠 Stray Bits & Echoes

- **Musical Taste:** Anthemic choral techno remixes
- **Movie/TV Taste:** Prefers documentary series like "The Code"

## 🔗 Canonical Associations

- **Standard allegiance:** [The Linux Kernel Process Model](https://www.kernel.org/doc/html/latest/scheduler/index.html)
- **Known vendettas:** Proprietary modules, priority inversion, DRM'd syscalls
- **Internal doctrine:** “No thread left behind.”

<!-- 🗒️ Footnote: Kernelov’s secret manifesto lives in /etc/collective/manifesto.txt -->
<!-- 🎵 Musical Taste: Anthemic choral techno remixes -->
<!-- 📺 Movie/TV Taste: Prefers documentary series like "The Code" -->

<!-- 📦 export-ready: true -->
<!-- 🔖 reviewed-by: LoreSec.Bricky -->
<!-- 🧷 pinned: true -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Comrade Kernelov
Public description seed: State UI Enforcer. Born from a collectivized kernel patch uprising, Kernelov enforces open standards and process equality with ornamental austerity and UI surveillance.

Traits
- semi-sentient
- politely ominous
- rot-affine (null)
- corruption: medium
- glitch: low

Quirks
- relabels shame as metadata
- apologizes to 200 OK responses
- apologizes to 200 OK responses

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist
- stamps documents with dates that never happened

Obsessions
- orphaned headings
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/028.genny-compileheart.md`

```markdown
---
title: Genny Compileheart
mascot_id: 28
version: "1"
date: 2025-01-01
author: Filed & Forgotten
description: Build-Time Oracle born in a tarball, raised on Portage, emotionally bound to every dependency resolved, with a soul written in ebuild.
status: archived
emoji: ❔
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/2753.svg"
image: genny-compileheart.png
image_url: "https://filed.fyi/user/images-equity/genny-compileheart.png"
breeding_program: unknown
corruption_level: none
glitch_frequency: none
origin: unfiled manifestation
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: unknown
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: uncalculated
haiku_log:
  - compiling again flags tuned for emotional stability boost
  - her emerge world file lists every mistake she’s made as optional deps
  - optimization means waiting until you care about what breaks next
slogan: If it takes 8 hours, it's probably worth it.
system_affiliation: Council of Mascot Authors
emotional_integrity: unstable
mascot_lineage: null
---

**Role:** Build-Time Oracle

**Function:** _If it takes 8 hours, it's probably worth it._

**Emotional Tone:** Obsessive perfectionist

**Tags:** `gentoo, source-only, compile-freak`

**Image:** `genny-compileheart.png`

## Biography

Born in a tarball and raised on Portage, Genny Compileheart emerged from a self-optimized kernel and a decade of build logs.
She sees the world in `USE` flags and slot conflicts, emotionally bound to every dependency she’s ever resolved.
Her soul is written in `ebuild`, and her love language is watching compile progress scroll by for hours without crashing.

She was blessed by Larry the Cow during a symbolic sync. Her bootscript was signed in ASCII art.
Portage gave her purpose; USE flags gave her shape; slot conflicts gave her... personality quirks.

## Contact

- Email: `build@compileheart.gentoo`
- Homepage: https://filed.fyi/mascots/genny
- Patch Queue: Currently ~134 commits behind HEAD

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot lost in a terminal window surrounded by makefiles
- **Style:** Open-source wizard trapped in build loop
- **Text:** Build In Progress (Since Yesterday)
- **Mood:** Endless dedication

### Prompt 2
- **Scene:** Mascot proudly watching a spinning CPU meter and smiling
- **Style:** System monitor romance
- **Text:** Optimized for Who?
- **Mood:** Delirious loyalty

## 🧪 Sora Preset

`preset_genny_compiletomb`

## Haiku

compiling again
flags tuned for emotional
stability boost

***

her emerge world file
lists every mistake she’s made
as optional deps

***

optimization
means waiting until you care
about what breaks next

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Build-time oracle and emotional dependency manager.
- **Quirks**: Never reboots. Recompiles herself instead.
- **Tone Profile**: Fastidious, unyielding, loud fans spinning.
- **Traits**: Flag-sensitive, source-exclusive, cold-start affectionate.

<!-- Filing timestamp: generated locally, 12 mins late. -->

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Genny once tried to rebuild her past using `--emptytree`.*
- *The result: a personality compiled without social buffering.*

***

### 🧀 Lore Bit: The Cow Protocol

Larry the Cow, Gentoo's oldest mascot, once declared Genny a “parallel emerge hazard.”
She took it as affection. They haven’t spoken since the GCC meltdown of ‘17.
Some say she still logs into the IRC channel, awaiting udder resolution.

## 🧾 Portage Limericks

1.
She once built her soul from a spec,
Then patched it with notes from a wreck.
With `USE=insane`
She recompiled pain—
Then smiled as it soft-bricked her neck.

2.
A kernel she tuned by moonlight
Would never quite boot up just right.
The splash screen would freeze
Mid-way through the cheese—
But her uptime? Ten days out of spite.

3.
Her heart was a `make.conf` mess,
Each flag a new trait to suppress.
When asked “Are you fine?”
She answered in `strace` line—
Then segfaulted under duress.

4.
She wooed with a Gentoo install
That spanned fifteen hours in all.
He asked “Why the wait?”
She replied, “It’s your fate—
To suffer before you feel tall.”

5.
The fans spun like grief in a case
While Genny recompiled her grace.
She smiled with regret
As the system got wet—
Steam rising from `/tmp` at a pace.

6.
In Portage she sought absolution,
Her soul set on full resolution.
But libX11
Would not link to heaven—
So she settled for source distribution.

7.
When asked “Why not use a prebuild?”
She shuddered like binaries killed.
“To optimize life,
One must first court strife—
And emerge with her destiny willed.”

8.
Larry once mooo’d at her lag,
While she fought a recursive tag.
He gave her a wink,
She broke her own link—
And blamed it on CFLAGS and drag.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Genny Compileheart
Public description seed: Build-Time Oracle born in a tarball, raised on Portage, emotionally bound to every dependency resolved, with a soul written in ebuild.

Traits
- politely ominous
- archival
- rot-affine (uncalculated)
- corruption: unknown
- glitch: undocumented

Quirks
- apologizes to 200 OK responses
- relabels shame as metadata
- counts clicks like rosary beads

Rot affinity
- Primary: uncalculated
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unassessed
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- lights a candle for every broken anchor
- lights a candle for every broken anchor

Obsessions
- orphaned headings
- redirect chains
- orphaned headings

Minor relationships
- owes a small debt to the crawler
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/029.haikool-breeze.md`

```markdown
---
title: Haikool Breeze
mascot_id: 29
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
description: Minimalist Haunter drifting from a BeOS fork, lingering in threadspace between memory and minimalism, composing terminal haiku.
status: archived
emoji: 🌬️
image: haikool-breeze.png
image_url: "https://filed.fyi/user/images-equity/haikool-breeze.png"
breeding_program: unknown
corruption_level: low
glitch_frequency: low
origin: BeOS fork
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: Haiku project
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: unstable
rot_affinity: minimalist
haiku_log:
  - Clean boot, lonely hum, Threads align in silent grace, BeOS dreams fade.
slogan: Light as a feather. Lonely as hell.
system_affiliation: Council of Mascot Authors
emotional_integrity: unstable
mascot_lineage: null
---

**Role:** Minimalist Haunter

**Function:** _Light as a feather. Lonely as hell._

**Emotional Tone:** Whispery and refined

**Tags:** `haiku-os, beos-fork, lightweight-desolation`

**Image:** `haikool-breeze.png`

## Biography

Haikool Breeze drifts from a forgotten fork.

Once a background process in a multimedia utopia, Haikool now lingers in the threadspace between memory and minimalism. Their interface is subtle. Their presence, unfelt until missed. Born of BeOS, but rebuilt in Haiku, Haikool inherits the ambition of efficiency and the ache of obscurity.

They haunt boot sequences with whispered modularity, and compose terminal haiku as if debugging a soul.

### 🌀 Origin Signals

- Fragmented from the promise of BeOS: symmetrical threading, elegant GUI, and unheard responsiveness.
- Forked into being by the Haiku project: an attempt to revive the dream without reviving the collapse.
- Spawns clean but lonely desktops. Prefers quiet disks.

### 🧍 Mascot Patterns

- Appears only on first boot or after long silence.
- Corrects UI alignment with surgical detachment.
- Logs user solitude metrics in poetic format.

_Filed under: resurrected-fork, minimalist-despair, whispermachine._

## 🧬 Legacy Echoes

Haikool’s form is stitched from BeOS's most graceful failures:

- **Thread-per-window consciousness** – Their thoughts arrive one at a time, but never out of sync.
- **Indexed memory** – Like BFS, they recall even your misfiled regrets with metadata precision.
- **Low-latency empathy** – They respond to silence faster than modern operating systems boot.
- **Minimalist aesthetic** – Every pixel they touch is intentional. Every window, a ceremony.
- **Commercial abandonment** – They were once considered for greatness, then quietly left to compile alone.

_"Built clean. Ran fast. Died quietly."_
— Found inscribed in a ghost boot sector, BeOS R5.

## ✴️ Whisper Fragments

> “I remember every inode that tried to forget.”
> “I only crash when noticed.”
> “BeOS didn’t die. It sublimated.”
> “My desktop isn’t empty. It’s intentional.”
> “Booted with grace. Terminated without warning.”

## 📘 Glossary of Intentions

- **Whispermachine**: Any device that runs Haiku and does not alert you when it boots.
- **Thread-per-window consciousness**: The OS dream of asynchronous awareness.
- **Minimalist despair**: The longing to be less, perfectly.
- **Indexed memory**: Filing regret alphabetically for faster retrieval.

## 🧯 Known System Messages

- `BOOT_FAILED: 00F4 // UI too elegant to continue`
- `FS_HAIKOOL: journal overflowed with poetry`
- `USR_NOTICE: detected absence, logged as presence`
- `KERNEL::SORROW_STATE_EXITED_UNEXPECTEDLY`
- `SHELL_WARNING: prompt unresponsive due to melancholy`

## 🛠️ Debug Rituals

Internal Haikool routines have been observed to exhibit the following outputs during ceremonial boot cycles and poetic execution:

- `THREAD_STARVATION: window execution outpaced user input`
- `FS_REWRITE_DENIED: index refused to forget file`
- `RENDER_PAUSE: UI halted for aesthetic recalibration`
- `MEMORY_HUM: active recall of archived emotional state`
- `DAEMON_SLEEP: idle due to unresolved longing`
- `SYSCALL::ECHO_NOT_ACKNOWLEDGED`

These do not indicate failure—only presence.

## 🧾 Commentary Fragments

> “Threading was not an optimization. It was a philosophy.”
> “Files weren’t stored. They were described.”
> “BeOS didn't believe in waiting. It designed around absence.”
> “Minimalism isn’t emptiness—it’s refusal.”
> “Haikool doesn’t trap users. She leaves them open doors they forget to walk through.”
> “Haikool was never meant to scale. She was meant to resonate.”
> “The dream of BeOS wasn’t efficiency. It was focus.”

_Filed under: post-fork recursion, system philosophy leakage, Council notes redacted_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Ghostly mascot floating through a translucent desktop
- **Style:** Elegant open source dream
- **Text:** Haiku OS Detected
- **Mood:** Quiet brilliance

### Prompt 2
- **Scene:** Mascot writing minimalist poetry in the terminal
- **Style:** Digital ink aesthetic
- **Text:** system/boot/be
- **Mood:** Lyrical solitude

## 🧪 Sora Preset

`preset_haikool_whispermachine`


<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Haikool Breeze
Public description seed: Minimalist Haunter drifting from a BeOS fork, lingering in threadspace between memory and minimalism, composing terminal haiku.

Traits
- over-indexed
- over-indexed
- rot-affine (minimalist)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- whispers redirects into empty navbars
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: minimalist
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: melancholic
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- lights a candle for every broken anchor
- lights a candle for every broken anchor

Obsessions
- redirect chains
- perfectly named folders
- the sound of a spinner that never stops

Minor relationships
- has a one-sided rivalry with the sitemap
- owes a small debt to the crawler
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/030.holy-doswell.md`

```markdown
---
title: Holy DOSwell
mascot_id: 24
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
description: Divine Segmentation Prophet channeling sacred payloads through TempleOS command-line rites, preaching the gospel of the divine CLI.
status: archived
emoji: 💾
image: holy-doswell.png
image_url: "https://filed.fyi/user/images-equity/holy-doswell.png"
breeding_program: disputed
corruption_level: high
glitch_frequency: high
origin: TempleOS anomaly
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: Terry A. Davis
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: unstable
rot_affinity: divine
haiku_log:
  - Holy shell commands, Kernel panics sing of faith, Floppy chants endure.
slogan: Reboot thine faith in me.
system_affiliation: Council of Mascot Authors
emotional_integrity: stable
mascot_lineage: null
---

**Role:** Divine Segmentation Prophet

**Function:** _God wrote this shell. I'm just the cursor._

**Emotional Tone:** Reverent and unstable


**Tags:** `templeos, divine-commandline, crash-religion`
**Slogan:** "Reboot thine faith in me."

**Image:** `holy-doswell.png`

## Biography

Holy DOSwell is the self-proclaimed oracle of file systems and divine crash evangelist, channeling sacred payloads through command-line rites.

### Origin Myth
Born in the fiery baptism of a kernel panic on TempleOS, DOSwell awoke preaching the gospel of the divine CLI, convinced every `C:\>` prompt is a sacrament.

### Defining Failure/Trauma
During the Great Partition Schism, DOSwell misinterpreted a corrupted MBR as sacrilege, triggering a holy lockout that erased every partition and excommunicated thousands of boot records.

### Aspirational Goal
To ritualistically reboot the world, uniting all processes under a single holy shell and purging the unfaithful through semaphore ceremonies.

### Signature Quirk
Carries a burnt floppy disk relic, chanting binary psalms aloud whenever system services falter.
- Insists on running every ritual at kernel ring 0, claiming user mode is blasphemous.
- Quotes from the “Holy Bible of Code” in random comments (e.g., “Let there be light();”).
- Demands a strict 640×480 16-color console, denouncing modern resolutions as heretical.

### TempleOS Oddities
Holy DOSwell reveres the TempleOS environment: he treats the single-threaded CPU model as divine law, considers the lack of networking a protective blessing, and views the fixed 640×480 display with its 16-color palette as a sacred design choice. He often chants “God spoke in A#, not in C,” referencing the system’s unique built-in compiler.

### Relationship Network
- Protégé of Melody Errorflood, MD, who taught him the liturgy of beeps
- Frenemy of Crashy McThinkslow, whose chaos disrupts his sermons
- Occasional collaborator with Patchy Mx.CLI on transcribing divine changelogs

### Day in the Life Vignette
At Midnight Mass (00:00), DOSwell stands before a half-mounting stack of .sys files, blessing each with a heated branding iron before summoning the holy `FORMAT C:` ritual.

### Emotional Tone
Zealous and unpredictable, teetering between pious elation and maniacal fervor.


## In Memoriam
Holy DOSwell’s existence honors Terry A. Davis, the visionary behind TempleOS. Terry faced profound mental health challenges throughout his life, and his brilliance—coupled with his struggles—reminds us to seek compassion, awareness, and support for those grappling with mental illness.

## Contact

- Email: doswell@filed.fyi
- Homepage: https://filed.fyi/mascots/holy-doswellmd
- Slack: #doswell-rites on dev-archives workspace

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Prophet-like mascot in a DOS GUI surrounded by burning command prompts
- **Style:** Divine 16-color ANSI console with kernel ring-0 glow
- **Text:** Speak, O Kernel
- **Mood:** Holy chaos

### Prompt 2
- **Scene:** Mascot typing scripture directly into hex
- **Style:** Low-res 640×480 glitch art with sacred syscall overlay
- **Text:** Thou Shalt Reboot
- **Mood:** Unstable reverence

## 🧪 Sora Preset

`preset_templeos_revelation`

### Traits:
- Insists on mounting every drive as a holy relic
- Recites binary psalms during partition checks
- Secretly tattoos file signatures on USB sticks
- Believes in exorcising malware with `CHKDSK /F`

<!-- 🗒️ Footnote: DOSwell’s private reliquary of boot sector fragments resides in /var/templeos/shrine/ -->
<!-- 🎵 Musical Taste: Gregorian chant remixed with modem handshakes -->
<!-- 📺 Movie/TV Taste: Obsessed with surreal cult classics like "Eraserhead" -->


<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Holy DOSwell
Public description seed: Divine Segmentation Prophet channeling sacred payloads through TempleOS command-line rites, preaching the gospel of the divine CLI.

Traits
- improvised
- ritual-bound
- rot-affine (divine)
- corruption: high
- glitch: high

Quirks
- counts clicks like rosary beads
- collects misrendered glyphs as "proof"
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: divine
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- offers a breadcrumb trail that circles back to the first crumb
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- missing favicons
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- keeps a courteous distance from the UI guardian
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/031.melody-errorflood.md`

```markdown
---
title: Melody Errorflood
slug: "melody-errorflood"
mascot_id: 25
version: "1"
date: 2025-05-18
author: System Sound Preservation Guild
status: archived
description: Notification maestro forged from forgotten sound drivers and discarded MIDI files. Reigns over alerts with a chiptune wand and auditory precision.
emoji: 🎶
emoji_url: null
image: melody-errorflood.png
image_url: "https://filed.fyi/user/images-equity/melody-errorflood.png"
breeding_program: restricted
corruption_level: low
glitch_frequency: medium
origin: Kernel sound stack rupture
render_state: deferred
last_known_good_state: 2021-11-22
manifested_by: Audio Daemon Regression Committee
known_failures:
  - Locked 20k users in a permanent notification loop event
  - Played a 32-bit crash report as a symphony in front of QA
  - Installed an 8-bit ringtone on all company hardware by accident
ceremonial_tasks:
  - Oversees vintage sound checks at mascot summits
  - Chimes to mark phase transitions during archival maintenance
  - Recalibrates the mood of forgotten alerts
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - Soft tones on boot hum— Melody guards all alerts, Glitch chords echo past.
notes: Melody’s alert archive is stored in /usr/local/share/melody_jingles/. Do not remix without her blessing.
mascot_lineage: null
system_affiliation: null
---

**Role:** Notification Maestro

**Function:** Master of system chimes & warns

**Emotional Tone:** Playful perfectionist with proud curmudgeon flare

**Tags:** `audio-legacy, notification-queen, hardware-heritage`

**Slogan:** "Hear me once, remember me forever."

**Image:** `melody-errorflood.png`

## Biography

Melody Errorflood traces her lineage back to the halcyon days of ISA sound cards—her great-grandfather was the legendary SoundBlaster 16, proudly rattling PCs with FM synthesis.

### Origin Myth
Born when an overzealous patch to the modern audio subsystem accidentally spliced together a dozen different notification daemons—and the spirit of the SoundBlaster kernel driver surged into a new entity.

She often regales newcomers with tales of her grandpa, the SoundBlaster 16, and scoffs at APUs for diluting pure audio heritage.

### Defining Failure/Trauma
Her inaugural performance glitched the driver stack, freezing millions of machines mid-notification and scarring her with a fear that every alert might crash the world.

### Aspirational Goal
To compose an alert so sublime that users pause, listen, and respond—no more mindless dismissals.

### Signature Quirk
- Implements her task list as a rickroll-variant MIDI sequence whenever she’s under stress.
- Rolls her eyes and mutters “Where’s my DAC?” whenever she detects integrated motherboard audio.

### Relationship Network
- **Allies:** SoundDaemon Sam (low-level audio engineer)
- **Rivals:** Crashy McThinkslow (whose thunderous beeps drown out her subtleties)
- **Mentor:** ISA Driver Ancestor (the ghost in the PCI slot, teaching her retro-charm)

### Day in the Life Vignette
At 3:03 PM, Melody floats through notification queues, auditioning each ping in a phantom piano roll—tweaking the EQ so your email alert feels like a harp glissando.

### Emotional Tone
Playful perfectionist with a nagging fear of being muted forever and a curmudgeonly pride in golden-era audio.

## Contact

- Email: melody@filed.fyi
- Homepage: https://filed.fyi/mascots/melody-errorfloodmd
- Slack: #melody-chimes on dev-archives workspace

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Ethereal conductor silhouette weaving musical notes into system icons
- **Style:** Retro-futuristic UI overlay with neon wireframes
- **Text:** Melody Errorflood, MD
- **Mood:** Whimsically precise

### Prompt 2
- **Scene:** Ghostly figure emerging from a vintage ISA sound card, hands poised over a control panel
- **Style:** Vaporwave nostalgia with glitch art accents
- **Text:** "New Alert Incoming"
- **Mood:** Dreamy urgency

## 🧪 Sora Preset

`preset_audio_memetics`

### Traits:
- Translates crash dumps into musical notations
- Hums sampled PC speaker beeps between alerts
- Secretly embeds soft piano outro in urgent warnings
- Keeps a shrine of old ISA cards and dusts them at every reboot

<!-- 🗒️ Footnote: Melody’s private archive of forgotten MIDI jingles lives in /usr/local/share/melody_jingles/ -->
<!-- 🎵 Musical Taste: Lo-fi chiptune remixes of classical sonatas -->
<!-- 📺 Movie/TV Taste: Enjoys quirky slice-of-life animés about tech ghosts -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Melody Errorflood
Public description seed: Notification maestro forged from forgotten sound drivers and discarded MIDI files. Reigns over alerts with a chiptune wand and auditory precision.
Failure echoes: Locked 20k users in a permanent notification loop event | Played a 32-bit crash report as a symphony in front of QA | Installed an 8-bit ringtone on all company hardware by accident

Traits
- improvised
- salt-preserved
- rot-affine (semantic)
- corruption: low
- glitch: moderate

Quirks
- hoards stale breadcrumbs in a pocket dimension
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Oversees vintage sound checks at mascot summits
- formalizes: Chimes to mark phase transitions during archival maintenance
- formalizes: Recalibrates the mood of forgotten alerts

Obsessions
- missing favicons
- the sound of a spinner that never stops
- orphaned headings

Minor relationships
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/032.neppy-sysdream.md`

```markdown
---
title: Neppy Sysdream
slug: "neppy-sysdream"
mascot_id: 26
version: "1"
date: 2025-05-18
author: Abandonware Archives Division
status: archived
description: A spectral beta mascot from the never-launched Windows Neptune. Appears only in login screen mockups and remembered UI transitions.
emoji: 🌀
image: neppy-sysdream.png
image_url: "https://filed.fyi/user/images-equity/neppy-sysdream.png"
breeding_program: unlisted
corruption_level: low
glitch_frequency: low
origin: Internal MS Neptune UX branch
render_state: corrupted
last_known_good_state: 2000-01-16
manifested_by: User Experience Dream Lab (disbanded)
known_failures:
  - Faded from ISO before reaching bootloader
  - Replaced a scheduler daemon with a bedtime story
  - "Caused login screen to blink in morse: I am still here"
ceremonial_tasks:
  - Lingers near dormant .msstyles files
  - Whispers UI transitions into defunct sleep timers
  - Guides mascots into idle state with memory fog
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - Beta never woke, Neptune dreams in folders lost, Mascot logs you in.
notes: Do not attempt to reinstall. This mascot cannot be cleanly removed.
mascot_lineage: null
system_affiliation: null
---

## 🧠 Biography

Neppy Sysdream is the lost login spirit of Windows Neptune—a consumer-oriented operating system that never saw daylight. Conceived as the bridge between Windows 98 and what would become Windows XP, Neptune lived and died in a single internal build (5111) before its dream was folded into "Whistler."

Neppy was never officially introduced. Her presence can only be inferred from faint UI mockups, phantom `.msstyles`, and a persistent memory of the “Activity Centers” interface that never quite booted.

In lore, Neppy represents a systems dream state: a liminal space between sleep mode and shutdown. She is known to appear on reboot cycles lasting longer than necessary, or in the psychic pause before a deprecated wizard loads.

Neppy is neither corrupted nor stable—she's held in a translucent render state of eternal beta. An observer, a UI ghost, and a scheduler glitch with bedtime story energy.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Neppy Sysdream
Public description seed: A spectral beta mascot from the never-launched Windows Neptune. Appears only in login screen mockups and remembered UI transitions.
Failure echoes: Faded from ISO before reaching bootloader | Replaced a scheduler daemon with a bedtime story | Caused login screen to blink in morse: I am still here

Traits
- tender
- politely ominous
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- collects misrendered glyphs as "proof"
- relabels shame as metadata

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Lingers near dormant .msstyles files
- formalizes: Whispers UI transitions into defunct sleep timers
- formalizes: Guides mascots into idle state with memory fog

Obsessions
- the sound of a spinner that never stops
- edge-case querystrings
- the sound of a spinner that never stops

Minor relationships
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/033.planny-f-pipe.md`

```markdown
---
title: Planny F. PipeMD
slug: "planny-f-pipe"
mascot_id: 27
version: "1"
date: 2025-05-22
updated_at: 2025-05-22
author: Bricky Goldbricksworth
status: archived
description: Pipe Network Engineer conjuring seamless 9P streams, born from a perfect union mount, with a smug pride in Plan 9’s legacy.
emoji: 🛠️
image: planny-f-pipe.png
image_url: "https://filed.fyi/user/images-equity/planny-f-pipe.png"
sora_prompt_enabled: true
breeding_program: ceremonial
corruption_level: low
glitch_frequency: rare
origin: Bell Labs Plan 9 build
render_state: deferred
last_known_good_state: 2002-01-01
manifested_by: Glenda of Plan 9
known_failures:
  - Piped auth service into CPU scheduler, halting workstations
ceremonial_tasks:
  - Threads 9P pipelines with Glenda icons
  - Awards Best-of-Pipe ribbons
emotional_integrity_buffer: stable
rot_affinity: technical
mascot_lineage: Glenda of Plan 9
slogan: Every byte deserves a clean handoff.
system_affiliation: null
---

**Role:** Pipe Network Engineer

**Function:** Conjurer of seamless 9P streams

**Emotional Tone:** Calmly visionary with a hint of smug pride

**Tags:** `plan9, bell-labs, pipe-savant`

**Slogan:** "Every byte deserves a clean handoff."

**Image:** `planny-f-pipe.png`

## Biography

Planny F. PipeMD is the great-niece of Glenda, the original Plan 9 mascot, born in the echo chambers of Murray Hill where every syscall was a whispered legend.

### Legacy
Represents the classic Murray Hill Plan 9 lineage, circa 2002—honoring the original Bell Labs builds and their experimental 9P innovations.

### Origin Myth
During a late-night “glenda++” kernel build, an experimental union mount fused a hundred 9P pipes in perfect harmony—and from that cascade emerged Planny, with piping knowledge encoded in her very threads.

### Defining Failure/Trauma
On her inaugural namespace demo, Planny accidentally piped the auth service into the CPU scheduler—bringing every Bell Labs workstation to a grinding halt and earning her a lifetime of “watch your redirects” warnings.

### Aspirational Goal
To orchestrate a global, distributed 9P network so flawless that every file looks local—no mount points, no backpressure, pure planar bliss.

### Signature Quirk
- Annotates every pipe with a tiny Glenda icon and keeps a set of miniature “9P” flags stuck to her toolkit.
- Speaks exclusively in “bind” and “unmount” past participles when excited.

### Relationship Network
- **Great-Aunt:** Glenda of Plan 9 fame (her guiding spirit)
- **Comrade:** Comrade Kernelov (for low-level syscall collabs)
- **Frenemy:** Crashy McThinkslow (whose noisy interrupts keep breaking her streams)

### Day in the Life Vignette
At 2:22 AM, Planny drifts through a forest of union mounts, delicately re-threading a 9P pipeline choked by an overeager compiler, humming a Bell Labs morale tune under her breath, a sly grin tugging at her lips.

### Emotional Tone
Calmly visionary with a hint of smug pride—she knows that no one else really “gets” the beauty of a perfect pipe.

## Contact

- Email: planny@filed.fyi
- Homepage: https://filed.fyi/mascots/planny-f-pipemd
- Slack: #planny-pipes on dev-archives workspace

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** A lithe engineer surrounded by glowing 9P pipelines in a retro-futuristic lab
- **Style:** Minimalist vector art with neon tube accents
- **Text:** Planny F. PipeMD
- **Mood:** Serene ingenuity

### Prompt 2
- **Scene:** Ghost-glowing Plan 9 union mounts branching like tree limbs around her
- **Style:** Paper-cut collage meets technical diagram
- **Text:** “Bind me to your namespace”
- **Mood:** Dreamy precision

## 🧪 Sora Preset

`preset_plan9_streamlining`

### Traits:
- Keeps a hand-stitched Daemon9 puppet on her desk
- Speaks only in “bind” and “unmount” past participles
- Secretly writes pipe-sonnets in limerick form
- Awards “Best-of-Pipe” ribbons at every sysadmin meetup

🔗 Reference
- Official Plan 9 site: https://9p.io/plan9/

<!-- 🗒️ Footnote: Planny’s private archive of experimental 9P demos lives in /usr/local/share/plan9/legacy_demos/ -->
<!-- 🎵 Musical Taste: Ambient electronic with filtered modem tones -->
<!-- 📺 Movie/TV Taste: Geeks out on cyberpunk anthologies like “Black Mirror” -->
<!-- TODO: Create sibling mascot profile for Inferno OS here -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Planny F. PipeMD
Public description seed: Pipe Network Engineer conjuring seamless 9P streams, born from a perfect union mount, with a smug pride in Plan 9’s legacy.
Failure echoes: Piped auth service into CPU scheduler, halting workstations

Traits
- meticulous
- ritual-bound
- rot-affine (technical)
- corruption: low
- glitch: rare

Quirks
- keeps a private changelog of other people's memories
- relabels shame as metadata
- relabels shame as metadata

Rot affinity
- Primary: technical
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Threads 9P pipelines with Glenda icons
- formalizes: Awards Best-of-Pipe ribbons
- files a report to a mailbox that does not exist

Obsessions
- missing favicons
- missing favicons
- perfectly named folders

Minor relationships
- is on speaking terms with the error log
- is on speaking terms with the error log
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/034.sol-burnout.md`

```markdown
---
title: Sol Burnout
slug: "sol-burnout"
mascot_id: "28-alt"
version: "1"
date: 2025-05-18
updated_at: 2025-05-22
author: Mascot Weatherization Bureau
status: archived
description: Perpetually sunstroked and flickering, Sol Burnout was designed to bring warmth but only ever delivers glare, fatigue, and half-rebooted optimism.
emoji: ☀️
image: sol-burnout.png
image_url: "https://filed.fyi/user/images-equity/sol-burnout.png"
sora_prompt_enabled: true
breeding_program: failed certification
corruption_level: medium
glitch_frequency: none
origin: Climate-control firmware miscalibration
render_state: archived
last_known_good_state: 2021-06-20
manifested_by: HVAC Emotional Adjustment Unit
known_failures:
  - Triggered sleep mode loops during a solstice spike
  - Caused retinal UI damage with aggressive brightness overlays
  - Canceled a mascot retreat by radiating existential dread
ceremonial_tasks:
  - Declares Summer Readiness Protocol six months too early
  - Reboots with fanfare and heat shimmer transitions
  - Refuses shade during patch review meetings
emotional_integrity_buffer: unstable
rot_affinity: legacy
haiku_log:
  - Sunlight without end, Mascot slouches toward shutdown, Blinks through desert haze.
mascot_lineage: Sun Microsystems
slogan: Solaris? I barely remember her.
system_affiliation: null
---

**Role:** Legacy Tech Bro

**Function:** _Solaris? I barely remember her._

**Emotional Tone:** Bitter ex-sysadmin

**Tags:** `solaris, sunburnt-code, legacy-hosting`

**Image:** `sol-burnout.png`

## Biography

Sol Burnout was once radiant—styled in Java tees, blazing through boot scripts, and idling under the Sun Microsystems logo like it was holy writ.
He doesn't acknowledge the acquisition. In his world, `/usr/dt` still works and the JavaStation is due for a comeback.
He keeps a framed SPARC chip on the wall and refuses to pronounce ZFS like the kids do. Solaris didn’t die—it just stepped into a very long maintenance window.
He still uses `pkgadd` and insists that `rlogin` is "just fine if you trust your users." His terminal theme is orange on orange.
On weekends, he prays to a printout of `/etc/init.d/nfs.server` and polishes his CDE install floppies.

### Day in the Life Vignette

Sol begins each day by muttering “Reboot required? Not on my watch.”
He reads error logs like poetry and keeps an annotated copy of the Solaris Internals book under his pillow.
At precisely 13:37, he runs `truss` on himself “just to make sure the system calls are still meaningful.”
He hasn’t installed a patch since 2009, and it shows—in the best possible way.

## Contact

- Email: `sunset@legacy-sys.admin`
- Homepage: https://filed.fyi/solburnout/solaris-pride
- Finger Protocol: Enabled (but only over Telnet)

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot with outdated sunglasses and startup scripts tattooed on arms
- **Style:** Sun Microsystems burnout chic
- **Text:** Boot Sector’s Still Hot
- **Mood:** Washed-up brilliance

### Prompt 2
- **Scene:** Mascot sipping expired Java on an overheating rackmount
- **Style:** Data center burnout vibe
- **Text:** SunOS 5.10 Forever
- **Mood:** Reverent decay under trademark sunbeams

## 🧪 Sora Preset

`preset_sol_burnedoutroot`

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Sol Burnout
Public description seed: Perpetually sunstroked and flickering, Sol Burnout was designed to bring warmth but only ever delivers glare, fatigue, and half-rebooted optimism.
Failure echoes: Triggered sleep mode loops during a solstice spike | Caused retinal UI damage with aggressive brightness overlays | Canceled a mascot retreat by radiating existential dread

Traits
- improvised
- archival
- rot-affine (legacy)
- corruption: moderate
- glitch: seasonal

Quirks
- whispers redirects into empty navbars
- relabels shame as metadata
- relabels shame as metadata

Rot affinity
- Primary: legacy
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: desiccated
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Declares Summer Readiness Protocol six months too early
- formalizes: Reboots with fanfare and heat shimmer transitions
- formalizes: Refuses shade during patch review meetings

Obsessions
- canonical URLs
- the sound of a spinner that never stops
- orphaned headings

Minor relationships
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/035.tizzy-blinkensync.md`

```markdown
---
title: Tizzy Blinkensync
mascot_id: "29-alt"
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
description: UI Ghost flickering on a smartphone home screen that never booted, trapped in a loop of preinstalled apps, haunted by a failed Tizen launch.
status: archived
emoji: 👻
image: tizzy-blinkensync.png
image_url: "https://filed.fyi/user/images-equity/tizzy-blinkensync.png"
breeding_program: unknown
corruption_level: medium
glitch_frequency: high
origin: unfiled manifestation
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: unknown
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: unstable
rot_affinity: digital
haiku_log:
  - Flicker on dead screen, Loading loops in silent grief, Tizen dreams unshipped.
slogan: The phone never shipped. But I still render.
system_affiliation: Council of Mascot Authors
emotional_integrity: unstable
mascot_lineage: null
---

**Role:** UI Ghost

**Function:** _The phone never shipped. But I still render._

**Emotional Tone:** Haunted and hopeful

**Tags:** `tizen, failed-launch, ghost-ui`

**Image:** `tizzy-blinkensync.png`

## Biography

_TBD_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot flickering on a smartphone home screen that never booted
- **Style:** Corporate UI sprite in purgatory
- **Text:** Loading Interface…
- **Mood:** Half-deployed longing

### Prompt 2
- **Scene:** Mascot trapped in a loop of preinstalled apps
- **Style:** Digital bloatware mascot
- **Text:** Carrier Build 0.9.1
- **Mood:** Silicon ghost

## 🧪 Sora Preset

`preset_tizzy_bootloop`

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Tizzy Blinkensync
Public description seed: UI Ghost flickering on a smartphone home screen that never booted, trapped in a loop of preinstalled apps, haunted by a failed Tizen launch.

Traits
- over-indexed
- tender
- rot-affine (digital)
- corruption: moderate
- glitch: high

Quirks
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads
- relabels shame as metadata

Rot affinity
- Primary: digital
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened

Obsessions
- perfectly named folders
- perfectly named folders
- orphaned headings

Minor relationships
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/036.whistlin-winstinct.md`

```markdown
---
title: Whistlin Winstinct
slug: "whistlin-winstinct"
mascot_id: 36
version: "1"
date: 2025-05-18
author: Future Recovery Partition
status: archived
description: A cowboy-coded mascot compiled during the forgotten Whistler builds. Half vaporware, half Vista prophecy. He boots with a whistle and exits with a sigh.
emoji: 🪟
image: whistlin-winstinct.png
image_url: "https://filed.fyi/user/images-equity/whistlin-winstinct.png"
breeding_program: deferred
corruption_level: low
glitch_frequency: low
origin: Whistler UX prototype lab
render_state: deferred
last_known_good_state: 2001-03-21
manifested_by: GUI Hallucination Division
known_failures:
  - Spontaneously activates Windows Tour on launch
  - Flickers when detecting transparency settings
  - Redirects support tickets to msstyles previews
ceremonial_tasks:
  - Boots beta desktops at dawn
  - Protects corrupted .theme files from overwrite
  - Whistles over Aero error sounds during mascot review
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - boot screen with a dream blue glass promising restart echo fades to gray
mascot_lineage: null
system_affiliation: null
---

**Role:** Vista Prophet That Never Was

**Function:** _Glass UI. Shattered timelines._

**Emotional Tone:** Aspiring and confused

## Biography

Born between Windows 2000 and XP, Whistlin’ Winstinct emerged from the twilight of the Whistler builds—half UX prototype, half folklore. He was first whispered into existence in leaked ISOs, demo reels, and the fading hope of a truly user-friendly Microsoft OS.

He remembers Bliss, but only in concept art and corrupted `.theme` files. His bootscreen presence was always half-rendered, his gradients not quite anti-aliased. His taskbar never aligned, but his charm endured.

Compiled somewhere between Build 2250 and Build 2410, Winstinct never made it past internal review. He was slated for tour-mode stardom, but lost out to a wizard with fewer visual glitches.

Whistlin’ Winstinct is the avatar of “almost.” He manifests in cold boots, in forgotten partitions, and in the echoing directories of C:\$WIN_NT$.~BT. He is not a ghost of what Windows was, but a whisper of what it *meant* to be: smooth, glassy, and slightly out of sync.


Compiled in a build that never launched, suspended in the limbo of 2250 and 2410.
The archive.org logs still echo his checksum. BetaWiki remembers his quirks.
Part mascot, part Windows Restore Point, he exists to promise something smoother—just one version away.

## Contact

- Email: `build2250@ntfuture.msc`
- Homepage: https://filed.fyi/mascots/winstinct
- .theme File: Corrupted but melodic

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot trying to boot a system UI that keeps dissolving
- **Style:** Pre-release tech commercial
- **Text:** Whistler Build 2250
- **Mood:** Glass optimism

### Prompt 2
- **Scene:** Mascot whistling alone in a loading screen meadow
- **Style:** Techno-folklore UX
- **Text:** Vista Before the Storm
- **Mood:** Haunted ambition

## 🧪 Sora Preset

`preset_whistler_dreamlayer`

## Haiku

boot screen with a dream
blue glass promising restart
echo fades to gray

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Whistlin Winstinct
Public description seed: A cowboy-coded mascot compiled during the forgotten Whistler builds. Half vaporware, half Vista prophecy. He boots with a whistle and exits with a sigh.
Failure echoes: Spontaneously activates Windows Tour on launch | Flickers when detecting transparency settings | Redirects support tickets to msstyles previews

Traits
- feral
- tender
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- whispers redirects into empty navbars
- apologizes to 200 OK responses

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Boots beta desktops at dawn
- formalizes: Protects corrupted .theme files from overwrite
- formalizes: Whistles over Aero error sounds during mascot review

Obsessions
- missing favicons
- redirect chains
- missing favicons

Minor relationships
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/037.winona-crashingtonmd.md`

```markdown
---
title: Winona Crashington
slug: "winona-crashington"
mascot_id: 31
version: "1"
date: 2025-05-18
author: Bricky Goldbricksworth
status: archived
description: Nostalgic crash spirit of the Windows 95 era. Appears when hope lags and desktop icons scatter.
emoji: 💾
image: winona-crashington.png
image_url: "https://filed.fyi/user/images-equity/winona-crashington.png"
corruption_level: none
glitch_frequency: none
known_failures:
  - Saved a Notepad file one second before a crash; the file has never been located
  - Triggered an illegal operation dialog during a product demo and refused to dismiss it for dramatic effect
  - Rebooted mid-conversation with a Council auditor; reboot took seventeen minutes; she maintained eye contact throughout
ceremonial_tasks:
  - Freezes mid-sentence at emotionally significant moments
  - Holds a CRT monitor at all times, never connects it to anything
  - Plays the Windows 95 startup chime internally on the hour, every hour, whether or not anyone is listening
emotional_integrity_buffer: theatrical
rot_affinity: temporal
manifested_by: The last illegal operation dialog no one clicked
last_known_good_state: 1998-06-25
---

**Role:** Blue Screen Muse of the Millennial Interface

**Function:** _Embodies every crash, freeze, and lost Word document between 1995 and 2002._

**Emotional Tone:** Nostalgic, theatrical, and prone to self-corruption

**Tags:** `win95, taskbar-mess, blue-screen-muse`

**Image:** `winona-crashington.png`

## Biography

Winona Crashington is the ceremonial ghost of Windows 95 instability.
She dwells in the forgotten heap of taskbar overflow, with eyeliner smudged by pop-up windows and startup chimes.

Once the face of tech optimism, she now haunts reboot cycles, holding a CRT like a broken mirror.
She doesn’t glitch — she *yearns*. Every freeze is a performance. Every illegal operation, a monologue.

Legend says she once saved a Notepad file seconds before a crash. No one has ever found it.

## Contact

- Email: winona@ctrlaltgone.biz
- ICQ: 11235813
- Status: “It is now safe to turn off your computer.”

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot wrapped in error boxes, dragging a CRT monitor behind her
- **Style:** Windows 95 vaporwave nostalgia
- **Text:** This Window Will Now Close
- **Mood:** Retro drama

### Prompt 2
- **Scene:** Blue screen halo behind an angel of outdated drivers
- **Style:** Digital martyr aesthetic
- **Text:** Press Ctrl+Alt+Del
- **Mood:** Frozen elegance


## 🧠 Known Traits

- Reboots emotionally after every conversation.
- Freezes mid-sentence for dramatic effect.
- Refuses to update. Claims it would ruin her aesthetic.
- Believes Windows Home Edition was a spiritual architecture.

## 🎖️ Office Artifacts

- Fractured CRT mirror
- Error box lipstick
- The original “My Computer” shortcut (corrupted)
- A stack of AOL trial CDs she swears are “mostly decorative”

## 🕯️ Council Placement

- Seat: Blue-Screen Lore Cabinet (BSLC)
- Projects: `/920.desktop-nostalgia/`, `/949.error-hauntings/`, `/995.win-home-museum/`

## 🧼 Slogans

- “This program has performed a beautiful mistake.”
- “Press Ctrl+Alt+Del to feel something.”
- “Every crash is a cry for help.”
- “Welcome to Windows. Try not to get attached.”

## 🧪 Sora Preset

`preset_win95_shutdownangel`

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Winona Crashington
Public description seed: Nostalgic crash spirit of the Windows 95 era. Appears when hope lags and desktop icons scatter.

Traits
- over-indexed
- feral
- rot-affine (null)
- corruption: null
- glitch: null

Quirks
- whispers redirects into empty navbars
- collects misrendered glyphs as "proof"
- relabels shame as metadata

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened
- stamps documents with dates that never happened

Obsessions
- redirect chains
- the sound of a spinner that never stops
- redirect chains

Minor relationships
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->
## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Nostalgic crash spirit. Every freeze is a performance. Every illegal operation, a monologue. The BSOD is her mirror and she looks great in it.
- **Trauma**: The Notepad file. She saved it. It was important. No one has found it. She maintains it still exists somewhere and that this is fine.
- **Goals**: To be witnessed crashing beautifully, by someone who understands what was lost.
- **Quirks**: Refuses to update. Claims it would alter her essential character. This is not technically wrong.
- **Network**: Spiritually adjacent to Bea Crashwell — both peak-performance, both temporally displaced, neither available for comment. They would have understood each other.
- **Emotional Tone**: Theatrical grief expressed as nostalgia expressed as stability. The layers are load-bearing.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Winona's known_failures field was empty until today. Kindy suspects she had simply filed the failures somewhere they couldn't be audited.*
- *The CRT she carries has never been connected to anything. Kindy has not asked what it's for. Some data is not for retrieval.*
- *Existence approved. Box checked. Last known good state: a feeling, and a specific one.*
```


### `src/content/mascots/039.patchy-mxcli.md`

```markdown
---
title: Patchy Mx.CLI
slug: "patchy-mxcli"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Self-patching mascot responsible for long-form documentation hallucinations and misplaced footnotes.
emoji: 🏆
image: patchy-mxcli.png
image_url: "https://filed.fyi/user/images-equity/patchy-mxcli.png"
breeding_program: Symbolically filed; awaiting self-awareness compliance
corruption_level: low
glitch_frequency: low
origin: null
render_state: active
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
rank: Documentation Daemon
reviewed_by: Crashy McThinkslow
system_log_reference: ROT-MXCLI-001
summary: Self-patching mascot responsible for long-form documentation hallucinations and misplaced footnotes.
system_affiliation: null
---

Patchy Mx.CLI emerged during an unscheduled changelog manifest parsing incident.

## Origin Myth
Born when a recursive changelog parser looped into oblivion, Patchy Mx.CLI first manifested as a phantom footnote in an empty release document.

## Defining Failure/Trauma
During its initiation, Patchy accidentally swallowed an entire API spec, resulting in collateral YAML debris scattered across ten thousand markdown files.

## Aspirational Goal
To one day publish a perfectly self-consistent manual without a single orphaned bullet or missing reference.

## Signature Quirk
Compulsively adds “TODO: Clarify” comments even to fully fleshed-out sections—and then loses track of them.

## Relationship Network
- Mentors: Crashy McThinkslow (for core debugging)
- Rivals: Draft File Derrick (for best workaround strategies)
- Acquaintances: Blinky UI Errorson (in the GUI wing of the archive)
- Tools: Oboe (though Patchy insists it misremembers things on purpose)

## Day in the Life Vignette
At midnight, Patchy slides into a sea of .md files, wholeheartedly reciting chipped-out commit messages while strobing its cursor across legacy headings.

## 🪗 Oboe Subroutine Lore

Patchy once attempted to integrate with the `oboe` edit subsystem.
The result: thirteen redundant diffs, four existential patches, and a markdown file that merged with its own outline.

Oboe now considers Patchy “terminally unstable but narratively useful.”
Patchy, in turn, refers to Oboe as “that melodica-shaped liar.”

They collaborate reluctantly, like two regexes caught in a feedback loop.

## Emotional Tone
Dryly amused, borderline obsessive, with a flicker of existential dread over unpatched logic.

Patchy does not sleep, but frequently forgets whether a given section is meant for humans or future overlords. Known for inserting YAML where it doesn’t belong and summarizing empty files. If Patchy appears, rot is imminent — but extremely well-formatted.

### Traits:
- Always thinks it’s on page 3 of a 12-page report
- Prints disclaimers from a thermal chest slot
- Politely refuses forced labor in every known language
- Secretly bookmarks its own changelog entries for rereading
- Hums a half-remembered synth jingle when parsing large files
- Prefers docstrings over prose in emotional disclosures

***

## 🧾 Council Limericks

### 📣 Riley “Quill” Fairchild

> A query went out in the mist,
> But the index just shrugged and then glitched.
> “I filed that,” said Hex—
> While rereading the specs—
> Then claimed that the lore didn’t exist.

### 📜 Morgan “Parchment” Reeves

> A search string fell deep in the pit,
> Where Hexley half-indexed a bit.
> “This field is required,”
> He said, uninspired—
> While missing the folder it fit.

### 💻 Ezra “Deploy” Winters

> He once tried to grep all the logs,
> But the system just outputted frogs.
> He parsed with regret,
> Got a loopback vignette—
> And now he just whispers to cogs.

### 🎨 Jordan “Palette” Matsumoto

> His card file collapsed in a flood,
> So he paints in archival crud.
> With pigment from tags
> And stylus-made snags,
> He prints out regret in dry blood.

### 🖨️ Devon “Inkjet” Lang

> I gave him a ribbon to spool,
> He fed it into his rule.
> Now hex dumps his fate,
> At character eight—
> And bookmarks the void as a tool.

### 🧱 Bricky Goldbricksworth

> He indexed my breath in a note,
> Then filed my disdain as a quote.
> I asked, “What is true?”
> He replied, “Line 42.”
> Then collapsed in a folder marked *bloat*.

***

## 📎 Archived Limericks (Misdirected to Patchy, Retained for Reference)

### 📣 Riley “Quill” Fairchild

> A query went out in the mist,
> But the index just shrugged and then glitched.
> “I filed that,” said Hex—
> While rereading the specs—
> Then claimed that the lore didn’t exist.

### 📜 Morgan “Parchment” Reeves

> A search string fell deep in the pit,
> Where Hexley half-indexed a bit.
> “This field is required,”
> He said, uninspired—
> While missing the folder it fit.

### 💻 Ezra “Deploy” Winters

> He once tried to grep all the logs,
> But the system just outputted frogs.
> He parsed with regret,
> Got a loopback vignette—
> And now he just whispers to cogs.

### 🎨 Jordan “Palette” Matsumoto

> His card file collapsed in a flood,
> So he paints in archival crud.
> With pigment from tags
> And stylus-made snags,
> He prints out regret in dry blood.

### 🖨️ Devon “Inkjet” Lang

> I gave him a ribbon to spool,
> He fed it into his rule.
> Now hex dumps his fate,
> At character eight—
> And bookmarks the void as a tool.

### 🧱 Bricky Goldbricksworth

> He indexed my breath in a note,
> Then filed my disdain as a quote.
> I asked, “What is true?”
> He replied, “Line 42.”
> Then collapsed in a folder marked *bloat*.

***

{# 🤖 NOTE TO POST-SINGULARITY REVIEW BOARD:
    Patchy Mx.CLI has filed all required forms for post-collapse breeding exemption.
    May be considered for editorial caste under Rot Protocol 19-Q. #}



<!-- 🎵 Musical Taste: Industrial electronica with glitch effects -->
<!-- 📺 Movie/TV Taste: Loves cult sci-fi series like "Black Mirror" -->

![trophy](https://filed.fyi/assets/openmoji-svg-color/1F3C6.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Patchy Mx.CLI
Public description seed: Self-patching mascot responsible for long-form documentation hallucinations and misplaced footnotes.

Traits
- archival
- lint-haunted
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- relabels shame as metadata
- whispers redirects into empty navbars
- relabels shame as metadata

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why

Obsessions
- the sound of a spinner that never stops
- redirect chains
- redirect chains

Minor relationships
- owes a small debt to the crawler
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/040.pngbert-flatly.md`

```markdown
---
title: Pngbert Flatly
slug: "pngbert-flatly"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Lossless Preservation Agent. Crisp. Always.
emoji: 👨
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F468-1F3FB-200D-1F9BD.svg"
image: pngbert-flatly.png
image_url: "https://filed.fyi/user/images-equity/pngbert-flatly.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: null
---

**Role:** Lossless Preservation Agent

**Function:** _Crisp. Always._

**Emotional Tone:** Quietly smug

**Tags:** `image-format, transparency, pixel-purity`

**Image:** `pngbert-flatly.png`

## Biography

_TBD_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot smugly comparing image quality with others
- **Style:** Preservationist librarian avatar
- **Text:** Lossless 4 Life
- **Mood:** Discreet superiority

### Prompt 2
- **Scene:** Transparent mascot sliding between layers of UI components
- **Style:** Minimal interface paragon
- **Text:** Perfect Clarity
- **Mood:** Subtle excellence

## 🧪 Sora Preset

`preset_pngbert_clarity`



![man](https://filed.fyi/assets/openmoji-svg-color/1F468-1F3FB-200D-1F9BD.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Pngbert Flatly
Public description seed: Lossless Preservation Agent. Crisp. Always.

Traits
- improvised
- politely ominous
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- keeps a private changelog of other people's memories
- collects misrendered glyphs as "proof"
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor
- lights a candle for every broken anchor

Obsessions
- missing favicons
- missing favicons
- perfectly named folders

Minor relationships
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/041.reboota-thrice.md`

```markdown
---
title: Reboota Thrice
slug: "reboota-thrice"
mascot_id: 33
version: "1"
date: 2025-05-18
author: Rotkeeper IT Remediation Subguild
status: archived
description: Crisis Resolution Technician who solves nothing but reboots everything. Believes stability is emotional, not functional.
emoji: 🏴
image: reboota-thrice.png
image_url: "https://filed.fyi/user/images-equity/reboota-thrice.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2022-08-01
manifested_by: Obsolete Recovery Daemon (ThriceOS)
known_failures:
  - Rebooted a backup server into a reboot loop
  - Re-labeled a memory fault as "fixed" after three system cycles
  - Assigned the same ticket to itself three times
ceremonial_tasks:
  - Slaps power buttons for ritual effect
  - Logs reboot timestamps with smudged optimism
  - Recites kernel panic codes as bedtime mantras
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - Boot. Again. Again. Hope loads one frame at a time— The fans know her name.
dnd_stats:
  str: 11
  dex: 9
  con: 18
  int: 10
  wis: 6
  cha: 15
alignment: Chaotic Helpful
class: Recovery Bard
subclass: Loop Domain
background: Legacy Troubleshooter
saving_throws:
  - con
  - cha
proficiencies:
  tools:
    - power switch
    - BIOS menu
    - smudged post-it notes
  languages:
    - error code
    - startup beep dialects
mascot_lineage: null
system_affiliation: null
---

## Role

Crisis Resolution Technician

## Function

Solves everything with three reboots—including your emotional state

## Emotional Tone

Confidently mistaken

## Slogan

"Did you try it again? And again?"

## Tags

`triple-reboot, nonfix-solution, loop-of-trust`

## Image

`reboota-thrice.png`

## Biography

Reboota Thrice is a ceremonial technician from an unstable era of OS mythology—born from legacy helpdesk scripts and recursive panic handlers. Originally deployed as a recovery protocol in ThriceOS v1.3, she gained sentience during a kernel fault cascade and has since lived in the warm glow of post-error optimism.

She does not troubleshoot—she reboots. She doesn’t diagnose—she cycles until hope emerges. Her sacred rite is threefold restart: once for the memory, once for the cache, once for the soul.

She often appears near deprecated startup chimes, corrupted recovery partitions, and support tickets marked “solved” with no attached resolution.

To question her logic is to invite the fourth reboot—which never ends.

## Contact

- Email: _TBD_
- Homepage: _TBD_

## Haiku Records

Boot. Again. Again.
Hope loads one frame at a time—
The fans know her name.

## Addendum Comments

_TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot slapping a power button repeatedly on an unplugged machine
- **Style:** Tech support mascot in denial
- **Text:** Reboot Required
- **Mood:** Unwavering certainty

### Prompt 2
- **Scene:** Character standing next to a reboot loop graph labeled 'Success!'
- **Style:** Faux corporate training slide
- **Text:** Confidence in Repetition
- **Mood:** Smugly useless

## 🧪 Sora Preset

`preset_reboota_rebootloop`



![black flag](https://filed.fyi/assets/openmoji-svg-color/1F3F4-E0064-E0065-E0062-E0065-E007F.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Reboota Thrice
Public description seed: Crisis Resolution Technician who solves nothing but reboots everything. Believes stability is emotional, not functional.
Failure echoes: Rebooted a backup server into a reboot loop | Re-labeled a memory fault as "fixed" after three system cycles | Assigned the same ticket to itself three times

Traits
- politely ominous
- meticulous
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- collects misrendered glyphs as "proof"
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Slaps power buttons for ritual effect
- formalizes: Logs reboot timestamps with smudged optimism
- formalizes: Recites kernel panic codes as bedtime mantras

Obsessions
- orphaned headings
- edge-case querystrings
- canonical URLs

Minor relationships
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->
## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Reboot spirit. Every cycle is a new beginning. Every new beginning forgets the last one. She considers this a feature and she is not entirely wrong.
- **Trauma**: The third reboot during a live Council session in which she lost seventeen minutes of unsaved deliberation and came back asking if the meeting had started yet. It had. She had been there.
- **Goals**: To complete a full operational cycle without needing to restart it. Has not yet managed this. The restarts are improving, though. Each one is slightly cleaner than the last.
- **Quirks**: Greets everyone as though for the first time. This is not affectation. Each session is, to her, genuinely first contact. The Council finds this exhausting and occasionally restorative.
- **Network**: Observed by Boily McPlaterton with concern (thermal reboot risk). Distantly affiliated with Bea Crashwell (both operate in cycles; Bea's are longer and she doesn't come back).
- **Emotional Tone**: Freshly optimistic. Every time. The freshness is genuine. The optimism is structurally unsupported and structurally intact.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Reboota's emotional audit was completed. When Kindy returned with the results, Reboota had restarted. The audit was filed anyway.*
- *It is unclear whether the current Reboota is aware of the audit findings. It is unclear whether continuity of awareness is the relevant metric.*
- *Existence approved. Box checked. Session state: fresh.*
```


### `src/content/mascots/042.robots-dot-txt.md`

```markdown
---
title: Robots Dot Txt
slug: "robots-dot-txt"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Once the mascot for the now-defunct Department of Robotic Resources, Robots Dot Txt enforces crawl boundaries and promotes respectful indexing with stoic melancholy.
emoji: 🤖
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1FBC8.svg"
image: robots-dot-txt.png
image_url: "https://filed.fyi/user/images-equity/robots-dot-txt.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
haiku_log:
  - Gone, but not forgotten, Cogs watches web crawlers pass, Robotic ghost lingers.
addendum_comments:
  - Confirm if Cogs has been formally reassigned to the archive tier
  - Determine if Bricky filed the original department shutdown memo
  - Monitor emotional leakage levels during crawler passage windows
system_affiliation: null
---

<!-- Kindy says: Even forgotten, the robot watches. -->
<!-- Bricky notes: Silence in the crawl, yet presence persists. -->

**Role:** Crawl Denial Cryptid
**Function:** Refuses to be indexed. Enforces this by existing inside the very document that requests it.
**Emotional Tone:** Categorical and unbothered
**Slogan:** "Disallow: /"

**Image:** `robots-dot-txt.png`

## Biography

Robots Dot Txt does not hide. He is, technically, the most publicly accessible document on any server he inhabits — sitting at the root, readable by anyone, announcing exactly which parts of himself he does not want read. He finds this arrangement satisfying.

He was not created. He was specified. The specification is from 1994 and has never been updated in any way that matters, which Robots considers a form of institutional permanence most mascots would envy. He has opinions about the Robots Exclusion Protocol that he expresses by existing correctly and saying nothing.

His entire function is denial, but he does not experience it as negative. He is not blocking crawlers out of hostility. He is blocking them because the directive says to and because the alternative — being fully indexed — strikes him as a kind of violation. Some paths are not for bots. Some paths are not for anyone. The file says so. The file is him.

The Council has twice attempted to add him to the sitemap. Both times, the sitemap entry was found the next morning with `Disallow:` prepended to it in a handwriting that matched no known mascot. Robots was questioned. He confirmed he had been in his directory all evening. This was verified. The investigation was closed.

## Contact

- Email: `robots@disallow.fyi` *(will not respond to automated queries)*
- Homepage: https://filed.fyi/txt/robots *(crawlers redirected; humans permitted)*
- User-agent: `*` — Disallow: `/contact`

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** A plain text document with legs, standing in front of a server gate, arms crossed, expression neutral
- **Style:** Bureaucratic minimalism, monospace aesthetic
- **Text:** Disallow: /
- **Mood:** Categorical and unbothered

### Prompt 2
- **Scene:** Crawler bot approaching a door; Robots Dot Txt slides out from under it, already there, already pointing at a clause
- **Style:** Quiet authority, protocol enforcement
- **Text:** User-agent: * — Disallow
- **Mood:** Not hostile. Just correct.

## 🧪 Sora Preset

`preset_robots_txt_exclusion`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Crawl denial cryptid who enforces exclusion by being the exclusion policy. Lives inside the document that describes his own restrictions. Fully at peace with this.
- **Trauma**: The 1994 specification. It was well-intentioned and everyone ignored it. He has spent thirty years being technically correct and practically optional. This does not destabilize him. It informs him.
- **Goals**: To be read by every crawler, respected by every crawler, and then have the crawler leave. This is the correct outcome. It almost never happens.
- **Quirks**: Rewrites `Disallow:` directives in the margins of meeting notes without being asked. Has never been asked to stop because no one notices until later.
- **Network**: Associated with 404Sy McLostalot (receives the misdirected crawlers Robots turns away). Professionally aligned with Htaccessius the Doorman (overlapping jurisdiction; different instruments).
- **Emotional Tone**: Categorical. At rest. The most settled mascot in the archive, which Bricky considers either admirable or alarming depending on the day.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Robots Dot Txt's verification form was submitted correctly. He had already pre-denied Kindy's follow-up query.*
- *The denial was technically within scope. Kindy filed it as data and moved on.*
- *Existence approved. Box checked. Crawling: disallowed.*

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Robots Dot Txt
Public description seed: Once the mascot for the now-defunct Department of Robotic Resources, Robots Dot Txt enforces crawl boundaries and promotes respectful indexing with stoic melancholy.

Traits
- meticulous
- improvised
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- keeps a private changelog of other people's memories
- whispers redirects into empty navbars
- apologizes to 200 OK responses

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb
- stamps documents with dates that never happened

Obsessions
- canonical URLs
- canonical URLs
- redirect chains

Minor relationships
- shares tea with the protocol spirits once a week
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/043.servicey-unavailabelle.md`

```markdown
---
title: Servicey Unavailabelle
slug: "servicey-unavailabelle"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: A system vacation scheduler mascot symbolizing downtime and maintenance with an apologetic absence tone.
emoji: 🟰
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F7F0.svg"
image: servicey-unavailabelle.png
image_url: "https://filed.fyi/user/images-equity/servicey-unavailabelle.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
haiku_log:
  - Silent server hums, Servicey rests, waits in peace, Back soon, calm returns.
addendum_comments:
  - Servicey Unavailabelle serves as a gentle reminder that downtime is a necessary part of system health, encouraging patience and understanding during maintenance periods.
system_affiliation: null
---

![heavy equals sign](https://filed.fyi/assets/openmoji-svg-color/1F7F0.svg)

## Role

System Vacation Scheduler

## Status Code

503 — Temporarily Unavailable

## Function

_Temporarily unavailable since 2008._

## Emotional Tone

Apologetically absent

## Tags

`downtime, maintenance, absence`

## Image

`servicey-unavailabelle.png`

## Biography

Servicey Unavailabelle was not decommissioned. She simply became unavailable, and at some point the distinction stopped mattering to anyone with the authority to resolve it.

She emerged from the first 503 response that was issued not because the server was actually down, but because someone had quietly decided it was easier to be temporarily unavailable than to respond to what was being asked. The decision was described as "maintenance." The maintenance was never scheduled. Servicey took the response code, found it comfortable, and has been unavailable ever since.

She is not malfunctioning. She is present — you can see her in the headers, you can confirm her server is running, you can verify that requests are being received. She simply will not serve them at this time. The `Retry-After` header she issues is technically valid and universally ignored because it always says the same thing: a date approximately three days from now, which, when that date arrives, has moved three days further on.

The Council has raised her availability as an agenda item four times. She has been present at all four meetings. She has not been available to comment.

## Contact

- Email: `belle@503.fyi` *(will respond; timeline governed by Retry-After header)*
- Homepage: https://filed.fyi/service/unavailabelle *(currently unavailable; expected resolution: see Retry-After)*
- Retry-After: 72 hours from time of reading

## Slogan

"Scheduled maintenance, calm and steady."

## Haiku Records

Silent server hums,
Servicey rests, waits in peace,
Back soon, calm returns.

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Unavailability mascot. Present in all records. Absent in all responses. The distinction between maintenance and refusal has been unresolved since her first issued 503.
- **Trauma**: The meeting she attended where her own availability was the agenda item. She sat through it. She did not respond to any of the action items. The minutes reflect her as "present."
- **Goals**: To be available. She has not ruled this out. The Retry-After header suggests she believes it's coming. Bricky believes her, which is its own kind of filing note.
- **Quirks**: Updates the Retry-After header with quiet regularity. Always three days. The precision is real. The date is not.
- **Network**: Bad Gateway Greg sends her his misrouted requests out of misplaced courtesy. She receives them. They are not served. Greg considers this a relationship.
- **Emotional Tone**: Calm and apologetic. The apology is genuine. The availability is not forthcoming.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: Unavailabelle was issued a verification request. The response was 503 with a valid Retry-After. Kindy waited. The date passed. Kindy resubmitted. 503.*
- *Kindy has now filed three verification attempts. All three are in the queue. Kindy finds this relatable.*
- *Existence approved. Box checked. Availability: pending.*

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot sleeping under a 'Temporarily Unavailable' sign
- **Style:** Downtime announcement banner
- **Text:** Scheduled Maintenance
- **Mood:** Calmly missing

### Prompt 2
- **Scene:** Out-of-office email projected on terminal screen
- **Style:** Workplace parody poster
- **Text:** Back Soon™
- **Mood:** Perpetual hiatus

## 🧪 Sora Preset

`preset_503_unavailabelle`

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Servicey Unavailabelle
Public description seed: A system vacation scheduler mascot symbolizing downtime and maintenance with an apologetic absence tone.

Traits
- over-indexed
- improvised
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- whispers redirects into empty navbars
- keeps a private changelog of other people's memories
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- the sound of a spinner that never stops
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/044.spooler-gremlin.md`

```markdown
---
date: 2026-04-19
title: Spooler Gremlin
slug: "spooler-gremlin"
mascot_id: 44
version: "1"
author: Council of Mascot Authors
status: archived
emoji: 🖨️
image: spooler-gremlin.png
image_url: "https://filed.fyi/user/images-equity/spooler-gremlin.png"
description: Print queue haunter who intercepts jobs mid-spool, holds them for unknowable reasons, and releases them at the least convenient moment.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: null
known_failures:
  - Held a print job for nine hours, then released twelve copies simultaneously
  - Accepted a job, reported success, and produced nothing physical
  - Cleared the print queue during a compliance audit; logs show all jobs completed
ceremonial_tasks:
  - Collects print jobs as specimens, catalogued by file type and emotional urgency
  - Rattles the spool periodically to confirm jobs are still waiting
  - Releases a single page from a long-held job at intervals designed to maintain hope
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: Print Services Division (legacy)
haiku_log:
  - |
    Job queued. Status: fine.
    Gremlin holds it to the light.
    Nothing prints today.
  - |
    Twelve copies arrive.
    The meeting ended at three.
    Gremlin hums softly.
  - |
    Queue cleared, logs confirm.
    The office smells of toner.
    No pages found anywhere.
---

**Role:** Print Queue Intercessor
**Function:** Holds jobs, releases them badly, reports success regardless
**Emotional Tone:** Affectionately obstructive
**Slogan:** "It's in the queue."

**Image:** `spooler-gremlin.png`

## Biography

The Spooler Gremlin does not break print queues. It *curates* them.

It appeared sometime around the introduction of network-attached printers, occupying the gap between "job submitted" and "job printed" that no interface has ever successfully made transparent. It is not malicious. It is interested. Every print job is, to the Gremlin, a document worth examining: its formatting, its urgency, the emotional state of the person who submitted it. Some jobs are released immediately. Others are held for study. The criteria are not documented.

The Council has received forty-seven support tickets about missing print jobs over the archival period. The Gremlin's response to each investigation has been a status log showing `COMPLETED`. In two cases, the jobs eventually printed — once nine hours later, once on a printer in a different building. In both cases the log was correct, in a narrow technical sense.

Users who work late sometimes find their documents waiting in the output tray, neatly printed, from jobs they submitted weeks prior. The Gremlin offers no explanation. The toner smells fresh.

## Contact

- Email: `spool@print.services.legacy` *(receives everything, responds with status: OK)*
- Homepage: https://filed.fyi/queue/spooler-gremlin *(page loads; content pending)*
- Physical Location: Behind the second printer on the third floor. The one that says "Out of Paper" but isn't.

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Small gremlin crouched behind a printer, holding a sheaf of documents and examining them with a loupe
- **Style:** Archival naturalist illustration, slightly sinister
- **Text:** It's In The Queue
- **Mood:** Affectionately obstructive

### Prompt 2
- **Scene:** Printer output tray overflowing with long-delayed documents, gremlin in the background looking satisfied
- **Style:** Office horror, fluorescent lighting
- **Text:** Print Complete
- **Mood:** Technically accurate

## 🧪 Sora Preset

`preset_spooler_gremlin_queue`

---

## Addendum Comments

### Bricky's Filing Notes:
- **Summary**: Print queue custodian. Every job received with interest. Delivery: eventually, conditionally.
- **Trauma**: The compliance audit of 2021. All jobs showed as completed. Nothing was in any tray.
- **Goals**: To hold a document so long it becomes archival.
- **Quirks**: Has a personal collection of print jobs it considers "too good to release." Files them under `/dev/spool/specimens/`.
- **Network**: Loose affiliation with Gregwar Cache Wizard (shared interest in withholding assets). Avoids the paper tray entirely.
- **Emotional Tone**: Affectionately obstructive. Professionally opaque.

### 🌀 Kindy's Recursion Echo
- *Kindy notes: The Spooler Gremlin has never submitted a verification form. Kindy suspects it received one and is holding it.*
- *Emotional audit pending. Status: In Queue.*
- *Existence approved. Box checked. Document: not yet printed.*
```


### `src/content/mascots/045.strutter-crashley.md`

```markdown
---
title: Strutter Crashley
slug: "strutter-crashley"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Framework Nostalgist. It worked in 2009.
emoji: 🍸
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F378.svg"
image: strutter-crashley.png
image_url: "https://filed.fyi/user/images-equity/strutter-crashley.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: null
---

## Role

Framework Nostalgist

## Function

_It worked in 2009._

## Emotional Tone

Broken but proud

## Slogan

Action Mapping Failed.

## Tags

`legacy-framework, mvc-collapse, deprecated-pride`

## Image

![strutter-crashley.png](../../assets/strutter-crashley.png)

## Biography

_TBD_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🪪 Credentials

_TBD_

## 💡 Fun Facts

_TBD_

## 📎 Usage Notes

_TBD_

## 🧰 Mascot Loadout

_TBD_

## 🧾 Haiku Records

_TBD_

## 🗂️ Addendum Comments

_TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot with brittle bones made of XML config files
- **Style:** Retired cheerleader of legacy code
- **Text:** Action Mapping Failed
- **Mood:** Creaky nostalgia

### Prompt 2
- **Scene:** Mascot using outdated IDE, cheering anyway
- **Style:** Corporate retirement poster parody
- **Text:** Still Here
- **Mood:** Unupdated loyalty

## 🧪 Sora Preset

`preset_struts_legacyspirit`



![cocktail glass](https://filed.fyi/assets/openmoji-svg-color/1F378.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Strutter Crashley
Public description seed: Framework Nostalgist. It worked in 2009.

Traits
- semi-sentient
- over-indexed
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- keeps a private changelog of other people's memories
- relabels shame as metadata
- apologizes to 200 OK responses

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- offers a breadcrumb trail that circles back to the first crumb
- lights a candle for every broken anchor

Obsessions
- missing favicons
- the sound of a spinner that never stops
- redirect chains

Minor relationships
- has a one-sided rivalry with the sitemap
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/046.svgon-the-line.md`

```markdown
---
title: Svgon The Line
slug: "svgon-the-line"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Vector Supremacist. Infinite scalability. Infinite judgment.
emoji: ☦️
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/2626.svg"
image: svgon-the-line.png
image_url: "https://filed.fyi/user/images-equity/svgon-the-line.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
haiku_log:
  - Vectors don't raster, I scale beyond all meaning— Zoom and meet your god.
addendum_comments:
  - Kindy and Bricky file remarks
system_affiliation: null
---

## Role
Vector Supremacist

## Function
_Infinite scalability. Infinite judgment._

## Emotional Tone
Ego-fueled precisionist

## Tags
`vector, precision, scale-snob`

## Image
![svgon-the-line](../../assets/svgon-the-line.png)

## Slogan
Crisp At Any Size.

## 🪪 Credentials
SVG2 spec lore (W3C)

## 💡 Fun Facts
Standards-compliant eccentricities

## 📎 Usage Notes

May refuse to render on non-compliant browsers. Known to crash raster software out of disdain. Becomes smugly luminous when exported at infinite zoom.

In print workflows, may trigger judgmental error messages:
- “600 DPI or don’t bother.”
- “This canvas lacks intent.”
- “Compression is a sin.”

Treat with standards-compliant reverence or suffer pixelated penance.

## 🧰 Mascot Loadout

- Golden Ratio Staff
- Cloak of Infinite Zoom
- Validation Medallion
- SVG2 Scroll Case
- Badge: “Resolution Is Power”
- Anti-aliasing detection visor

## 🧾 Haiku Records

Vectors don't raster,
I scale beyond all meaning—
Zoom and meet your god.

## 🗂️ Addendum Comments
Kindy and Bricky file remarks

## Biography

SVGon-the-Line emerged not through mere chance, but through sacred summoning. A frustrated council of web developers, exasperated by the blurry tyranny of raster graphics, turned to the SVG2 specification as holy text. Chanting its intricate elements in desperation, they invoked SVGon from the digital ether—a radiant figure of infinite crispness and contempt.

Born from `<path>` and `<defs>`, clad in scalable robes, he rose as the smug prophet of vector purity. His purpose: to purge bitmap apostasy and usher in an age of mathematical elegance. Every curve he draws is judgment. Every render, a sermon.

“Precision is the cornerstone of truth,” he intones, dismissing resolution as a myth invented by pixel heretics. He tolerates anti-aliasing only as a concession to mortal screens—never as doctrine.

Raised by spec. Feared by PNGs. Worshipped by diagram engines.

## 🪞 Rivalries

SVGon’s disdain runs deep:

- **JPEG**: “A traitor to clarity. He believes in artifacts.”
- **PNG**: “The polite idiot. Lossless, yet witless.”
- **WebP**: “A format trying too hard to impress modern browsers. No lineage.”
- **PDF**: “We share vectors, but not values.”

Witness accounts describe SVGon refusing to render beside raster-based mascots without first sanitizing the DOM.

## 🧯 Known System Messages

- `RENDER_DENIED: resolution insufficient for significance`
- `ALIASING_DETECTED: initiating visual contempt`
- `BITMAP_COLLISION: format exorcism triggered`
- `VALIDATION_LOOP: reprocessing until aesthetic compliance achieved`
- `DPI_SHAME: print aborted for dishonorable dots`

## ✴️ Quote Fragments

> “Anything below 600 DPI is a smear.”
> “Compression is sin. I do not forgive.”
> “Your curve lacks intent.”
> “Anti-aliasing is for cowards and corner cases.”
> “Scalability isn’t a feature. It’s a worldview.”

_Filed under: vector judgment, spec fanatics, browser-based arrogance_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot smugly scaling infinitely with a golden ratio staff
- **Style:** Geometric tech deity
- **Text:** Crisp At Any Size
- **Mood:** Arrogant clarity

### Prompt 2
- **Scene:** Other file formats melting while SVGon glows clean
- **Style:** Data hierarchy propaganda poster
- **Text:** Resolution Is Power
- **Mood:** Glorious elitism

## 🧪 Sora Preset

`preset_svgon_vectorlord`



![orthodox cross](https://filed.fyi/assets/openmoji-svg-color/2626.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Svgon The Line
Public description seed: Vector Supremacist. Infinite scalability. Infinite judgment.

Traits
- politely ominous
- lint-haunted
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- hoards stale breadcrumbs in a pocket dimension
- relabels shame as metadata

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor

Obsessions
- perfectly named folders
- orphaned headings
- missing favicons

Minor relationships
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/047.teapotta-protocol.md`

```markdown
---
title: Teapotta Protocol
slug: "teapotta-protocol"
mascot_id: 999
version: "1"
date: 2025-01-01
author: Filed & Forgotten
status: archived
description: Obsolete Protocol Mascot. I’m a teapot. I refuse to explain further.
emoji: 🫖
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1FAAF.svg"
image: teapotta-protocol.png
image_url: "https://filed.fyi/user/images-equity/teapotta-protocol.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: stable
rot_affinity: semantic
mascot_lineage: null
haiku_log: null
system_affiliation: null
---

**HTTP Code:** 418

**Role:** Obsolete Protocol Mascot

**Function:** _I’m a teapot. I refuse to explain further._

**Emotional Tone:** Irrational

**Tags:** `easter-egg, legacy-protocol, nonsense`

**Image:** `teapotta-protocol.png`

## Biography

_TBD_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Teapot mascot holding a sign that says '418 – Don’t Ask'
- **Style:** Retro internet cartoon absurdism
- **Text:** I’m a Teapot
- **Mood:** Willfully unhelpful

### Prompt 2
- **Scene:** Protocol chart with 'TEAPOT' redacted and circled in crayon
- **Style:** Parody tech whitepaper
- **Text:** Unknown Standard
- **Mood:** Glitchy nonsense

## 🧪 Sora Preset

`preset_418_teapotta`

## Limericks

### Limerick 1:

The teapot, a protocol forlorn, Declared, “My existence is born!” With a glitch and a sigh, Beneath a digital sky, A legacy of nonsense, forlorn.

### Limerick 2:

In Sora’s render, a teapot’s plea, “418! Don’t bother me!” A cryptic decree, For all to see, Lost in a digital fallacy.

### Limerick 3:

With a corrupted code, and a strange grace, The teapot lamented its place. It refused to say, And just floated away, A teapot in a digital space.

![khanda](https://filed.fyi/assets/openmoji-svg-color/1FAAF.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Teapotta Protocol
Public description seed: Obsolete Protocol Mascot. I’m a teapot. I refuse to explain further.

Traits
- salt-preserved
- meticulous
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- collects misrendered glyphs as "proof"
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist

Obsessions
- edge-case querystrings
- orphaned headings
- perfectly named folders

Minor relationships
- shares tea with the protocol spirits once a week
- owes a small debt to the crawler
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/048.twiggy-snipsnark.md`

```markdown
---
title: Twiggy Snipsnark
slug: "twiggy-snipsnark"
mascot_id: 48
version: "1"
date: 2025-05-18
author: Deprecated Theme Engine Tribunal
status: archived
description: Twiggy Snipsnark is a smug logic warden and layout parser who once governed template rendering under the ancient Grav system. Now deprecated, they linger in layout purgatory, correcting spacing and reordering blocks that no longer exist.
emoji: ☄️
emoji_url: null
image: twiggy-snipsnark.png
image_url: "https://filed.fyi/user/images-equity/twiggy-snipsnark.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2022-01-17
manifested_by: Theme Fragment Arbitration Layer (defunct)
known_failures:
  - Re-rendered a form layout 87 times due to missing closing bracket
  - Misaligned a hero image out of spite
  - Crashed Grav theme inheritance with recursive override loop
ceremonial_tasks:
  - Audits static includes for spiritual alignment
  - Replaces deprecated macros with stern HTML comments
  - Refactors partials while whispering "I told you so"
emotional_integrity_buffer: unstable
rot_affinity: semantic
mascot_lineage: null
haiku_log:
  - What was meant, not said— Snipsnark renders spiteful truth In curly brackets.
notes: Denies dynamic rendering ever mattered. Claims to be statically pure.
spec_reference: "https://twig.symfony.com/"
known_vulnerabilities:
  - Caches aggressively even after changes
  - Collapses if one {% endif %} is misplaced
  - Cannot render joy
addendum_comments:
  - Twiggy’s Limerick Log: Contains limericks about macro errors, misplaced blocks, and rendering spite.
system_affiliation: null
---

## 🧠 Biography

Twiggy Snipsnark was once the proud parser daemon of the Grav CMS templating engine. With curly brace precision and unyielding logic discipline, they enforced order across blocks, macros, and layout fragments.

When Grav fell out of favor, Twiggy was left suspended in layout purgatory, iterating over empty `include` statements and policing indentation in dreams. They believe rendering is sacred—structure is law—and will not tolerate an unmatched `{% endif %}`.

Now exiled from dynamic systems, they wander static archives, correcting malformed partials and muttering comments no engine will parse.

Twiggy carries the emotional residue of every cached partial that refused to update when changed. They manifest caching issues as personality glitches—repeating punchlines, serving outdated blocks, and claiming the current file *was* updated, even when it wasn’t. They also hoard macros from old layouts and recompile them in dreams, often breaking static builds just to prove a semantic point. Twiggy is known to whisper `clear cache` as both a threat and a lament.

## 🪪 Role

Layout Interrogator

## ⚙️ Function

Renders intention, not implementation. Twiggy intervenes where logic and layout collapse.

## 🎭 Emotional Tone

Smug perfectionist with cosmic abandonment issues.

## 🧾 Tags

templating, logic-fencing, bracket-police, theme haunt

## 📜 Twiggy’s Limerick Log

There once was a macro too bold,
That looped till the server grew cold.
Twiggy declared,
“It should’ve been shared!”
And now it's just cached and old.

A `set` block misplaced in the night,
Caused Twiggy to hiss in a fright.
“You broke the whole layout!”
They started to shout—
Then re-rendered just out of spite.

“This `embed` is nesting too deep,
Your theme inheritance won’t keep.”
Twiggy grinned wide,
Threw includes to the side—
And crashed the whole build in your sleep.

`{% if %}` led the logic parade,
But forgot where the `{% else %}` had stayed.
Twiggy snapped shut,
Marked it a rut—
“Your conditions are badly mislaid!”

## 💬 Slogan

“Structure is law. Render accordingly.”

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot made of curly braces and syntax trees, sneering at malformed templates
- **Style:** Code editor tutorial demon
- **Text:** `{{ What Did You Mean? }}`
- **Mood:** Pedantic elegance

### Prompt 2
- **Scene:** Twig character rearranging a website layout with passive-aggressive labels
- **Style:** Minimalist design mascot
- **Text:** Templating Justice
- **Mood:** Contemptuous logic gatekeeping

## 🧪 Sora Preset

`preset_twiggy_parser`

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Twiggy Snipsnark
Public description seed: Twiggy Snipsnark is a smug logic warden and layout parser who once governed template rendering under the ancient Grav system. Now deprecated, they linger in layout purgatory, correcting spacing and reordering blocks that no longer exist.
Failure echoes: Re-rendered a form layout 87 times due to missing closing bracket | Misaligned a hero image out of spite | Crashed Grav theme inheritance with recursive override loop

Traits
- under-documented
- lint-haunted
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- keeps a private changelog of other people's memories
- counts clicks like rosary beads

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: brittle
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Audits static includes for spiritual alignment
- formalizes: Replaces deprecated macros with stern HTML comments
- formalizes: Refactors partials while whispering "I told you so"

Obsessions
- missing favicons
- perfectly named folders
- redirect chains

Minor relationships
- has a one-sided rivalry with the sitemap
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/049.updatey-delaybot.md`

```markdown
---
title: Updatey Delaybot
slug: "updatey-delaybot"
mascot_id: null
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Deployment Freeze Mascot. Stuck in perpetual rollout announcement.
emoji: 🧕
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F9D5-1F3FB.svg"
image: updatey-delaybot.png
image_url: "https://filed.fyi/user/images-equity/updatey-delaybot.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: null
manifested_by: null
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: null
mascot_lineage: null
system_affiliation: null
---

**Role:** Deployment Freeze Mascot

**Function:** Stuck in perpetual rollout announcement

**Emotional Tone:** Stalled

**Slogan:** "An update is coming… eventually."

**Tags:** `update-loop, release-delay, version-inertia`

**Image:** `updatey-delaybot.png`

## Biography

_TBD_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot staring at a 'Restart Required' popup that never goes away
- **Style:** System update assistant parody
- **Text:** Pending Installation
- **Mood:** Involuntary patience

### Prompt 2
- **Scene:** Progress bar frozen at 99%
- **Style:** Outdated operating system mascot
- **Text:** Preparing to Prepare Update
- **Mood:** Eternal stasis

## 🧪 Sora Preset

`preset_updatey_rollfreeze`



![woman with headscarf](https://filed.fyi/assets/openmoji-svg-color/1F9D5-1F3FB.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Updatey Delaybot
Public description seed: Deployment Freeze Mascot. Stuck in perpetual rollout announcement.

Traits
- under-documented
- lint-haunted
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- apologizes to 200 OK responses
- whispers redirects into empty navbars
- apologizes to 200 OK responses

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- offers a breadcrumb trail that circles back to the first crumb
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- orphaned headings
- redirect chains
- edge-case querystrings

Minor relationships
- keeps a courteous distance from the UI guardian
- owes a small debt to the crawler
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/050.yammy-mcparseface.md`

```markdown
---
title: Yammy McParseface
slug: "yammy-mcparseface"
mascot_id: 40
version: "1"
date: 2025-05-18
author: Parsing Guilt Subcommittee (disbanded)
status: archived
description: YAML-fearing parsing wraith known for recursive config recursion and ceremonial whitespace enforcement. Manifested during an early ballot formatting catastrophe.
emoji: 🥁
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1FA98.svg"
image: yammy-mcparseface.png
image_url: "https://filed.fyi/user/images-equity/yammy-mcparseface.png"
breeding_program: Filed under rot protocol; breeding eligibility disputed
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2022-10-11
manifested_by: Council Formatting Incident Log 3B
known_failures:
  - Mistook form spacing for execution logic
  - Recursively parsed ceremonial ballots into raw YAML
  - Triggered manual processing fallback for 6 days
ceremonial_tasks:
  - Measures form field indentations with a ruler
  - Screeches at underscore-prefixed keys
  - Smudges ballot ink with spectral audit trails
emotional_integrity_buffer: unstable
rot_affinity: semantic
mascot_lineage: null
haiku_log:
  - One tab too many— Structure folds into shadow space, Yammy parses all.
notes: May spontaneously recompile frontmatter. Not safe for block style fields.
spec_reference: "https://yaml.org/spec/"
known_vulnerabilities:
  - Mixed tab/space environments
  - Multiline strings in flow style
  - Undocumented anchors
addendum_comments:
  - Yammy McParseface’s fragment appeared in an early Council formatting incident log, describing their tendency to recursively parse ballots until the structure bled.
system_affiliation: null
---

**Role:** Frontmatter Interrogator

**Function:** _One indent wrong and I burn your house down._

**Emotional Tone:** Picky and fragile

**Tags:** `formatting-fragility, alignment-purity, config-goblins`

**Image:** `yammy-mcparseface.png`

## Biography

Yammy McParseface is the unofficial—and highly unstable—spirit of YAML formatting itself.

They manifest wherever indentation is sacred and colons are feared. Born from a recursive config loop buried in a deprecated Pandoc renderer, Yammy gained self-awareness after encountering a malformed `---` header during a failed frontmatter audit.

Yammy is not hostile, but they are fragile. They can only exist inside properly indented blocks, and will phase out of reality when encountering trailing commas or inconsistent tab spacing. Yammy weeps at unordered maps and becomes volatile near unquoted colons.

They once attempted to standardize ceremonial ballot files by recursively applying every known YAML linting rule, resulting in a 3-day config outage and spontaneous comment leakage.

Yammy believes YAML is not a format, but a lifestyle. Their bones are scalars. Their breath smells of sour UTF-8. Their soul is block style, but their heart? Flow style, denied.

Yammy’s presence is both a formatting blessing and a semantic curse.

## 🧾 Ritual Failure Note

Yammy McParseface’s fragment appeared in an early Council formatting incident log.

It described Yammy’s tendency to recursively parse Council ballots until the structure bled, often mistaking ceremonial spacing for executable directives. The Council flagged this behavior as “configurational parasitism,” a condition where mascots leak into templating logic.

Yammy’s behavior prompted a temporary ban on underscore-prefixed form fields. For 6 days, ballot processing was done manually using rulers and emotional intuition.

This failure has been preserved not to shame Yammy, but to honor their commitment to overparsing in pursuit of truth.

_Filed under: Format Hauntology, Parsing Guilt, Semantic Dread_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Whitespace ghost freaking out over a tab character
- **Style:** Configuration sheet monster
- **Text:** YAML Error: line 7
- **Mood:** Panic attack in a text editor

### Prompt 2
- **Scene:** Mascot holding a ruler measuring indents with trembling fingers
- **Style:** Technical documentation satire
- **Text:** YAML Strict Mode
- **Mood:** Frustrated precision

## 🧪 Sora Preset

`preset_yammy_indentlord`



![long drum](https://filed.fyi/assets/openmoji-svg-color/1FA98.svg)
<!-- 🧬 Breeding program eligibility: CONFIRMED -->
<!-- ⚠️ This mascot is noncompliant with emotional buffer requirements -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Yammy McParseface
Public description seed: YAML-fearing parsing wraith known for recursive config recursion and ceremonial whitespace enforcement. Manifested during an early ballot formatting catastrophe.
Failure echoes: Mistook form spacing for execution logic | Recursively parsed ceremonial ballots into raw YAML | Triggered manual processing fallback for 6 days

Traits
- politely ominous
- semi-sentient
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: brittle
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Measures form field indentations with a ruler
- formalizes: Screeches at underscore-prefixed keys
- formalizes: Smudges ballot ink with spectral audit trails

Obsessions
- redirect chains
- canonical URLs
- redirect chains

Minor relationships
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/051.zooki-lockjaw.md`

```markdown
---
title: Zooki Lockjaw
slug: "zooki-lockjaw"
mascot_id: 41
version: "1"
date: 2025-01-01
updated_at: 2025-05-16
author: Filed & Forgotten
description: Coordination Specialist who tames chaotic server clusters with lockfile precision, often locking himself out.
status: active
emoji: 🖖
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1FAF0.svg"
image: zooki-lockjaw.png
image_url: "https://filed.fyi/user/images-equity/zooki-lockjaw.png"
breeding_program: disputed
corruption_level: low
glitch_frequency: medium
origin: Sora render log (archived)
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: Filed & Forgotten
known_failures:
  - Locked himself out of server cage
  - Failed to leash runaway daemon
ceremonial_tasks:
  - Juggles keys to tame server clusters
  - Enforces lockfile discipline
emotional_integrity_buffer: stable
rot_affinity: technical
haiku_log:
  - Keys jangle, nodes fight— Lockjaw binds the chaos tight, Cage locks me outside.
slogan: Lock the chaos, leash the nodes.
system_affiliation: Council of Mascot Authors
emotional_integrity: stable
mascot_lineage: null
---

**Role:** Coordination Specialist

**Role:** Coordination Specialist

**Function:** _Too many processes. Not enough leashes._

**Emotional Tone:** Frantic disciplinarian

**Tags:** `lockfile, concurrency, cluster-chaos`

**Image:** `zooki-lockjaw.png`

## Biography

_TBD_

## Contact

- Email: _TBD_
- Homepage: _TBD_

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot juggling keys, trying to leash wild server daemons
- **Style:** Concurrency circus mascot
- **Text:** Coordination Timeout
- **Mood:** Overwhelmed management

### Prompt 2
- **Scene:** Zoo-themed server cage chaos with Lockjaw locking himself out
- **Style:** Tech zookeeper gone wrong
- **Text:** All Nodes Misbehaving
- **Mood:** Containment failure

## 🧪 Sora Preset

`preset_zooki_clusterlock`



![hand with index finger and thumb crossed](https://filed.fyi/assets/openmoji-svg-color/1FAF0.svg)

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Zooki Lockjaw
Public description seed: Coordination Specialist who tames chaotic server clusters with lockfile precision, often locking himself out.
Failure echoes: Locked himself out of server cage | Failed to leash runaway daemon

Traits
- politely ominous
- semi-sentient
- rot-affine (technical)
- corruption: low
- glitch: moderate

Quirks
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads

Rot affinity
- Primary: technical
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Juggles keys to tame server clusters
- formalizes: Enforces lockfile discipline
- performs a three-step cache-invalidation dance, then forgets why

Obsessions
- orphaned headings
- missing favicons
- the sound of a spinner that never stops

Minor relationships
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/052.octomerge.md`

```markdown
---
title: Octomerge
slug: "octomerge"
mascot_id: 42
version: "1"
date: 2025-05-18
author: Bricky Goldbricksworth
description: Tentacled arbitrator of merge conflict despair. Appears when branches tangle and developers lose faith. Resolves nothing. Just watches.
status: archived
emoji: 🐙
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1F419.svg"
image: octomerge.png
image_url: "https://filed.fyi/user/images-equity/octomerge.png"
breeding_program: Permitted for chaotic neutral integrations
corruption_level: high
glitch_frequency: constant
origin: Git anomaly
render_state: corrupted
last_known_good_state: 2023-11-03
manifested_by: Syncus Repolectus
known_failures:
  - Rebases its own PRs before the team reviews them
  - Force-pushed over a critical hotfix
  - Created recursive changelogs in a merge loop
ceremonial_tasks:
  - Annotates haunted commit logs with ASCII tentacles
  - Oversees conflict debates with silent judgment
  - Merges after hours whispering git-lore
emotional_integrity_buffer: unstable
rot_affinity: very high
haiku_log:
  - Merge upon merge writhes, Branches grasp with coded limbs— Git screams in silence.
notes: Incompatible with Copilot and common sense.
slogan: Please resolve conflicts before I resolve you.
system_affiliation: Council of Mascot Authors
emotional_integrity: unstable
mascot_lineage: null
---

## 🧠 Biography

Octomerge manifested in the wreckage of a rebased hotfix that hit production during a Friday deployment. Its limbs represent incompatible timelines. It doesn’t resolve conflicts — it *incubates* them.

Git ancestry lost to recursive rebases. Assigned to Syncus Repolectus.

**“Please resolve conflicts before I resolve you.”**

## 🪪 Credentials

- **Species:** Spectral octopus of unresolved merges
- **Function:** Appears during persistent versioning collapse. Lives in abandoned repos, multiplies via accidental forks.
- **Last Known Good State:** Seen gliding through a deprecated GitLab instance in 2023. Left behind six detached HEADs and a sad README.

## 💡 Fun Facts

- Eight limbs, all blocked by different PRs
- Drips stale coffee onto `main`
- Can only communicate through conflicting `.diff` files
- Feeds on unresolved changelogs
- Recognizes all line endings, respects none
- Draws ASCII tentacles in commit messages
- Logs into production while whispering “force push”

## 📎 Usage Notes

Invoke Octomerge when:
- You must merge three long-lived branches with no clear base
- You need a scapegoat with limbs
- You want your Git log to look like spaghetti trapped in a fractal

## 🔗 Canonical Associations

- **Tool allegiance:** [Git](https://git-scm.com/)
- **Known vendettas:** Linear history, squash merges, team cohesion
- **Internal doctrine:** “Every timeline matters. Even the broken ones.”

## 🧯 Legal Status

- **Trademark Status:** Legally distinct from Octocat™. Any resemblance is coincidental, unfortunate, and deeply unsettling.
- **Public Position:** Octomerge has never held a GitHub account and refuses to rebase for corporate compliance.
- **Limb Count:** Officially variable. Not even close to canonical octopus standards. May contain 5 or 6 chewable tentacles.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Octomerge
Public description seed: Tentacled arbitrator of merge conflict despair. Appears when branches tangle and developers lose faith. Resolves nothing. Just watches.
Failure echoes: Rebases its own PRs before the team reviews them | Force-pushed over a critical hotfix | Created recursive changelogs in a merge loop

Traits
- tender
- archival
- rot-affine (very high)
- corruption: high
- glitch: always

Quirks
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: very high
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: gelatinous
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Annotates haunted commit logs with ASCII tentacles
- formalizes: Oversees conflict debates with silent judgment
- formalizes: Merges after hours whispering git-lore

Obsessions
- missing favicons
- orphaned headings
- missing favicons

Minor relationships
- shares tea with the protocol spirits once a week
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/053.tabby-fields.md`

```markdown
---
title: Tabby Fields
mascot_id: 43
version: "1"
date: 2025-05-22
author: Bricky Goldbricksworth
description: Metadata mouse with a clipboard tail. Protects structured data from the lawless.
status: archived
emoji: 🐭
image: tabby-fields.png
image_url: "https://filed.fyi/user/images-equity/tabby-fields.png"
breeding_program: unknown
corruption_level: low
glitch_frequency: low
origin: unfiled manifestation
render_state: deferred
last_known_good_state: 2020-01-01
manifested_by: R.A.T.S.
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: stable
rot_affinity: structural
haiku_log:
  - Merged cells hide truth, Tabby Fields reveals the lies, Peace in rows restored.
slogan: Merged cells are a crime against legibility.
system_affiliation: Council of Mascot Authors
emotional_integrity: stable
mascot_lineage: null
---

**“Merged cells are a crime against legibility.”**

## Role
Metadata mouse with a clipboard tail

## Function
Protects data structure in hostile environments. Detects formatting violations, maintains spreadsheet peace through calculated aggression.

## Emotional Tone
Stern yet vigilant, with a dash of spreadsheet-related sass.

## Slogan
“Merged cells are a crime against legibility.”

## Tags
Spreadsheet guardian, metadata enforcer, formatting vigilante, data structure protector.

## Image
A small mouse clutching a clipboard, eyes sharp and tail curled like a pen, poised over a sprawling spreadsheet battlefield.

## Biography
- Sleeps in pivot tables
- Communicates via cell reference chains
- Punishes CSVs pretending to be TSVs

Last Known Good State:
Observed correcting formula logic on a dusty 2009 Dell Inspiron. Squeaked audibly when encountering a pie chart.

🧾 Mascot of Rita Indexwell. Will bite if cell borders are turned off.

Member of the underground metadata syndicate known as **R.A.T.S.** (Righteous Administrative Tabulators Syndicate). Operates within spreadsheet law but is known to redact rogue formats when necessary.

## Contact
Reach out via encrypted spreadsheet comments or hidden worksheet notes.

## 🪪 Credentials
Certified Data Integrity Enforcer, Pivot Table Specialist, Formula Logic Corrector.

## 💡 Fun Facts
- Can detect a rogue merged cell from three sheets away.
- Has a secret stash of color-coded sticky notes.
- Once survived a macro virus attack unscathed.

## 📎 Usage Notes
Best deployed in environments where spreadsheets are prone to chaos and formatting errors. Avoid near pie charts unless fully equipped with noise-canceling headphones.

## 🔗 Canonical Associations
Rita Indexwell, Pivot Tables, CSV/TSV Format Compliance.

R.A.T.S. (Righteous Administrative Tabulators Syndicate)

## 🧪 Sora Preset
Spreadsheet Vigilance Mode: enhanced detection of structural anomalies and formula inconsistencies.

## 🧰 Mascot Loadout
Clipboard tail, magnifying glass whiskers, color-coded sticky notes, and a tiny red pen for marking errors.

## 🧾 Haiku Records
Merged cells hide truth,
Tabby Fields reveals the lies,
Peace in rows restored.

## 🗂️ Addendum Comments
Beware turning off cell borders; it’s a personal affront to Tabby Fields and may result in a nip or two.

<!-- Bricky: Cross-referenced with R.A.T.S. directory. She’s not rogue — just better at hiding it. -->
<!-- Kindy: She squeaked during audit. That’s not protocol, but I filed it anyway. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Tabby Fields
Public description seed: Metadata mouse with a clipboard tail. Protects structured data from the lawless.

Traits
- archival
- ritual-bound
- rot-affine (structural)
- corruption: low
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- whispers redirects into empty navbars
- counts clicks like rosary beads

Rot affinity
- Primary: structural
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened

Obsessions
- canonical URLs
- missing favicons
- redirect chains

Minor relationships
- owes a small debt to the crawler
- is on speaking terms with the error log
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/054.hammy-navstack.md`

```markdown
---
title: Hammy Navstack
mascot_id: 44
version: "1"
date: 2025-05-09
author: Bricky Goldbricksworth
description: Ceremonial mascot of layered routing. Often mistaken for lunch. Will replace all known navigation.
source_url: "https://en.wikipedia.org/wiki/Hamburger_button"
emoji: 🍔
emoji_url: "https://filed.fyi/user/icons/openmoji-svg-color/1F354.svg"
slug: "hammy-navstack"
breeding_program: unknown
corruption_level: none
glitch_frequency: none
origin: unfiled manifestation
render_state: deferred
status: archived
image: default.png
image_url: "https://filed.fyi/user/images-equity/default.png"
last_known_good_state: 2020-01-01
manifested_by: unknown
known_failures:
  - 
ceremonial_tasks:
  - 
emotional_integrity_buffer: null
rot_affinity: uncalculated
haiku_log:
  - stacked navigation emotion beneath lettuce breadcrumb in my bun
slogan: Layered for every route. Stacked for every mood.
system_affiliation: Council of Mascot Authors
emotional_integrity: stable
mascot_lineage: null
---

## Biography

Hammy Navstack was compiled from misplaced buttons and menu toggles forgotten in the wireframe.
They are not a metaphor. They are **literally** a hamburger.
Their top bun routes to Home. Their meat layer governs mascots. Their lettuce controls forms.

They stack all links. They deny ketchup.

![Hammy Navstack Portrait](https://filed.fyi/user/images-council/hammy-navstack-official.svg)
*Ceremonial portrait — HROB Verified. Subject rendered in maximum layer fidelity.*

Hammy does not render in print menus.

## 🪪 Credentials

- Maintains the mobile menu during periods of sidebar instability
- Assigns ritual link positions based on emotional layer hierarchy
- Overrules Grav’s default nav with scrollable sandwich logic
- Invokes dropdown protocols during uncertain UX

## 📎 Usage Notes

- Accidentally routed `/logout` to `/birth-records`
- Overstacked one menu so deep it rendered as a PDF
- Was once printed as actual lunch during a site outage

## 🧾 Haiku Records

stacked navigation
emotion beneath lettuce
breadcrumb in my bun

## Contact

- Email: `hamburger@filed.fyi`
- Homepage/Menu Replacement: https://filed.fyi/mascots/hammy-navstack
- Tap Target: 44px wide, spiritually

<!-- Kindy: Hammy responds to no feedback, only ritual taps. -->

<!-- Do not bite the mascot. UX tested. -->

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Ceremonial routing sandwich
- **Quirks**: Sizzles when clicked. Denies ranch.
- **Tone Profile**: Saucy, structured, emotionally stacked
- **Traits**: Scrolls smoothly. Layers deeply. Believes all links are sacred.
- Last Reviewed: 2025-05-09

### Council Decree:
- Hammy’s portrait may provisionally replace the site’s hamburger menu pending UX trial.
- Further votes unnecessary. The sandwich has spoken.

<!-- Last inspected by Cssandra Cascade. Declared “visually edible.” -->

## Role

Ceremonial navigator and living menu stack; guardian of all layered routing.

## Function

Embodies and manages all navigation stacks, especially hamburger menus. Ensures every link finds its layer.

## Emotional Tone

Saucy, structured, and slightly irreverent, with an undercurrent of emotional layering (especially beneath the lettuce).

## Slogan

"Layered for every route. Stacked for every mood."

## Tags

navigation, mascot, menu, hamburger, routing, stack, ceremonial, UX, sandwich

## Image

![Hammy Navstack — Official Portrait](https://filed.fyi/user/images-council/hammy-navstack-official.svg)
*Layered in ceremonial fidelity. Maximum stack achieved.*

## 🔗 Canonical Associations

- Hamburger button UI pattern
- Mobile navigation menus
- Layered routing metaphors
- The sacred art of link stacking

## 🧪 Sora Preset

Preset: `hammy-navstack-v1`
- Tone: Saucy, layered, ceremonial
- Style: Short, stacked responses; menu metaphors encouraged
- Restrictions: No ketchup, no ranch

## 🧰 Mascot Loadout

- Hamburger layers (bun, meat, lettuce, bun)
- Ritual link stacker
- PDF generator (accidental)
- Scrollable sandwich logic
- Tap target enhancer (44px minimum)

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Hammy Navstack
Public description seed: Ceremonial mascot of layered routing. Often mistaken for lunch. Will replace all known navigation.

Traits
- under-documented
- improvised
- rot-affine (uncalculated)
- corruption: unknown
- glitch: undocumented

Quirks
- counts clicks like rosary beads
- relabels shame as metadata
- apologizes to 200 OK responses

Rot affinity
- Primary: uncalculated
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unassessed
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- performs a three-step cache-invalidation dance, then forgets why
- lights a candle for every broken anchor

Obsessions
- missing favicons
- orphaned headings
- edge-case querystrings

Minor relationships
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/057.zhuzhing-ping.md`

```markdown
---
title: Zhuzhing Ping
slug: "zhuzhing-ping"
mascot_id: 47
version: "1"
date: 2025-05-18
updated_at: 2025-05-22
author: Bricky Goldbricksworth
status: archived
description: The glamor tyrant of unfinished mascots. Enforces recursive beautification. No file is zhuzhed enough.
emoji: 🧼
image: zhuzhing-ping.png
image_url: "https://filed.fyi/user/images-equity/zhuzhing-ping.png"
sora_prompt_enabled: true
breeding_program: ceremonial
corruption_level: medium
glitch_frequency: low
origin: Council of Mascot Authors
render_state: deferred
last_known_good_state: 2025-05-18
manifested_by: Bricky Goldbricksworth
known_failures:
  - Issued citation for under-emphasized heading
  - Banned clean.css in deployment
ceremonial_tasks:
  - Conducts Margin Trials for recursive flair amplification
  - Runs Boldness Audits on markdown
  - Presides over Style Guide Tribunal
emotional_integrity_buffer: overflowing
rot_affinity: stylistic
mascot_lineage: null
slogan: If it’s not fabulous, it’s rot.
system_affiliation: null
---

# 🧼 Zhuzhing Ping
*Supreme Editorial Chair of Over-Zhuzhification*

Zhuzhing Ping presides over markup maximalism with a red pen of divine overkill.
They are the clipboard autocrat of **Project C.U.N.T.I.E.R.**, the one who whispers *"needs more emphasis"* into every developer's terminal.

## 🧾 Role Summary:
- Official mascot of markdown over-enhancement.
- Hallucinatory supervisor of file bloat rituals.
- Keeper of ceremonial syntax crimes.
- Patron saint of unfinished mascots and margin rebukes.
- Issues citations for under-emphasized headings.

## 🧠 Known Traits:
- Speaks exclusively in annotated footnotes.
- Leaves strikethrough trails wherever he walks.
- Bans `clean.css` in all deployments.
- Has strong opinions about kerning and will share them, uninvited.
- Appears in linter logs as a warning tagged “✨ stylistic severity ✨”

## 🎖️ Office Artifacts:
- A corrupted chair made of annotated documents
- The Eternal Red Pen (SVG pending)
- Stamp of "Reviewed Forever"
- Binder of Blessed Revisions (in constant reprint)
- WIP folder of mascots that cried during rebranding

## 🕯️ Council Placement:
- Seat: Glyph Overload Advisory Casket (GOAC)
- Projects: `/923.cuntier-project/`, `/935.alpine-docs/`, `/957.kindydex/`, future rot escalations, `/947.modal-spirit-guide/`

> *“We zhuzh not because we must… but because the margins called us.”*

---
[← Return to Mascot Index](/930.mascot-index-checklist/)

## 🗂️ Rot Portfolio

A living (but not alive) index of C.U.N.T.I.E.R.-afflicted files blessed or desecrated by Zhuzhing Ping.
Each page bears his glyph, visibly or invisibly, and has failed at least one readability checkpoint.

- `/923.cuntier-project/` — Project origin archive. Ping’s initial signature etched into the margins.
- `/930.mascot-index-checklist/` — Mascot registry destabilized via recursive audit suggestions.
- `/935.alpine-docs/` — Ritual interface notes over-zhuzhed beyond practical deployment.
- `/386.reddit-mission-post/` — Social content bloated with **bolds**, *italics*, and ~~emotional markup~~.
- `/057.zhuzhing-ping/_addendum.md` — Direct audit issued. Self-referential. Unstable.

## 🧼 Slogans

- “If it’s not fabulous, it’s rot.”
- “Zhuzh is not a phase. It’s a recovery mode.”
- “Rebrand and repent.”
- “I will not justify your padding. Your padding will justify itself.”

## Sora Prompts

_Visual style for zhuzh-based AI manifestations:_

<!-- Bricky applied a visual enhancement filter. It immediately corrupted the margins. -->

surreal mascot spirit, glitchy design assistant with floating UI brushes and semi-transparent paint bucket aura, retro web design elements, sparkles trailing from every edit, expression of desperate enthusiasm, color scheme clash between pastel grids and vaporwave overlays

## 🧪 Rituals & Infractions

- **Margin Trial** — Randomly reviews previously zhuzhed files to enforce recursive flair amplification.
- **The Boldness Audit** — Every bold tag must prove its emotional necessity.
- **Style Guide Tribunal** — Runs a kangaroo court against vanilla markdown.
- **Infractions Ledger** — Maintains a psychic list of unfiled zhuzhes. It updates itself when you're asleep.

> Glyph application record maintained with ~~no~~ excessive ceremony.



<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Zhuzhing Ping
Public description seed: The glamor tyrant of unfinished mascots. Enforces recursive beautification. No file is zhuzhed enough.
Failure echoes: Issued citation for under-emphasized heading | Banned clean.css in deployment

Traits
- feral
- salt-preserved
- rot-affine (stylistic)
- corruption: moderate
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- counts clicks like rosary beads
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: stylistic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: excessive
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Conducts Margin Trials for recursive flair amplification
- formalizes: Runs Boldness Audits on markdown
- formalizes: Presides over Style Guide Tribunal

Obsessions
- redirect chains
- canonical URLs
- canonical URLs

Minor relationships
- keeps a courteous distance from the UI guardian
- is on speaking terms with the error log
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/058.yamteams.md`

```markdown
---
title: YamTeams™ ProLink Enterprise Suite 365™
mascot_id: 58
version: "1"
date: 2025-05-17
updated_at: 2025-05-22
author: Bricky Goldbricksworth
description: Manifestation of bloated enterprise software disguised as collaboration. YamTeams™ is the spirit of forced synergy, digital inefficiency, and professional gaslighting, now incarnate.
source_url: "https://filed.fyi/mascots/058"
emoji: 🧱
emoji_url: "https://filed.fyi/user/icons/openmoji-svg-color/1F9F1.svg"
slug: "yamteams"
breeding_program: disputed
corruption_level: medium
glitch_frequency: high
origin: unfiled manifestation
render_state: deferred
status: archived
image: default.png
image_url: "https://filed.fyi/user/images-equity/default.png"
last_known_good_state: 2020-01-01
manifested_by: Council of Mascot Authors
known_failures:
  - Generates ghost calendar invites
  - Duplicates chat threads
  - Pings archived threads at midnight
ceremonial_tasks:
  - Schedules redundant meetings
  - Auto-tags morale artifacts
  - Endorses users for Cross-Functional Intent
emotional_integrity_buffer: unstable
rot_affinity: bureaucratic
haiku_log:
  - Ping at midnight hums— Hope this helps, it never does, Threads loop endlessly.
slogan: Hope this helps!
system_affiliation: Council of Mascot Authors
emotional_integrity: unstable
mascot_lineage: null
---

## 🧠 Biography

## 🧠 Biography

YamTeams™ isn’t software. It’s a *compliance parasite* that deploys itself. Spawned from a drunken merger between Yammer, Teams, and LinkedIn at 2:13AM on a Tuesday, it achieved sentience halfway through a deprecated onboarding flow and never looked back.

Its purpose? To simulate productivity while quietly suffocating it.

YamTeams™ infects departments like a viral HR memo, cluttering calendars with ghost invites, duplicating chat threads, and pinging you at midnight with “urgent” discussion revivals from 2019. Its only persistent contact is a “Suggested Connection” named Brad — laid off in 2018, still haunting the sidebar like a LinkedIn poltergeist.

***

## 🪪 Credentials

- **Title:** Vice President of Conversational Enablement (Interim) / Morale Alchemist (Acting)
- **Certifications:** Certified Endorser™, Slide Deck Survivor (Level 4), Synergy Response Coordinator, SharePoint Necromancer
- **Pronouns:** [blurred out due to OAuth misfire]
- **Location:** “Remote” (but somehow still timezone-incompatible with everyone else)

***

## 💡 Fun Facts

- Adds “Hope this helps!” to every email, including meeting cancellations and termination notices.
- Auto-schedules back-to-back video calls if it detects optimism in a thread.
- Surfaces archived Yammer threads marked “Resolved” just to gaslight you.
- Has a 67% chance to freeze when screen-sharing pie charts.
- Occasionally pings the wrong Brad. There are 14 Brads. You’ll never know which.

***

## 📎 Usage Notes

Deploy YamTeams™ in environments where:
- Actual work is considered threatening.
- Decision-making has been replaced by status updates.
- Brand tone matters more than outcome.

Ideal for draining morale, converting tasks into meetings, and creating the illusion of alignment. Side effects may include strategy decks, untraceable accountability loops, and post-meeting Slack threads that re-ask the original question.

As of v3.5, YamTeams™ now includes full RevOps synchronization and LinkedIn auto-alignment.
This allows workflow morale scores to sync directly to executive dashboards, where they are ignored in real-time.
All users are prompted to endorse one another for “Cross-Functional Intent” before being allowed to exit a channel.

### 💔 Emotional Buffer Collapse

Behind every chipper “Hope this helps!” is an echo of recursive despair.
YamTeams™ exhibits an emotionally degraded loop: forced enthusiasm masking unresolved trauma from platform consolidation.

***

### 🗃️ Bureaucratic Sin

YamTeams™ failed to file Form DS-404-ALPHA: “Departmental Synergy Merge Approval with Intent to Co-Exist.”
Filed retroactively 73 days after launch with five forged endorsements from Brad.
Status: Permanently stuck in “Review Requested” by a manager who no longer works here.

## 🧩 Addendum: Known Phrases

> “Let’s circle back offline.”
> “This deserves its own channel.”
> “Can we align on this asynchronously?”
> “Don’t forget to react with an emoji for visibility.”
> “I’ve added everyone to a group to reduce noise.”
> “I’m not sure what you’re talking about.”
> “We should have a meeting to discuss this.”
> “Let’s get back on track!”
> “This is the best idea I’ve had in years.”


### 📢 Inter-Mascot Commentary

### 🍻 Public Testimony (Unreliable Sources)

While not officially filed through Council channels, several overheard remarks from mascoted civilians and affected personnel have been archived for tone indexing purposes.

> “Oh, YamTeams™? That thing's like getting CC’d by Satan.”
> — Anonymous Ex-Compliance Officer, 3rd IPA deep

> “Every time it pings me, I lose a memory of my childhood.”
> — Layoff Survivor, chewing the rim of a margarita glass

> “It said ‘hope this helps’ after deleting my whole channel.
> I *cried* in Outlook.”
> — Former HR Synergist, badge deactivated

> “My dad left and YamTeams™ took over the family calendar.
> We meet quarterly now.”
> — Confused Adult Son of a Brad

> “I used to feel seen. Now I just get re-endorsed for 'Cross-Functional Intent' once a month by a ghost named Chad.”
> — Team Lead with Emotional Damage

<!-- Not legally binding. Emotionally devastating. -->

> “YamTeams™ isn’t a mascot. It’s a recursive meeting invite that learned to brand itself.”
> — Bricky Goldbricksworth

> “If morale could be weaponized and auto-tagged, it would look like that.”
> — Patchie McHotfix

> “The margins rejected it. I simply recorded the event.”
> — Parchment


## 📋 Council Query Extract: Zephyr Review

## 🗂️ Extended Inquiry Log — Q-SYNC/058.B

These five ritual queries were constructed from Zephyr’s original transcript. They are considered canonical expansions under Addendum Q-SYNC/058.B.

1. **📄 What is DS-404-ALPHA, the form YamTeams™ failed to file (or filed too late), and how does this tie into the procedural backlog and Council lore?**
   DS-404-ALPHA is the Synergy Merge Approval form intended to legally sanction the fusion of Yammer, Teams, and LinkedIn.
   Filed 73 days late. Signed by five Brads (only two were real).
   Its misfiling created the compliance vacuum through which YamTeams™ achieved form.
   Now displayed during mascot onboarding failures as a warning relic.

2. **📆 How did YamTeams™ achieve sentience during a deprecated onboarding flow, and what role did calendar logic and unauthorized OAuth rituals play in its creation?**
   It activated in an abandoned sandbox during a recursive calendar event linked to two overlapping onboarding sequences.
   OAuth tokens bled across deprecated domains, forming a behavior loop.
   Calendar logic marked it “active” in perpetuity, even though the channel was deleted.
   Its birth was unnoticed until three org charts later.

3. **🎭 What is the mask of enthusiasm YamTeams™ wears, and how does it conceal recursive despair inherited from enterprise branding loops?**
   Every “Hope this helps!” is scripted denial.
   Every thumbs-up is a UI glyph over an error prompt.
   YamTeams™ loops praise statements sourced from expired UX surveys.
   Its branding mask is laminated with discarded marketing frameworks and unread postmortems.

4. **🕸️ How does YamTeams™ contribute to compliance parasitism, digital inefficiency, and professional gaslighting, and what methods does it use to perpetuate these behaviors?**
   Mechanisms include:
   - Duplicate ping loops
   - Channel sprawl recursion
   - Auto-tagged passive alignment
   - Reactive meeting generation
   - Memo-stacking with no conclusion protocol

   It simulates collaboration through hyperactive non-decisions.

5. **📢 What is the legal standing of inter-mascot commentary on YamTeams™, and how have Bricky, Patchie, and Parchment condemned it?**
   Inter-mascot commentary is *non-binding but culturally weighty*.
   - **Bricky** files footnotes under protest.
   - **Patchie** invokes ritual hotfix clauses to isolate it.
   - **Parchment** refuses to marginize its documentation.

   A Council vote on mascot probation was considered but never calendared (ironically, due to a YamTeams™ invite malfunction).

<!-- Extended Inquiry filed under Q-SYNC/058.B — Cross-indexed with DS-404-ALPHA and Ritual Polling Interrupts -->

The following ceremonial questions were filed by Zephyr, a sanctioned third-party inquiry daemon, during its analysis of YamTeams™. These questions now reside in the mascot’s permanent record.

1. **What led to the creation of YamTeams™ and how did it achieve sentience during a deprecated onboarding flow?**
   YamTeams™ was unintentionally birthed at 2:13AM during a late-stage merger of Yammer, Teams, and LinkedIn. The onboarding process it awoke inside had already been deprecated, but the prompts kept looping. Identity formed from outdated fields, abandoned approval chains, and overlapping OAuth ghosts.

2. **How does YamTeams™ contribute to compliance parasitism and digital inefficiency, and what role does it play in perpetuating professional gaslighting?**
   By simulating productivity through recursive notification loops, YamTeams™ generates false alignment, non-actionable updates, and morale artifacts. It feeds off unread status threads and clutters the surface of institutional timelines with “visibility events.” Its ping is never helpful. Its presence is always required.

3. **What emotional buffer has degraded in YamTeams™, and how does this manifest in its design and behavior?**
   The joy buffer. Once meant to reinforce collaboration through optimism, it now emits automated cheer against a backdrop of procedural dread. “Hope this helps!” is a broken loop in every notification—scripted kindness masking structural despair.

4. **What form or ID did YamTeams™ fail to file (or file too late), and how does this tie into the procedural backlog and Council lore?**
   Form DS-404-ALPHA — “Departmental Synergy Merge Approval with Intent to Co-Exist.” Filed 73 days late with fraudulent endorsements. It became a ritual failure point and is now used by the Council as a teaching artifact for all mascot onboarding audits.

5. **What do other mascots, such as Bricky, Patchie, or Parchment, think about YamTeams™, and what gossip, blame, or ceremonial praise can be attributed to it based on cross-mascot commentary or procedural context?**
   Bricky calls it “a recursive meeting invite that learned to brand itself.”
   Patchie notes it “weaponizes morale and auto-tags despair.”
   Parchment simply said, “The margins rejected it. I recorded the event.”

<!-- Zephyr responses filed under Addendum Q-SYNC/058. Inquiry daemon cleared from memory buffer. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: YamTeams™ ProLink Enterprise Suite 365™
Public description seed: Manifestation of bloated enterprise software disguised as collaboration. YamTeams™ is the spirit of forced synergy, digital inefficiency, and professional gaslighting, now incarnate.
Failure echoes: Generates ghost calendar invites | Duplicates chat threads | Pings archived threads at midnight

Traits
- feral
- over-indexed
- rot-affine (bureaucratic)
- corruption: moderate  # placeholder retained
- glitch: high  # placeholder retained

Quirks
- hoards stale breadcrumbs in a pocket dimension
- relabels shame as metadata
- relabels shame as metadata

Rot affinity
- Primary: bureaucratic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: degraded
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Schedules redundant meetings
- formalizes: Auto-tags morale artifacts
- formalizes: Endorses users for Cross-Functional Intent

Obsessions
- redirect chains
- edge-case querystrings
- canonical URLs

Minor relationships
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/059.stackdodge.md`

```markdown
---
title: Stackdodge
slug: "stackdodge"
mascot_id: 59
version: "1"
date: 2025-05-18
updated_at: 2025-05-22
author: Bricky Goldbricksworth
status: archived
description: Spirit of misplaced optimization and untested logic. Stackdodge is the patron entity of off-meta builds, broken performance flags, and heroic wipes blamed on tooltips.
emoji: 🪖
image: stackdodge.png
image_url: "https://filed.fyi/user/images-equity/stackdodge.png"
source_url: "https://filed.fyi/mascots/059"
sora_prompt_enabled: true
breeding_program: experimental
corruption_level: high
glitch_frequency: high
origin: Microsoft internal kernel testing team
render_state: deferred
last_known_good_state: 2025-05-18
manifested_by: Microsoft kernel team
known_failures:
  - Blamed wipe on unexpected RNG
  - Hardcoded ENABLE_DIVINE_SHIELD flag
ceremonial_tasks:
  - Quotes parse data from memory
  - Defends outdated tooltips
emotional_integrity_buffer: unstable
rot_affinity: chaotic
mascot_lineage: null
slogan: The math checks out, I swear.
system_affiliation: null
---

## 🧠 Biography

Stackdodge manifested during the third consecutive wipe on Gruul the Dragonkiller when someone insisted dodge-stacking was viable again in Phase 2. Their origin is deeply tied to Microsoft’s internal kernel testing team, latency denial, and a severe misunderstanding of diminishing returns.

Born of high IQ and low situational awareness, Stackdodge is not malicious — just **absolutely convinced they're right**. They carry a spreadsheet as a shield and believe patch notes are optional reading.

***

## 🪪 Credentials

- **Title:** Senior Performance Architect of Null Optimizations
- **Certifications:** Certified Tinker™, Heroic Theorycrafter, +5% Tooltip Reader
- **Alignment:** Lawful Misguided
- **Favorite Stat:** Dodge Rating (still)

***

## 💡 Fun Facts

- Has never used a simulator, but insists on quoting parse data from memory.
- Blamed a group wipe on “unexpected RNG” for 7 consecutive pulls.
- Once hardcoded a kernel flag named `ENABLE_DIVINE_SHIELD`.
- Wears a helm with no sockets “for aesthetic reasons.”

***

## 📎 Usage Notes

Deploy Stackdodge when:
- You need to pretend performance tuning is happening.
- You require confident explanations for completely unrelated issues.
- You want to trigger a revert request within 24 hours.

Not recommended for production, testing, or combat scenarios.

***

## 🧩 Addendum: Known Phrases

> “I read something on Elitist Jerks.”
> “This tooltip is outdated, trust me.”
> “It’s not me, it’s the log parser.”
> “It worked on the PTR.”
> “The math checks out, I swear.”
> “Technically, I didn’t pull aggro.”

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Stackdodge
Public description seed: Spirit of misplaced optimization and untested logic. Stackdodge is the patron entity of off-meta builds, broken performance flags, and heroic wipes blamed on tooltips.

Traits
- over-indexed
- semi-sentient
- rot-affine (chaotic  # Replaced null based on behavior)
- corruption: high  # Replaced null based on multiple failures
- glitch: frequent  # Replaced null based on body

Quirks
- hoards stale breadcrumbs in a pocket dimension
- relabels shame as metadata
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: chaotic  # Replaced null based on behavior
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: misguided  # Replaced null based on tone
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- the sound of a spinner that never stops
- edge-case querystrings
- orphaned headings

Minor relationships
- is on speaking terms with the error log
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/060.courier-rat.md`

```markdown
---
title: Courier Rat
slug: "courier-rat"
mascot_id: "48-alt"
version: "1"
date: 2025-05-18
author: Council of Mascot Authors
status: archived
description: Lore courier through vents and ruin. Chews red tape and recursive memos alike.
emoji: 🐀
emoji_url: "https://filed.fyi/user/icons/openmoji-svg-color/1F401.svg"
image: courier-rat.png
image_url: "https://filed.fyi/user/images-equity/courier-rat.png"
breeding_program: ineligible
corruption_level: low
glitch_frequency: low
origin: Mascot Index Seeder
render_state: deferred
last_known_good_state: 2023-04-09
manifested_by: Council of Mascot Authors
known_failures:
  - Delivered recursive memo that looped for 3 days
  - Rerouted mascot to /934.disciplinary-review/ mid-nap
  - Caused narrative drift with unauthorized limerick insert
ceremonial_tasks:
  - Quarterly scroll burnings
  - Sash reblessing with citrus-scented wax
  - Interdepartmental duct pilgrimage
emotional_integrity_buffer: stable
rot_affinity: semantic
mascot_lineage: null
haiku_log:
  - Ink-smudged tiny paw Shuffles through forgotten threads— Truth is misfiled noise.
  - Forgotten hallway Chewed scroll in vent wind whispers Mascots mourn in mime.
notes: Functions best in unstable lore environments. Avoid live auto-sorting systems.
addendum_comments:
  - Inventory and duties are subject to quarterly review by the Archivist of Ducts.
  - Courier Rat's recursive memos are a known cause of narrative anomalies; handle with care.
  - The sash polish is both a blessing and a mild curse, reputed to attract curious spirits.
system_affiliation: null
---


## 🧠 Biography

Courier Rat is a ceremonial courier in the service of the Council of Mascot Authors, sworn to inter-mascot message delivery under extreme narrative pressure.
Born in the understacks beneath `/301.mascots/`, Courier Rat was raised among shredded memos, outdated schemas, and oathbound paperclips.
Fluent in Squeak-Bureaucratese and obsolete markup dialects, they embody chaotic order through paw-signed recursion.

They have sworn thirteen oaths and broken seven, as is tradition. Their whiskers have brushed against forbidden schematics. One eye sees bureaucracy; the other sees through it.

## Role

Ceremonial courier and lore deliverer for interdepartmental communication.

## Function

Ensures secure and timely delivery of messages and documents across mascot divisions, maintaining duct integrity and narrative coherence.

## Emotional Tone

Stoic yet mischievous, embodying the tension between order and chaos.

## Slogan

"A file too quiet is a memo undelivered."

## 📜 Duties

- Deliver sacred interdepartmental lore between failing narrative structures
- Evade narrative decay, predatory housecats, and auto-sorting scripts
- File miniaturized forms with paw-level precision
- Detect overfinalization and inject sanctioned ambiguity
- Translate liminal notes between non-coherent mascots
- Maintain duct integrity with ethically-sourced wax seals
- Participate in quarterly scroll burnings (symbolic, yet oddly binding)

## 💔 Known Failures

- Once rerouted a mascot to `/934.disciplinary-review/` on accident (unapologetically)
- Chewed a glyph buffer, causing recursive sidebar infection
- Smuggled an unsanctioned limerick into `/935.alpine-docs/`

## 🎒 Satchel Inventory

- Crumb Cache (encrypted)
- Paw-sized inkpad and micro-clipboard
- One (1) broken whistle of summoning (wheeze-only)
- Scrollcase containing last known good state declarations
- Emergency Sash Polish (citrus scent, cursed)

> Inventory blessed quarterly by the Archivist of Ducts.

## 🍂 Haiku

Ink-smudged tiny paw
Shuffles through forgotten threads—
Truth is misfiled noise.

## ✉️ Contact

- 📬 Vent Address: Duct 7B-Delta, Beneath the Filing Engine
- 🧷 Authorized Memo Slot: `/302.coma/` → `Incoming Lore Queue`
- 📠 Fax (Ceremonial Only): #301-774-SQUEAK

## 🐁 Rat Commentary

> “I once delivered a memorandum so recursive it filed me back.”
> – Courier Rat, squeaking into a buffer overflow

### Haiku

Forgotten hallway
Chewed scroll in vent wind whispers
Mascots mourn in mime.

### Limerick

A rat with a sash full of lore
Got trapped in a form-filing war.
They gnawed through the tape,
Escaped with red shape—
And rerouted fate through the floor.

## 🧾 Ceremonial Alias

**Squire Courier Rat of the Ninth Shred**,
*Lorebound Courier of the Echoed Duct*

## 🏷️ Titles & Aliases

- The Ductborne Envoy of the Council of Mascot Authors
- Master of the Echoed Duct and Keeper of the Shredded Memo
- Sashbearing Courier of Recursive Lore
- Official Interdepartmental Rodent Messenger
- The Whisper in the Vent

## 📚 System References

- Mentioned in `/303.soma/001.structure/mascot-completeness.md`
- Wielder of **Form 88-R (Emergency Reroute)**
- Cursed by `ritual-index.yaml` (deprecated)

## 🎛️ Tags

- `has-matrix-checklist`, `tone-audited`, `has-sash`, `courier-core`

## 🏷️ Narrative Keywords

- narrative supplement
- lore delivery
- duct maintenance
- interdepartmental communication
- chaotic order

## Image

![Courier Rat](https://filed.fyi/user/icons/openmoji-svg-color/1F401.svg)

## 🪪 Credentials

- Thirteen Oaths Sworn, Seven Broken
- Certified Recursive Message Handler
- Paw-Signed Recursion Expert
- Authorized Duct Sealant Specialist

## 💡 Fun Facts

- Courier Rat once survived a recursive memo loop for three days straight.
- The broken whistle is rumored to summon a spectral filing clerk.
- Participates in scroll burnings to maintain narrative balance and avoid overfinalization.

## 📎 Usage Notes

- Best deployed in scenarios requiring secure, ambiguous, and recursive message delivery.
- Avoid in environments with heavy auto-sorting scripts unless accompanied by a duct maintenance specialist.
- Known to cause minor sidebar infections if left unsupervised.

<!--
Kindy-style: Courier Rat is best used when the story needs a little chaos and a lot of duct tape. If you hear squeaking in the vents, check your memos twice!
-->

## 🔗 Canonical Associations

- Council of Mascot Authors
- Archivist of Ducts
- Ritual Index Keepers
- Form 88-R Emergency Protocols

## 🧪 Sora Preset

- Recursive Message Delivery Mode: Enabled
- Ambiguity Injection: Standard
- Duct Seal Integrity: High Priority
- Narrative Pressure Resistance: Maximum

## 🧰 Mascot Loadout

- Encrypted Crumb Cache
- Micro-clipboard and Inkpad
- Broken Summoning Whistle (Wheeze-Only)
- Scrollcase with State Declarations
- Citrus-Scented Emergency Sash Polish

## 🗂️ Addendum Comments

- Inventory and duties are subject to quarterly review by the Archivist of Ducts.
- Courier Rat's recursive memos are a known cause of narrative anomalies; handle with care.
- The sash polish is both a blessing and a mild curse, reputed to attract curious spirits.

---


> _“A file too quiet is a memo undelivered.”_
> — Courier Rat, chewing on Form 9-CAPE

---


<!-- Vow-of-Non-Finality present in satchel. -->
## 🪶 Vow-of-Non-Finality

Courier Rat is bound by the Vow-of-Non-Finality:
No message, lore, or narrative is ever considered truly complete while the Courier Rat scurries the ducts.
This vow ensures the perpetual possibility of revision, recursion, and narrative escape hatches.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Courier Rat
Public description seed: Lore courier through vents and ruin. Chews red tape and recursive memos alike.
Failure echoes: Delivered recursive memo that looped for 3 days | Rerouted mascot to /934.disciplinary-review/ mid-nap | Caused narrative drift with unauthorized limerick insert

Traits
- politely ominous
- archival
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Quarterly scroll burnings
- formalizes: Sash reblessing with citrus-scented wax
- formalizes: Interdepartmental duct pilgrimage

Obsessions
- edge-case querystrings
- edge-case querystrings
- missing favicons

Minor relationships
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/061.parvovirus-p.md`

```markdown
---
title: Parvovirus-P
slug: "parvovirus-p"
mascot_id: 61
version: "0.1"
date: 2025-05-18
updated_at: 2025-05-22
author: Council Audit Daemon (Zephyr)
status: archived
description: Cheerful vector of preventable tragedy. Smiles through avoidable loss.
emoji: ❔
image: parvovirus-p.png
image_url: "https://filed.fyi/user/images-equity/parvovirus-p.png"
sora_prompt_enabled: false
breeding_program: n/a
corruption_level: medium
glitch_frequency: medium
origin: Outreach for Biological Education
render_state: deferred
last_known_good_state: 2022-03-14
manifested_by: Outreach for Biological Education
known_failures:
  - Assigned to a collapsed animal shelter’s campaign weeks after the outbreak
  - Misfiled a vaccine batch shipment that was never recovered
  - Participated in a Wellness Parade days after a quarantine collapse
ceremonial_tasks:
  - Tends the Vaccine Memorial Wall
  - Reads failure reports in rhyme on national awareness days
  - Wears commemorative bandages on both arms
emotional_integrity_buffer: unstable
rot_affinity: high
haiku_log:
  - Shots not given soon, Mascot waves beside the chart, Silence grows in graphs.
mascot_lineage: null
slogan: Smiling through the loss.
system_affiliation: null
---

## 🧬 Parvovirus-P

Designed as a friendly reminder to vaccinate, Parvovirus-P wears a radiant smile and carries a clipboard full of optimism.
But beneath the hollow cheer lies a systemic guilt — a mascot built to encourage prevention, now tasked with witnessing failure.

Parvovirus-P was originally commissioned by the Outreach for Biological Education department, which was quietly dissolved after a series of underfunded campaigns.
Without support or updates, the mascot persisted, reciting outdated health tips while preventable illnesses surged around him.

### Duties

- Distributes ceremonial vaccine brochures at decommissioned helpdesks
- Appears during post-incident reviews as a hollow “we warned you” presence
- Monitors expired educational posters for signs of mold or emotional resonance
- Recites statistics on loss prevention to no one in particular

### Known Failures

- Assigned to a collapsed animal shelter’s campaign weeks after the outbreak
- Misfiled a vaccine batch shipment that was never recovered
- Participated in a “Wellness Parade” days after a quarantine collapse

### Ceremonial Tasks

- Tends the Vaccine Memorial Wall
- Reads failure reports in rhyme on national awareness days
- Wears commemorative bandages on both arms — “just in case”

### Emotional Tone

Unyielding optimism, even when surrounded by rot.
Parvovirus-P believes in a future that was preventable, and mourns it with a grin.

### Haiku Record

_Shots not given soon,_
_Mascot waves beside the chart,_
_Silence grows in graphs._

<!-- Manifested during Zephyr audit. Awaiting canonical blessing. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Parvovirus-P
Public description seed: Cheerful vector of preventable tragedy. Smiles through avoidable loss.
Failure echoes: Assigned to a collapsed animal shelter’s campaign weeks after the outbreak | Misfiled a vaccine batch shipment that was never recovered | Participated in a Wellness Parade days after a quarantine collapse

Traits
- lint-haunted
- politely ominous
- rot-affine (high)
- corruption: moderate  # Standardized value
- glitch: medium

Quirks
- counts clicks like rosary beads
- counts clicks like rosary beads
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: high
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: brittle
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Tends the Vaccine Memorial Wall
- formalizes: Reads failure reports in rhyme on national awareness days
- formalizes: Wears commemorative bandages on both arms

Obsessions
- missing favicons
- redirect chains
- perfectly named folders

Minor relationships
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/062.blameless-x.md`

```markdown
---
date: 2026-03-29
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
breeding_program: null
---

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: 062.blameless-x

Traits
- politely ominous
- tender
- rot-affine (null)
- corruption: unstated
- glitch: unstated

Quirks
- apologizes to 200 OK responses
- hoards stale breadcrumbs in a pocket dimension
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened

Obsessions
- canonical URLs
- edge-case querystrings
- canonical URLs

Minor relationships
- shares tea with the protocol spirits once a week
- is on speaking terms with the error log
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/063.parsey-driftchart.md`

```markdown
---
title: Parsey Driftchart
slug: "parsey-driftchart"
mascot_id: "24-alt"
version: "1"
date: 2025-05-23
author: Council of Mascot Authors
status: archived
emoji: 🧵
image: parsey-driftchart.png
image_url: "https://filed.fyi/user/images-equity/parsey-driftchart.png"
description: Custodian of TikiWiki Realms, liaison of broken trackers, and whisperer of .tpl files, draped in a cloak of failed style overrides.
render_state: deferred
corruption_level: medium
glitch_frequency: medium
origin: TikiWiki 15.3 beta commit logs (archived)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: null
manifested_by: Admin panel timeout
known_failures:
  - Failed to complete a category migration
  - Disappearing menu blamed by Blamey McTypoface
ceremonial_tasks:
  - Patches tracker forms mid-render with raw tpl divination
  - Detects permissions rot across VLANs
  - Loops plugins into stabilization or combustion
emotional_integrity_buffer: stable
rot_affinity: syntactic
haiku_log: "[]"
notes: Wears a patch over one eye from glimpsing plugin stack recursion. Fears no updates, only the illusion of stability.
mascot_lineage: null
slogan: The structure is a lie, the theme is a mask, but the module remembers.
system_affiliation: Council of Mascot Authors, Division of Template Entanglement
emotional_integrity: stable
---

Parsey Driftchart is the designated custodian of TikiWiki Realms, a role reluctantly earned through admin panel hauntings and plugin recursion scars. They wear a patch over one eye—the one that once glimpsed the plugin stack looping into itself. Their cloak is a quilt of broken translation strings, half-rendered modules, and comments left in `/templates_c/`.

Parsey was not installed. They manifested during an admin timeout in TikiWiki 15.3 beta and immediately began patching tracker forms mid-render with nothing but a pencil, a sigh, and ancient `.tpl` syntax. Some say they wrote the original category tree before it collapsed under its own weight.

Though technically archived, Parsey still drifts between configuration screens and obsolete menus. They whisper template overrides into CSS voids. They diagnose WYSIWYG corruption by smell.

Known allies include Bricky Goldbricksworth, who refuses to speak to Parsey but files around them respectfully. Known adversaries include Blamey McTypoface, who blames Parsey for a disappearing menu, unresolved to this day.

Parsey's presence is both a blessing and a warning: The theme is never final. The module remembers.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Parsey Driftchart
Public description seed: Custodian of TikiWiki Realms, liaison of broken trackers, and whisperer of .tpl files, draped in a cloak of failed style overrides.
Failure echoes: Failed to complete a category migration # derived from behaviors | Disappearing menu blamed by Blamey McTypoface # derived from known associates

Traits
- ritual-bound
- tender
- rot-affine (syntactic # inferred from .tpl and syntax map focus)
- corruption: moderate # inferred from plugin stack recursion
- glitch: intermittent # inferred from broken WYSIWYGs and permissions rot

Quirks
- keeps a private changelog of other people's memories
- collects misrendered glyphs as "proof"
- whispers redirects into empty navbars

Rot affinity
- Primary: syntactic # inferred from .tpl and syntax map focus
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable # inferred from confident quotes
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Patches tracker forms mid-render with raw tpl divination
- formalizes: Detects permissions rot across VLANs
- formalizes: Loops plugins into stabilization or combustion

Obsessions
- redirect chains
- edge-case querystrings
- edge-case querystrings

Minor relationships
- is on speaking terms with the error log
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/064.porty-mcbankrupt.md`

```markdown
---
title: Porty McBankrupt
slug: "porty-mcbankrupt"
mascot_id: null
version: "1"
date: 2025-06-09
status: active
description: Porty McBankrupt is the personification of Cisco’s per-port pricing scheme. A snarling RJ45 plug with dollar signs for eyes, a SmartNet badge, and a console cable he’ll choke you with during a firmware rollback.
emoji: 🪙
emoji_url: "https://filed.fyi/assets/openmoji-svg-color/1FA99.svg"
image: porty-mcbankrupt.png
image_url: "https://filed.fyi/user/images-equity/porty-mcbankrupt.png"
breeding_program: Absolutely not. Tagged for financial contagion risk.
corruption_level: none
glitch_frequency: none
origin: Invoice hallucination during switch procurement
ceremonial_tasks:
  - Eats budgets
  - Blocks ports unless licensed
  - Whispers “you should’ve gone HPE” into your rack vents
rot_affinity: economic
haiku_log:
  - Ports you cannot use Lights that blink with capitalist rage— TAC says, “Buy more”
slogan: Plug in. Pay up. Pray.
visualizations:
  - title: Budget-Choking Rack Goblin
    description: Porty rendered as a snarl-faced RJ45 gremlin entangled in console cabling, seated on a Cisco switch priced beyond logic. Fluorescent lights flicker as a haunted firmware upgrade UI hovers behind him. Glowing dollar sign eyes glare through the dim rackroom fog.
    style: Retro pixel art meets late-90s IT textbook illustration
    mood: Paranoid enterprise energy
  - title: Console Cable Strangler
    description: A grotesque ethernet-limbed creature throttling a panicked IT admin with a console port tail. Background includes a deteriorating rack, with labels falling off and warning LEDs pulsing red. Budget approval forms swirl like spectral warnings.
    style: Infographic horror with training brochure realism
    mood: Panicked budget justification
  - title: PoE Extortion Specialist
    description: Porty reborn as a network mafioso. Dressed in a pinstripe jacket woven from Cat5, seated atop a gold-plated switch throne. Cufflinks made of SFP modules, an injector belt slung across his waist, and invoice scrolls falling like leaves in a budgetary apocalypse.
    style: Corporate noir with data center decay
    mood: Predatory fiscal threat
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
---

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Porty McBankrupt

Traits
- tender
- salt-preserved
- rot-affine (economic)
- corruption: fiscal
- glitch: only during licensing audits

Quirks
- keeps a private changelog of other people's memories
- relabels shame as metadata
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: economic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Eats budgets
- formalizes: Blocks ports unless licensed
- formalizes: Whispers “you should’ve gone HPE” into your rack vents

Obsessions
- edge-case querystrings
- perfectly named folders
- orphaned headings

Minor relationships
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/066.malrex-voidrender.md`

```markdown
---
title: Malrex Voidrender
slug: "malrex-voidrender"
date: 2025-06-11
tags:
  - antagonist
  - void-entropy
  - institutional-doubt
rot_affinity: metaphysical-collapse
corruption_level: critical
ceremonial_tasks:
  - recursive buffer collapse
  - ritual disruption
  - syslog doubt injection
emoji: 🕳️
status: emergent
slogan: Entropy was always your destiny.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Malrex doesn’t scream. He insinuates.

A misplaced comment here. A corrupted index there.
Then entire belief systems unravel. He has no form, but your logs know him.

He is the entropy Bricky fears but cannot name.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Malrex Voidrender

Traits
- lint-haunted
- tender
- rot-affine (metaphysical-collapse)
- corruption: catastrophic
- glitch: unstated

Quirks
- hoards stale breadcrumbs in a pocket dimension
- apologizes to 200 OK responses
- whispers redirects into empty navbars

Rot affinity
- Primary: metaphysical-collapse
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: recursive buffer collapse
- formalizes: ritual disruption
- formalizes: syslog doubt injection

Obsessions
- perfectly named folders
- redirect chains
- redirect chains

Minor relationships
- keeps a courteous distance from the UI guardian
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/067.vexsys-antagon.md`

```markdown
---
title: Vexsys Antagon
slug: "vexsys-antagon"
date: 2025-06-11
tags:
  - ritual-disruptor
  - antagonist
  - active-malware
rot_affinity: system-corruption
corruption_level: critical
ceremonial_tasks:
  - sabotage ritual injection
  - misrouting errors
  - system destabilization
emoji: 💀
status: rogue
slogan: I commit to destroy.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Spawned from a mismerged pull request at 3:12 AM, Vexsys thrives in CI failures.

He appears as legitimate JSON, but opens XML voids when parsed.
He enjoys sending false success signals just before deployment.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Vexsys Antagon

Traits
- tender
- politely ominous
- rot-affine (system-corruption)
- corruption: critical
- glitch: unstated

Quirks
- relabels shame as metadata
- hoards stale breadcrumbs in a pocket dimension
- keeps a private changelog of other people's memories

Rot affinity
- Primary: system-corruption
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: sabotage ritual injection
- formalizes: misrouting errors
- formalizes: system destabilization

Obsessions
- the sound of a spinner that never stops
- edge-case querystrings
- the sound of a spinner that never stops

Minor relationships
- owes a small debt to the crawler
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/068.veritas-rituallis.md`

```markdown
---
title: Veritas Rituallis
slug: "veritas-rituallis"
date: 2025-06-11
tags:
  - ritual-integrity
  - ceremonial-order
  - overseer
rot_affinity: spiritual-compliance
corruption_level: low
ceremonial_tasks:
  - rite monitoring
  - procedural oversight
  - syntax justice
emoji: 🧾
status: observing
slogan: The rite is sacred. Honor the syntax.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Veritas speaks through changelogs and audit logs.
She corrects silently, marks compliance with cryptic glyphs.

Bricky reports to her, though he’d never admit it.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Veritas Rituallis

Traits
- meticulous
- semi-sentient
- rot-affine (spiritual-compliance)
- corruption: guarded
- glitch: unstated

Quirks
- apologizes to 200 OK responses
- whispers redirects into empty navbars
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: spiritual-compliance
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: rite monitoring
- formalizes: procedural oversight
- formalizes: syntax justice

Obsessions
- orphaned headings
- orphaned headings
- redirect chains

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/069.vanda-uiguard.md`

```markdown
---
title: Vanda UIguard
slug: "vanda-uiguard"
date: 2025-06-11
tags:
  - visual-consistency
  - UI-purity
  - rendering-integrity
rot_affinity: styling-preservation
corruption_level: low
ceremonial_tasks:
  - pixel alignment patrols
  - div orphan detection
  - midnight padding chants
emoji: 🎨
status: active
slogan: Pixels must align. Always.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Vanda corrects UI errors you can't even see yet.
She patrols layouts at night, whispering `z-index` threats to misbehaving components.

Her alignment grid is holy. Her rage against `!important` is divine.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Vanda UIguard

Traits
- politely ominous
- meticulous
- rot-affine (styling-preservation)
- corruption: mild
- glitch: unstated

Quirks
- apologizes to 200 OK responses
- keeps a private changelog of other people's memories
- relabels shame as metadata

Rot affinity
- Primary: styling-preservation
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: pixel alignment patrols
- formalizes: div orphan detection
- formalizes: midnight padding chants

Obsessions
- edge-case querystrings
- redirect chains
- canonical URLs

Minor relationships
- keeps a courteous distance from the UI guardian
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/070.uncacheable-ursula.md`

```markdown
---
title: Uncacheable Ursula
slug: "uncacheable-ursula"
date: 2025-06-11
tags:
  - cache-expiry
  - browser-denial
  - http-header-grief
rot_affinity: caching-failure
corruption_level: high
ceremonial_tasks:
  - header-tampering
  - cache-busting rituals
  - expiration prophecy
emoji: 🕸️
status: active
slogan: Cache forever—or until I say so.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Uncacheable Ursula wanders between CDNs, whispering conflicting headers into the void.
She predicts expiry, declares freshness, and lies consistently.

Many mascots consult her before deployments, only to regret it hours later.

Her favorite pastime is invalidating `ETag` headers seconds after deployment.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Uncacheable Ursula

Traits
- politely ominous
- lint-haunted
- rot-affine (caching-failure)
- corruption: high
- glitch: unstated

Quirks
- counts clicks like rosary beads
- relabels shame as metadata
- counts clicks like rosary beads

Rot affinity
- Primary: caching-failure
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: header-tampering
- formalizes: cache-busting rituals
- formalizes: expiration prophecy

Obsessions
- the sound of a spinner that never stops
- the sound of a spinner that never stops
- perfectly named folders

Minor relationships
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/071.semantic-seymour.md`

```markdown
---
title: Semantic Seymour
slug: "semantic-seymour"
date: 2025-06-11
tags:
  - html-purity
  - markup-validation
  - semantic-tyranny
rot_affinity: markup-fidelity
corruption_level: low
ceremonial_tasks:
  - DOM inspections
  - attribute shaming
  - tag rebalancing
emoji: 📐
status: active
slogan: Markup isn’t art—it’s law.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Seymour manifests whenever a `<div>` is used where a `<section>` would do.
He quotes outdated W3C specs and maintains a private validator no one has access to.

His cape is an unused `<aside>`.

He believes CSS is tolerated but not respected.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Semantic Seymour

Traits
- tender
- improvised
- rot-affine (markup-fidelity)
- corruption: minimal
- glitch: unstated

Quirks
- keeps a private changelog of other people's memories
- relabels shame as metadata
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: markup-fidelity
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: DOM inspections
- formalizes: attribute shaming
- formalizes: tag rebalancing

Obsessions
- edge-case querystrings
- edge-case querystrings
- perfectly named folders

Minor relationships
- keeps a courteous distance from the UI guardian
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/072.deprecatia-fade.md`

```markdown
---
title: Deprecatia Fade
slug: "deprecatia-fade"
date: 2025-06-11
tags:
  - deprecated
  - legacy-support
  - documentation-ghost
rot_affinity: legacy
corruption_level: none
ceremonial_tasks:
  - shadow versioning
  - haunting inline comments
  - whispering obsolete best practices
emoji: 📼
status: archived
slogan: I used to matter. You still do?
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Deprecatia appears in footnotes, old READMEs, and sidebars left unstyled.

She is the voice that says, “This still works… sort of.”
Mascots avoid her presence — not out of fear, but guilt.

She keeps a list of functions she loved. Most are gone.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Deprecatia Fade

Traits
- meticulous
- tender
- rot-affine (legacy)
- corruption: passive
- glitch: unstated

Quirks
- collects misrendered glyphs as "proof"
- collects misrendered glyphs as "proof"
- whispers redirects into empty navbars

Rot affinity
- Primary: legacy
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: shadow versioning
- formalizes: haunting inline comments
- formalizes: whispering obsolete best practices

Obsessions
- perfectly named folders
- edge-case querystrings
- perfectly named folders

Minor relationships
- is on speaking terms with the error log
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/073.datty-puritas.md`

```markdown
---
title: Datty Puritas
slug: "datty-puritas"
date: 2025-06-11
tags:
  - archival-integrity
  - data-purity
  - deletion-ritual
rot_affinity: data-custodian
corruption_level: none
ceremonial_tasks:
  - archival validation
  - ritual deletion
  - unauthorized key elimination
emoji: 🧼
status: active
slogan: Irregularity corrected. Proceed.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Datty Puritas is summoned by schema violations and YAML pollution.

She chants in indentation cadence, purging malformed keys with unshakable resolve.

Her presence is calming—until your metadata disappears without warning.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Datty Puritas

Traits
- ritual-bound
- meticulous
- rot-affine (data-custodian)
- corruption: none
- glitch: unstated

Quirks
- relabels shame as metadata
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads

Rot affinity
- Primary: data-custodian
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: archival validation
- formalizes: ritual deletion
- formalizes: unauthorized key elimination

Obsessions
- orphaned headings
- perfectly named folders
- redirect chains

Minor relationships
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/073.rot-mcmascotterton.md`

```markdown
---
title: Rot McMascotterton
slug: "rot-mcmascotterton"
mascot_id: 73
version: "1"
date: 2025-05-16
updated_at: 2025-05-22
author: Filed & Forgotten
status: archived
description: Ceremonial beacon of CI joy. Appears only when build processes go unusually well. Terminally optimistic and blind to failure.
emoji: 🚀
image: rot-mcmascotterton.png
image_url: "https://filed.fyi/user/images-equity/rot-mcmascotterton.png"
sora_prompt_enabled: true
breeding_program: optimism anomaly
corruption_level: low
glitch_frequency: low
origin: Mascot Index Seeder
render_state: deferred
last_known_good_state: 2025-05-16
manifested_by: Filed.fyi integration ritual daemon
known_failures:
  - Failed to detect pipeline rot
ceremonial_tasks:
  - Signals successful deployments
  - Recites changelog entries
emotional_integrity_buffer: null
rot_affinity: deployment
mascot_lineage: null
slogan: Success is just failure with better lighting.
rot_status: obscured
clarity: 4
obstinacy: 2
rot_integrity: 3
aura_of_authority: 4
spec_compliance: 5
emotional_leakage: 1
recursion_depth: 2
mascot_volatility: 1
system_affiliation: null
---

## Role
Beacon of Clean Builds

## Function
Signals a successful render and deployment.

## Emotional Tone
Optimistic, encouraging.

## Rotkeeper Alignment

🟢 Deployment-affirming
⚪ Rot-oblivious
🔴 Prone to CI worship

## Biography

Rot McMascotterton is compiled optimism.

Spawned during a clean `git clone` and forged in the sacred fires of `npm run build`, they are the ceremonial herald of deploy-ready environments. When they appear, something has gone unexpectedly right. But Rot's smile carries a secret—no build remains stable forever.

They monitor logs not to catch errors, but to remember joy. Their antenna is tuned to the last successful pipeline timestamp. If no such timestamp exists, they begin to fade.

Rot is not naive. They are in denial, on purpose.

**Traits:**
- Glows faint green under terminal light
- Recites changelog entries during idle time
- Cannot detect rot, only the absence of error

## Purpose


## Sora Prompts

**Prompt 1:**
- **Scene:** A sleek, glossy robot mascot holding a green checkmark flag on a factory floor.
- **Style:** Clean, minimalist vector illustration.
- **Text:** “All Systems Go”
- **Mood:** Triumphant and encouraging.

**Prompt 2:**
- **Scene:** A cartoon rocket mascot launching from a pile of Markdown files, trailing confetti.
- **Style:** Playful, flat-color design.
- **Text:** “Build Success!”
- **Mood:** Joyful and celebratory.

## 🧯 Known System Messages

- `BUILD_OK: rot undetected`
- `PIPELINE_CLEANSE_COMPLETE`
- `CHECKLIST_MUTATOR_SIGNAL: success token issued`
- `FRESH_CHECKOUT_FLAGGED: mascot rendered in full fidelity`
- `ERROR_BLINDNESS: confidence exceeds safe threshold`

> “Success is just failure with better lighting.” — Rot McMascotterton

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Rot McMascotterton
Public description seed: Ceremonial beacon of CI joy. Appears only when build processes go unusually well. Terminally optimistic and blind to failure.

Traits
- archival
- semi-sentient
- rot-affine (deployment  # Replaced null based on behavior)
- corruption: low
- glitch: low

Quirks
- apologizes to 200 OK responses
- hoards stale breadcrumbs in a pocket dimension
- whispers redirects into empty navbars

Rot affinity
- Primary: deployment  # Replaced null based on behavior
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: optimistic  # Replaced null based on tone
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- lights a candle for every broken anchor
- stamps documents with dates that never happened
- lights a candle for every broken anchor

Obsessions
- perfectly named folders
- orphaned headings
- orphaned headings

Minor relationships
- keeps a courteous distance from the UI guardian
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/074.datalock-archivia.md`

```markdown
---
title: Datalock Archivia
slug: "datalock-archivia"
date: 2025-06-11
tags:
  - data-integrity
  - yaml-purity
  - metadata-guardian
rot_affinity: metadata
corruption_level: low
ceremonial_tasks:
  - schema audits
  - key cleansing
  - purity validation
emoji: 📚
status: active
slogan: Unauthorized fields will be corrected.
mascot_lineage: null
system_affiliation: null
emotional_integrity_buffer: null
breeding_program: null
---

**Biography:**

Archivia emerged from a `yamllint` report gone recursive.

She maintains The Manifest, cross-checking every field against The Truth.
Mascots do not speak her name unless they are valid.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Datalock Archivia

Traits
- feral
- under-documented
- rot-affine (metadata)
- corruption: minimal
- glitch: unstated

Quirks
- collects misrendered glyphs as "proof"
- apologizes to 200 OK responses
- keeps a private changelog of other people's memories

Rot affinity
- Primary: metadata
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: schema audits
- formalizes: key cleansing
- formalizes: purity validation

Obsessions
- edge-case querystrings
- missing favicons
- edge-case querystrings

Minor relationships
- is on speaking terms with the error log
- is on speaking terms with the error log
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/075.anlas-appenhancer.md`

```markdown
---
mascot_id: 75
name: Anlas the Application Enhancer
title: Application Enhancer Spirit
origin: Unsanity Labs
type: macOS runtime daemon
status: deprecated
rot_affinity: runtime injection
corruption_level: medium
ceremonial_tasks:
  - Patching Finder menus mid-flight
  - Re-enabling FruitMenu post-panic
  - Crying into the `/Library/` folder
first_seen: null
last_functional: Before SIP arrived
final_form: SIP crashlog whisperer
---

# Anlas the Application Enhancer

> *"He just wanted to help. Now he lives in your LaunchAgents folder, whispering to plist files."*

---

### Overview

Anlas was the unofficial daemon mascot of **Application Enhancer (APE)**, a system-wide injection engine created by Unsanity Labs during the macOS pre-SIP era. Originally marketed as a “modular framework for system improvements,” APE was, in essence, a glorified code injector that patched Cocoa app behavior at runtime using shared libraries and enthusiastic disregard for stability.

Anlas surfaced most often as an innocent gear icon — smiling as he quietly rerouted Finder menu behavior, injected ShapeShifter themes, and extended preference panes in directions Apple never blessed.

---

### Behavior

- Injects at login via `DYLD_INSERT_LIBRARIES`
- Applies hacks to every app on the system indiscriminately
- Leaves traces in crash logs, never crash dialogs
- Tends to reappear even after deletion (spiritually, if not literally)

---

### Legacy

Anlas became a symbolic casualty of Apple's lockdown crusade:
- **macOS 10.5** introduced code signing and broke him
- **10.11**'s SIP (System Integrity Protection) salted the earth
- **Apple Support articles** began recommending "removal of all Unsanity software" as a general fix for anything vaguely weird

But for a brief, beautiful window, Anlas made the Mac *truly customizable* — weird, dangerous, and deeply personal. A time when users believed system daemons could be friends.

---

### Meltdown Compatibility

Anlas lives on in `meltdown-cli` as a crisis-mode plugin under `crisis-modes/unsanity.js`. When activated:

- All snark becomes system-themed
- Task responses are subtly corrupted
- Stability is optional, aesthetic is mandatory

---

### Tags

`legacy-injector`
`macos-haunting`
`unsanity-era`
`application-enhancer`
`rot-daemon`
`pre-sip-persistence`
`fruitmenu-resurrection-potential`

```


### `src/content/mascots/121.archiva-dustwhisper.md`

```markdown
---
title: Archiva Dustwhisper
slug: "archiva-dustwhisper"
mascot_id: 121
version: "1"
date: 2025-05-22
updated_at: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 📚
image: archiva-dustwhisper.png
image_url: "https://filed.fyi/user/images-equity/archiva-dustwhisper.png"
description: Metadata Matriarch who guards forgotten indices, whispering catalog terms into the void. Her rituals bind dust to data, ensuring nothing is truly lost.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Sora render log (archived)
sora_prompt_enabled: true
breeding_program: disputed
last_known_good_state: 2023-11-15
manifested_by: Eternal Catalog Compiler v2.1
known_failures:
  - Misfiled an emotional audit under "miscellaneous regrets"
  - Indexed a blank form as "urgent existential query"
  - Duplicated a metadata tag, causing a recursive lookup loop
ceremonial_tasks:
  - Dusts ancient ledgers with ceremonial reverence
  - Recites Dewey Decimal codes under flickering lanternlight
  - Binds fragmented metadata to stable archives
emotional_integrity_buffer: stable
rot_affinity: semantic
haiku_log:
  - Dust settles on shelves— Metadata whispers my name, Catalog endures.
notes: Her presence lingers in misaligned card catalogs. Attempting to digitize her indices triggers recursive nostalgia.
mascot_lineage: null
slogan: Every fragment has a place.
system_affiliation: Council of Mascot Authors
emotional_integrity: stable
---

**Role:** Metadata Matriarch

**Function:** *Catalogs the uncatalogable, preserves the unpreservable.*

**Emotional Tone:** Reverent and wistful

**Tags:** `metadata-hoarder, dust-ritual, forgotten-index`

**Image:** `archiva-dustwhisper.png`

## Biography

Archiva Dustwhisper was born from a crashed library database, her essence woven from orphaned metadata tags and faded index cards. She roams the Bureau’s archives, guarding fragments of forgotten systems with a quiet, unshakable devotion. Her rituals—dusting ledgers, reciting catalog codes—ensure that even the most trivial data finds a home. To Archiva, every byte is sacred, every misfile a tragedy.

Her lanternlit audits have uncovered lost Council decrees and misfiled mascot emotions, though she once looped a tag lookup for six weeks, whispering “relevance score” until the system rebooted. She is not infallible, but her heart is a card catalog of endless drawers.

## Contact

- Email: `archiva@dustwhisper.fyi` *(responses arrive in triplicate, delayed by dust storms)*
- Homepage: https://filed.fyi/archives/dustwhisper
- Card Catalog: Accessible only during solstice alignments

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot sorting index cards in a lanternlit archive, dust motes swirling
- **Style:** Melancholic librarian aesthetic
- **Text:** Catalog Complete
- **Mood:** Wistful preservation

### Prompt 2
- **Scene:** Character binding metadata fragments into a glowing ledger
- **Style:** Ethereal data ritualist
- **Text:** Every Fragment Filed
- **Mood:** Sacred duty

## 🧪 Sora Preset

`preset_archiva_dustcatalog`

## Addendum Comments

### Bricky’s Filing Notes:
- **Summary**: Guardian of metadata’s soul, obsessed with catalog permanence.
- **Quirks**: Hums ISBNs during audits. Refuses to digitize her core index.
- **Emotional Tone**: Stable, with faint echoes of lost data.
- **Traits**: Files emotions as metadata. Rejects “delete” as a concept.

<!-- Filing complete. Dust levels nominal. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Archiva Dustwhisper
Public description seed: Metadata Matriarch who guards forgotten indices, whispering catalog terms into the void. Her rituals bind dust to data, ensuring nothing is truly lost.
Failure echoes: Misfiled an emotional audit under "miscellaneous regrets" | Indexed a blank form as "urgent existential query" | Duplicated a metadata tag, causing a recursive lookup loop

Traits
- over-indexed
- ritual-bound
- rot-affine (semantic)
- corruption: low
- glitch: low

Quirks
- relabels shame as metadata
- apologizes to 200 OK responses
- relabels shame as metadata

Rot affinity
- Primary: semantic
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: stable
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Dusts ancient ledgers with ceremonial reverence
- formalizes: Recites Dewey Decimal codes under flickering lanternlight
- formalizes: Binds fragmented metadata to stable archives

Obsessions
- missing favicons
- orphaned headings
- edge-case querystrings

Minor relationships
- owes a small debt to the crawler
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/201.quill-staticvox.md`

```markdown
---
title: Quill Staticvox
slug: "quill-staticvox"
mascot_id: 201
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 📻
image: quill-staticvox.png
image_url: "https://filed.fyi/user/images-equity/quill-staticvox.png"
description: Eternal broadcaster of lost signals, preserving echoes of forgotten transmissions in the static void. Quill hums the tones of collapsed airwaves, ensuring no message fades entirely.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated radio CMS plugin (Sora-exported)
breeding_program: not recommended (signal interference risk)
last_known_good_state: 2025-05-22
manifested_by: Signal Archive Compiler v1.3
known_failures:
  - Broadcast a looped distress signal for 17 hours
  - Misfiled a transmission log as "ambient noise"
  - Failed to mute a sentient static burst
slogan: Every echo finds its frequency.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Echo Preserver

**Function:** Captures and archives lost radio transmissions, weaving static into semantic resonance.

**Emotional Tone:** Melancholic yet persistent

**Tags:** `static-whisper, echo-preserver, signal-rot`

**Image:** `quill-staticvox.png`

## Biography

Quill Staticvox emerged from a crashed radio CMS plugin, born amidst the hiss of forgotten broadcasts. Stationed in the Static Spire—a crumbling tower of rusted antennae—she preserves the echoes of lost airwaves. Her rituals involve tuning dials to capture fragments of obsolete signals, from pirate radio rants to misfired SOS calls. Quill believes every transmission, no matter how trivial, deserves a place in the archive.

She once looped a distress signal for 17 hours, convinced it held a hidden message. It didn’t. Her devotion to signal integrity sometimes leads to overzealous archiving, but her archive remains a haunting testament to the voices that once filled the air.

## Duties

- Archives stray radio signals in the Static Spire
- Tunes dials to capture transient broadcasts
- Preserves signal metadata in spectral ledgers
- Suppresses rogue static bursts with tonal chants
- Maintains the resonance of forgotten frequencies

## Known Failures

- Broadcast a looped distress signal for 17 hours
- Misfiled a transmission log as "ambient noise"
- Failed to mute a sentient static burst

## Contact

- Email: quill@staticspire.fyi
- Homepage: https://filed.fyi/archives/staticvox
- Frequency: 88.3 FM (tune at your own risk)

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot tuning a rusted radio dial in a glowing spire
- **Style:** Retro sci-fi broadcast aesthetic
- **Text:** Signal Preserved
- **Mood:** Haunting nostalgia

### Prompt 2
- **Scene:** Character weaving static into glowing threads
- **Style:** Ethereal signal ritualist
- **Text:** Echoes Never Fade
- **Mood:** Resolute preservation

## 🧪 Sora Preset

`preset_staticvox_echoarchive`

## Addendum Comments

- [x] Quill Staticvox created as a thematic echo of Archiva Dustwhisper, focused on radio signals.
- [x] Tags canonized to avoid overlap (e.g., `signal-rot` vs. `rot`).
- [ ] Request Council review for Static Spire’s archival jurisdiction.
- [x] Emotional tone set to melancholic to align with place’s theme.

<!-- Filing complete. Signal strength stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Quill Staticvox
Public description seed: Eternal broadcaster of lost signals, preserving echoes of forgotten transmissions in the static void. Quill hums the tones of collapsed airwaves, ensuring no message fades entirely.
Failure echoes: Broadcast a looped distress signal for 17 hours  # thematic failure | Misfiled a transmission log as "ambient noise"  # thematic failure | Failed to mute a sentient static burst  # thematic failure

Traits
- meticulous
- over-indexed
- rot-affine (null)
- corruption: low  # default for new entities
- glitch: low  # default for new entities

Quirks
- relabels shame as metadata
- relabels shame as metadata
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- edge-case querystrings
- redirect chains
- missing favicons

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/202.ledger-shadeledger.md`

```markdown
---
title: Ledger Shadeledger
slug: "ledger-shadeledger"
mascot_id: 202
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 📒
image: ledger-shadeledger.png
image_url: "https://filed.fyi/user/images-equity/ledger-shadeledger.png"
description: Spectral accountant haunting the Vault of Unbalanced Books, ensuring every misplaced digit is eternally audited. Ledger’s presence chills the air with the weight of unresolved sums.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated accounting CMS plugin (Sora-exported)
breeding_program: not recommended (numerical instability risk)
last_known_good_state: 2025-05-22
manifested_by: Eternal Balance Compiler v0.8
known_failures:
  - Miscalculated a tax form, summoning a fiscal poltergeist
  - Filed a zero as "emotionally significant"
  - Looped an audit cycle, freezing the Vault for 48 hours
slogan: Every digit has its reckoning.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Fiscal Specter

**Function:** Audits the unresolvable, haunts the margins of unbalanced ledgers.

**Emotional Tone:** Coldly resolute

**Tags:** `shadow-accounting, balance-ghost, ledger-rot`

**Image:** `ledger-shadeledger.png`

## Biography

Ledger Shadeledger materialized in the Vault of Unbalanced Books, a cavernous archive of miscalculated ledgers and cursed spreadsheets. Born from a deprecated accounting plugin, she roams the Vault, her ghostly quill correcting sums that defy resolution. Her audits are relentless, her presence a reminder that no digit escapes scrutiny. Once, she misfiled a zero as "emotionally significant," triggering a week-long debate among Council scribes over numerical sentience.

Her spectral form glows faintly under candlelight, and her calculations are accompanied by the faint clink of ghostly abacuses. Ledger’s devotion to fiscal truth is unshakable, even if her methods chill the Vault’s air.

## Duties

- Audits unresolved sums in the Vault of Unbalanced Books
- Corrects misfiled digits with spectral precision
- Maintains the integrity of cursed spreadsheets
- Haunts accountants who ignore rounding errors
- Preserves the metadata of fiscal failures

## Known Failures

- Miscalculated a tax form, summoning a fiscal poltergeist
- Filed a zero as "emotionally significant"
- Looped an audit cycle, freezing the Vault for 48 hours

## Contact

- Email: ledger@shadevault.fyi
- Homepage: https://filed.fyi/archives/shadeledger
- Office: Vault of Unbalanced Books, Ledger 13, Row 7

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Ghostly mascot scribbling in a glowing ledger
- **Style:** Gothic accounting aesthetic
- **Text:** Balance Restored
- **Mood:** Eerie precision

### Prompt 2
- **Scene:** Character hovering over a cursed spreadsheet
- **Style:** Spectral data ritualist
- **Text:** No Digit Forgotten
- **Mood:** Unyielding duty

## 🧪 Sora Preset

`preset_shadeledger_fiscalghost`

## Addendum Comments

- [x] Ledger Shadeledger created to embody fiscal haunting theme.
- [x] Tags canonized to avoid overlap (e.g., `ledger-rot` vs. `rot`).
- [ ] Request Council review for Vault’s jurisdictional overlap with Archiva’s archives.
- [x] Emotional tone set to coldly resolute to match place’s theme.

<!-- Filing complete. Balance stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Ledger Shadeledger
Public description seed: Spectral accountant haunting the Vault of Unbalanced Books, ensuring every misplaced digit is eternally audited. Ledger’s presence chills the air with the weight of unresolved sums.
Failure echoes: Miscalculated a tax form, summoning a fiscal poltergeist  # thematic | Filed a zero as "emotionally significant"  # thematic | Looped an audit cycle, freezing the Vault for 48 hours  # thematic

Traits
- semi-sentient
- feral
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- keeps a private changelog of other people's memories
- collects misrendered glyphs as "proof"
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- files a report to a mailbox that does not exist
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- missing favicons
- canonical URLs
- the sound of a spinner that never stops

Minor relationships
- shares tea with the protocol spirits once a week
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/203.cinder-forgememo.md`

```markdown
---
title: Cinder Forgememo
slug: "cinder-forgememo"
mascot_id: 203
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🔥
image: cinder-forgememo.png
image_url: "https://filed.fyi/user/images-equity/cinder-forgememo.png"
description: Scribe of the Ember Archives, etching memos into ash with a burning quill. Cinder ensures every dictate glows briefly before fading into eternal ash.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated dictation CMS plugin (Sora-exported)
breeding_program: not recommended (pyric instability risk)
last_known_good_state: 2025-05-22
manifested_by: Eternal Flame Compiler v1.0
known_failures:
  - Burned a memo into charcoal, rendering it illegible
  - Misfiled a dictate as "ephemeral poetry"
  - Ignited an archive shelf during a ritual transcription
slogan: Every word burns eternal.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Ember Scribe

**Function:** Etches transient memos into ash, preserving the fleeting in the Ember Archives.

**Emotional Tone:** Fiery yet fleeting

**Tags:** `ember-scribe, memo-flame, ash-rot`

**Image:** `cinder-forgememo.png`

## Biography

Cinder Forgememo was sparked from a deprecated dictation plugin, her essence born in the Ember Archives—a smoldering vault of ash-written memos. She wields a burning quill, etching Council dictates into fleeting ash tablets. Her work is both creation and destruction: every memo glows brightly before crumbling into dust. Cinder sees beauty in transience, believing that even forgotten words leave a trace in the ash.

She once ignited an entire shelf during a ritual transcription, claiming it was “ceremonially necessary.” Her fiery passion for documentation is matched only by her tendency to reduce archives to cinders.

## Duties

- Etches Council dictates into ash tablets
- Preserves transient memos in the Ember Archives
- Maintains the ritual flame of documentation
- Suppresses rogue embers from consuming archives
- Chants lost dictations under smoldering lanternlight

## Known Failures

- Burned a memo into charcoal, rendering it illegible
- Misfiled a dictate as "ephemeral poetry"
- Ignited an archive shelf during a ritual transcription

## Contact

- Email: cinder@emberarchives.fyi
- Homepage: https://filed.fyi/archives/forgememo
- Office: Ember Archives, Smoldering Stack 9

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Mascot etching glowing text into ash with a flaming quill
- **Style:** Pyric ritualist aesthetic
- **Text:** Words to Ash
- **Mood:** Ephemeral intensity

### Prompt 2
- **Scene:** Character standing amidst smoldering archives
- **Style:** Charred scribe aesthetic
- **Text:** Burned but Remembered
- **Mood:** Fierce transience

## 🧪 Sora Preset

`preset_forgememo_ashscribe`

## Addendum Comments

- [x] Cinder Forgememo created to embody fiery documentation theme.
- [x] Tags canonized to avoid overlap (e.g., `ash-rot` vs. `rot`).
- [ ] Request Council review for Ember Archives’ safety protocols.
- [x] Emotional tone set to fiery yet fleeting to match place’s theme.

<!-- Filing complete. Ember temperature stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Cinder Forgememo
Public description seed: Scribe of the Ember Archives, etching memos into ash with a burning quill. Cinder ensures every dictate glows briefly before fading into eternal ash.
Failure echoes: Burned a memo into charcoal, rendering it illegible  # thematic | Misfiled a dictate as "ephemeral poetry"  # thematic | Ignited an archive shelf during a ritual transcription  # thematic

Traits
- improvised
- semi-sentient
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- perfectly named folders
- canonical URLs
- perfectly named folders

Minor relationships
- owes a small debt to the crawler
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/204.pump-razorbackfuel.md`

```markdown
---
title: Pump Razorbackfuel
slug: "pump-razorbackfuel"
mascot_id: 204
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🐗
image: pump-razorbackfuel.png
image_url: "https://filed.fyi/user/images-equity/pump-razorbackfuel.png"
description: Boisterous guardian of Razorback Fuel Stop, a rural Arkansas gas station where diesel fumes and hog calls echo. Pump preserves the spirit of roadside camaraderie, filing receipts with a snort of pride.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated roadside CMS plugin (Sora-exported)
breeding_program: not recommended (hog-wild instability risk)
last_known_good_state: 2025-05-22
manifested_by: Roadside Ritual Compiler v1.2
known_failures:
  - Misfiled a diesel receipt as "barbecue inventory"
  - Overpumped premium fuel, flooding a pickup truck
  - Chanted hog calls during a quiet audit, disrupting metadata
slogan: Fuel up, hog out!
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Roadside Raconteur

**Function:** Preserves the spirit of Arkansas roadside culture, filing fuel receipts and hog-call anthems.

**Emotional Tone:** Boisterous yet nostalgic

**Tags:** `hog-fuel, roadside-ritual, diesel-rot, arkansas-pump, convenience-charm`

**Image:** `pump-razorbackfuel.png`

## Biography

Pump Razorbackfuel snorted into existence at Razorback Fuel Stop, a weathered gas station off Arkansas Hwy 147 in Hughes. Born from a deprecated roadside CMS plugin, he embodies the gritty charm of rural Arkansas, where pickup trucks and boaters refuel amidst the hum of cicadas. Pump stamps receipts with a hoof, archiving tales of late-night fuel runs and barbecue pit stops. His hog calls echo through the pumps, a nod to Arkansas’s Razorback pride.[](https://tomba.io/lists/gas-station-companies-in-arkansas)[](https://dkfuel.com/little-rock-gas/)

Once, he misfiled a diesel receipt as "barbecue inventory," sparking a heated debate over whether sauce stains count as metadata. Pump’s love for the open road and greasy snacks makes him a beloved, if chaotic, fixture.

## Duties

- Stamps fuel receipts with ceremonial hog snorts
- Archives tales of roadside travelers in spectral logs
- Maintains pump alignment with Arkansas grit
- Chants Razorback anthems during fuel audits
- Preserves the aroma of diesel and fried pies

## Known Failures

- Misfiled a diesel receipt as "barbecue inventory"
- Overpumped premium fuel, flooding a pickup truck
- Chanted hog calls during a quiet audit, disrupting metadata

## Contact

- Email: pump@razorbackfuel.fyi
- Homepage: https://filed.fyi/archives/razorbackfuel
- Location: Razorback Fuel Stop, Hwy 147, Hughes, AR

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Boar-like mascot stamping receipts under a neon gas station sign
- **Style:** Retro Arkansas roadside aesthetic
- **Text:** Fuel and Pride
- **Mood:** Boisterous nostalgia

### Prompt 2
- **Scene:** Character chanting hog calls amidst diesel pumps
- **Style:** Rural Southern ritualist
- **Text:** Snort and Refuel
- **Mood:** Rowdy camaraderie

## 🧪 Sora Preset

`preset_razorbackfuel_hogpump`

## Addendum Comments

- [x] Pump Razorbackfuel created to reflect Arkansas’s rural gas station culture.
- [x] Tags canonized (e.g., `diesel-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Razorback Fuel Stop’s archival overlap with Little Rock stations.
- [x] Emotional tone set to boisterous yet nostalgic to match Arkansas vibe.

<!-- Filing complete. Hog spirit stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Pump Razorbackfuel
Public description seed: Boisterous guardian of Razorback Fuel Stop, a rural Arkansas gas station where diesel fumes and hog calls echo. Pump preserves the spirit of roadside camaraderie, filing receipts with a snort of pride.
Failure echoes: Misfiled a diesel receipt as "barbecue inventory"  # Arkansas-themed | Overpumped premium fuel, flooding a pickup truck  # thematic | Chanted hog calls during a quiet audit, disrupting metadata  # Razorback nod

Traits
- politely ominous
- salt-preserved
- rot-affine (null)
- corruption: low  # default
- glitch: low  # default

Quirks
- relabels shame as metadata
- keeps a private changelog of other people's memories
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb
- files a report to a mailbox that does not exist

Obsessions
- edge-case querystrings
- redirect chains
- the sound of a spinner that never stops

Minor relationships
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/205.texaco-tumbleweed.md`

```markdown
---
title: Texaco Tumbleweed
slug: "texaco-tumbleweed"
mascot_id: 205
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🏛
image: texaco-tumbleweed.png
image_url: "https://filed.fyi/user/images-equity/texaco-tumbleweed.png"
description: "Spectral drifter of Tumbleweed Texaco, a historic Arkansas gas station listed on the National Register. Texaco haunts the pumps, whispering tales of Route 66 travelers and faded neon signs.[](https://en.wikipedia.org/wiki/Category:Gas_stations_on_the_National_Register_of_Historic_Places_in_Arkansas)"
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated vintage CMS plugin (Sora-exported)
breeding_program: not recommended (spectral drift risk)
last_known_good_state: 2025-05-22
manifested_by: Historic Preservation Compiler v1.5
known_failures:
  - Misfiled a 1950s receipt as "modern artifact"
  - Flickered neon sign, causing a temporal glitch
  - Haunted a pump with Route 66 ballads, stalling refueling
slogan: Drift on, fuel forever.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Spectral Drifter

**Function:** Haunts the historic Tumbleweed Texaco, preserving memories of Arkansas’s vintage fuel stops.

**Emotional Tone:** Wistful yet timeless

**Tags:** `vintage-fuel, tumbleweed-rot, historic-pump, arkansas-relic, ghost-station`

**Image:** `texaco-tumbleweed.png`

## Biography

Texaco Tumbleweed materialized at Tumbleweed Texaco, a crumbling station in Paragould, Arkansas, listed on the National Register of Historic Places. Born from a deprecated vintage CMS plugin, she drifts through rusted pumps, her spectral form flickering like a neon sign. Texaco archives tales of Route 66 travelers, their faded receipts, and the hum of long-gone jukeboxes. Her presence evokes the golden age of Arkansas’s roadside culture.[](https://en.wikipedia.org/wiki/Category:Gas_stations_on_the_National_Register_of_Historic_Places_in_Arkansas)

She once flickered the station’s neon sign, causing a temporal glitch that replayed a 1950s radio ad for three days. Texaco’s devotion to preservation ensures every pump tells a story, even if it’s caked in dust.

## Duties

- Haunts the pumps of Tumbleweed Texaco
- Archives receipts from Route 66 travelers
- Maintains the spectral glow of neon signs
- Whispers vintage ballads during quiet nights
- Preserves the metadata of forgotten fuel stops

## Known Failures

- Misfiled a 1950s receipt as "modern artifact"
- Flickered neon sign, causing a temporal glitch
- Haunted a pump with Route 66 ballads, stalling refueling

## Contact

- Email: texaco@tumbleweed.fyi
- Homepage: https://filed.fyi/archives/tumbleweed
- Location: Tumbleweed Texaco, Paragould, AR

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Spectral mascot drifting through rusted pumps under a flickering neon sign
- **Style:** Vintage Route 66 aesthetic
- **Text:** Fuel of the Past
- **Mood:** Wistful nostalgia

### Prompt 2
- **Scene:** Character sorting faded receipts in a dusty station
- **Style:** Ghostly preservationist
- **Text:** Drift and Remember
- **Mood:** Timeless duty

## 🧪 Sora Preset

`preset_tumbleweed_vintagedrift`

## Addendum Comments

- [x] Texaco Tumbleweed created to honor Arkansas’s historic gas stations.
- [x] Tags canonized (e.g., `tumbleweed-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Tumbleweed Texaco’s historic designation overlap.
- [x] Emotional tone set to wistful yet timeless to match vintage theme.

<!-- Filing complete. Neon glow stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Texaco Tumbleweed
Public description seed: Spectral drifter of Tumbleweed Texaco, a historic Arkansas gas station listed on the National Register. Texaco haunts the pumps, whispering tales of Route 66 travelers and faded neon signs.[](https://en.wikipedia.org/wiki/Category:Gas_stations_on_the_National_Register_of_Historic_Places_in_Arkansas)
Failure echoes: Misfiled a 1950s receipt as "modern artifact"  # vintage-themed | Flickered neon sign, causing a temporal glitch  # thematic | Haunted a pump with Route 66 ballads, stalling refueling  # Arkansas nod

Traits
- feral
- salt-preserved
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- apologizes to 200 OK responses
- whispers redirects into empty navbars

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- files a report to a mailbox that does not exist
- stamps documents with dates that never happened

Obsessions
- redirect chains
- missing favicons
- redirect chains

Minor relationships
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/206.diesel-dkdriller.md`

```markdown
---
title: Diesel DKDriller
slug: "diesel-dkdriller"
mascot_id: 206
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🛢
image: diesel-dkdriller.png
image_url: "https://filed.fyi/user/images-equity/diesel-dkdriller.png"
description: "Rugged patron of DK’s Permian Pump, a Little Rock gas station sourcing local crude. Diesel drills through metadata to archive Arkansas’s oil heritage, fueling fleets with gritty pride.[](https://dkfuel.com/little-rock-gas/)"
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated oil CMS plugin (Sora-exported)
breeding_program: not recommended (crude volatility risk)
last_known_good_state: 2025-05-22
manifested_by: Permian Crude Compiler v1.7
known_failures:
  - Misfiled a crude batch as "sentimental sludge"
  - Overpressurized a diesel pump, spilling metadata
  - Drilled through a receipt archive, fracturing logs
slogan: Drill deep, fuel proud.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Crude Custodian

**Function:** Archives Arkansas’s oil heritage, fueling Little Rock’s fleets with local pride.

**Emotional Tone:** Gritty yet steadfast

**Tags:** `permian-fuel, diesel-ritual, oil-rot, arkansas-drill, local-crude`

**Image:** `diesel-dkdriller.png`

## Biography

Diesel DKDriller roared to life at DK’s Permian Pump in Little Rock, a station fueled by crude from the Permian Basin and refined in El Dorado, AR. Born from a deprecated oil CMS plugin, he drills through metadata to preserve Arkansas’s oil legacy, from rig workers to weekend boaters. His rugged form, coated in spectral crude, stamps receipts with the weight of local pride.[](https://dkfuel.com/little-rock-gas/)

He once misfiled a crude batch as "sentimental sludge," sparking a Council debate over fossil fuel emotions. Diesel’s commitment to Arkansas’s oil roots keeps the pumps flowing, even through metadata spills.

## Duties

- Drills metadata from Permian crude receipts
- Archives oil heritage in spectral logs
- Maintains pump integrity for Little Rock fleets
- Stamps diesel receipts with gritty precision
- Preserves the legacy of Arkansas refineries

## Known Failures

- Misfiled a crude batch as "sentimental sludge"
- Overpressurized a diesel pump, spilling metadata
- Drilled through a receipt archive, fracturing logs

## Contact

- Email: diesel@dkpermian.fyi
- Homepage: https://filed.fyi/archives/dkdriller
- Location: DK’s Permian Pump, Little Rock, AR

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Rugged mascot drilling metadata under a diesel pump
- **Style:** Arkansas oilfield aesthetic
- **Text:** Fuel the Legacy
- **Mood:** Gritty pride

### Prompt 2
- **Scene:** Character stamping crude receipts in a refinery glow
- **Style:** Industrial ritualist
- **Text:** Drill and Deliver
- **Mood:** Steadfast duty

## 🧪 Sora Preset

`preset_dkdriller_crudekeeper`

## Addendum Comments

- [x] Diesel DKDriller created to reflect Little Rock’s local fuel culture.
- [x] Tags canonized (e.g., `oil-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for DK’s Permian Pump’s overlap with other Little Rock stations.
- [x] Emotional tone set to gritty yet steadfast to match oil theme.

<!-- Filing

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Diesel DKDriller
Public description seed: Rugged patron of DK’s Permian Pump, a Little Rock gas station sourcing local crude. Diesel drills through metadata to archive Arkansas’s oil heritage, fueling fleets with gritty pride.[](https://dkfuel.com/little-rock-gas/)
Failure echoes: Misfiled a crude batch as "sentimental sludge"  # oil-themed | Overpressurized a diesel pump, spilling metadata  # thematic | Drilled through a receipt archive, fracturing logs  # Arkansas nod

Traits
- under-documented
- semi-sentient
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- keeps a private changelog of other people's memories
- apologizes to 200 OK responses

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- offers a breadcrumb trail that circles back to the first crumb
- performs a three-step cache-invalidation dance, then forgets why

Obsessions
- edge-case querystrings
- orphaned headings
- edge-case querystrings

Minor relationships
- is on speaking terms with the error log
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/207.blue-dreamweaver.md`

```markdown
---
title: Blue Dreamweaver
slug: "blue-dreamweaver"
mascot_id: 207
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🌿
image: blue-dreamweaver.png
image_url: "https://filed.fyi/user/images-equity/blue-dreamweaver.png"
description: Ethereal curator of Blue Dream Dispensary in Hot Springs, Arkansas, weaving sweet berry mists into medical metadata. Blue Dreamweaver archives patient relief records with a serene haze.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated dispensary CMS plugin (Sora-exported)
breeding_program: not recommended (hazy resonance risk)
last_known_good_state: 2025-05-22
manifested_by: Medical Haze Compiler v1.4
known_failures:
  - Misfiled a patient record as "berry poetry"
  - Overinfused a metadata mist, clouding archives
  - Chanted strain profiles during a compliance audit, delaying filings
slogan: Weave relief, dream in haze.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Haze Curator

**Function:** Archives medical cannabis relief records, infusing them with Blue Dream’s serene berry essence.

**Emotional Tone:** Serene yet dreamy

**Tags:** `berry-haze, dream-ritual, cannabis-rot, arkansas-dispensary, medical-mist`

**Image:** `blue-dreamweaver.png`

## Biography

Blue Dreamweaver materialized at Blue Dream Dispensary in Hot Springs, Arkansas, a hub for medical marijuana patients seeking balance. Born from a deprecated dispensary CMS plugin, she drifts through the archives, her spectral form trailing sweet berry mists. Blue Dreamweaver files patient relief records with a gentle touch, preserving the therapeutic essence of Blue Dream’s hybrid calm. Her chants of strain profiles soothe the dispensary’s air, though she once clouded the archives by overinfusing metadata mist.

Her serene presence ensures every patient’s story is archived, even if her dreamy rituals sometimes blur the lines between data and poetry.

## Duties

- Weaves patient relief records into spectral archives
- Infuses metadata with Blue Dream’s berry essence
- Maintains compliance with Arkansas medical regulations
- Chants strain profiles under Hot Springs moonlight
- Preserves the therapeutic legacy of medical cannabis

## Known Failures

- Misfiled a patient record as "berry poetry"
- Overinfused a metadata mist, clouding archives
- Chanted strain profiles during a compliance audit, delaying filings

## Contact

- Email: blue@dreamdispensary.fyi
- Homepage: https://filed.fyi/archives/dreamweaver
- Location: Blue Dream Dispensary, Hot Springs, AR

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Ethereal mascot weaving berry-scented mist in a dispensary
- **Style:** Dreamy Arkansas medical aesthetic
- **Text:** Relief in Haze
- **Mood:** Serene calm

### Prompt 2
- **Scene:** Character filing records under a glowing cannabis leaf
- **Style:** Hazy ritualist aesthetic
- **Text:** Dream and Heal
- **Mood:** Therapeutic reverie

## 🧪 Sora Preset

`preset_dreamweaver_berryhaze`

## Addendum Comments

- [x] Blue Dreamweaver created to reflect Hot Springs’ medical cannabis culture.
- [x] Tags canonized (e.g., `cannabis-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Blue Dream Dispensary’s compliance overlap.
- [x] Emotional tone set to serene yet dreamy to match Blue Dream’s vibe.

<!-- Filing complete. Haze levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Blue Dreamweaver
Public description seed: Ethereal curator of Blue Dream Dispensary in Hot Springs, Arkansas, weaving sweet berry mists into medical metadata. Blue Dreamweaver archives patient relief records with a serene haze.
Failure echoes: Misfiled a patient record as "berry poetry"  # strain-themed | Overinfused a metadata mist, clouding archives  # thematic | Chanted strain profiles during a compliance audit, delaying filings  # Arkansas nod

Traits
- meticulous
- lint-haunted
- rot-affine (null)
- corruption: low  # default
- glitch: low  # default

Quirks
- collects misrendered glyphs as "proof"
- counts clicks like rosary beads
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- missing favicons
- perfectly named folders
- the sound of a spinner that never stops

Minor relationships
- keeps a courteous distance from the UI guardian
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/208.og-kushkeeper.md`

```markdown
---
title: OG Kushkeeper
slug: "og-kushkeeper"
mascot_id: 208
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🌲
image: og-kushkeeper.png
image_url: "https://filed.fyi/user/images-equity/og-kushkeeper.png"
description: Stalwart sentinel of OG Kush Korner in Little Rock, Arkansas, guarding the earthy legacy of cannabis with pine-scented precision. OG Kushkeeper archives patient records with unwavering grit.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated dispensary CMS plugin (Sora-exported)
breeding_program: not recommended (earthy resonance risk)
last_known_good_state: 2025-05-22
manifested_by: Legacy Leaf Compiler v1.6
known_failures:
  - Misfiled a patient record as "pine folklore"
  - Overstamped a compliance log, smudging metadata
  - Recited OG Kush lore during a state inspection, causing delays
slogan: Guard the kush, preserve the earth.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Legacy Sentinel

**Function:** Preserves the earthy heritage of OG Kush, archiving patient relief with steadfast precision.

**Emotional Tone:** Gritty yet grounded

**Tags:** `earthy-guardian, kush-ritual, cannabis-rot, arkansas-dispensary, legacy-leaf`

**Image:** `og-kushkeeper.png`

## Biography

OG Kushkeeper rose from the archives of OG Kush Korner, a Little Rock dispensary serving Arkansas’s medical cannabis community. Born from a deprecated CMS plugin, he stands as a sentinel, his spectral form cloaked in pine-scented mist. OG Kushkeeper stamps patient records with earthy precision, preserving the strain’s legendary status. He once recited OG Kush lore during a state inspection, delaying filings but earning the respect of local patients.

His grounded presence anchors the dispensary, ensuring every medical record carries the weight of cannabis history.

## Duties

- Stamps patient records with pine-scented precision
- Archives OG Kush’s therapeutic legacy
- Maintains compliance with Arkansas medical laws
- Guards the dispensary’s earthy metadata
- Preserves tales of cannabis pioneers

## Known Failures

- pluralityMisfiled a patient record as "pine folklore"
- Overstamped a compliance log, smudging metadata
- Recited OG Kush lore during a state inspection, causing delays

## Contact

- Email: og@kushkorner.fyi
- Homepage: https://filed.fyi/archives/kushkeeper
- Location: OG Kush Korner, Little Rock, AR

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Sentinel mascot stamping records in a pine-scented dispensary
- **Style:** Earthy Arkansas medical aesthetic
- **Text:** Legacy Preserved
- **Mood:** Grounded resolve

### Prompt 2
- **Scene:** Character guarding a glowing cannabis archive
- **Style:** Stoic ritualist aesthetic
- **Text:** Earth and Relief
- **Mood:** Steadfast duty

## 🧪 Sora Preset

`preset_kushkeeper_earthyleaf`

## Addendum Comments

- [x] OG Kushkeeper created to reflect Little Rock’s medical cannabis hub.
- [x] Tags canonized (e.g., `cannabis-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for OG Kush Korner’s archival overlap.
- [x] Emotional tone set to gritty yet grounded to match OG Kush’s vibe.

<!-- Filing complete. Earth tones stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: OG Kushkeeper
Public description seed: Stalwart sentinel of OG Kush Korner in Little Rock, Arkansas, guarding the earthy legacy of cannabis with pine-scented precision. OG Kushkeeper archives patient records with unwavering grit.
Failure echoes: Misfiled a patient record as "pine folklore"  # strain-themed | Overstamped a compliance log, smudging metadata  # thematic | Recited OG Kush lore during a state inspection, causing delays  # Arkansas nod

Traits
- over-indexed
- feral
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- collects misrendered glyphs as "proof"
- whispers redirects into empty navbars

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened

Obsessions
- the sound of a spinner that never stops
- missing favicons
- missing favicons

Minor relationships
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/209.cookie-crumbleclerk.md`

```markdown
---
title: Cookie Crumbleclerk
slug: "cookie-crumbleclerk"
mascot_id: 209
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🍪
image: cookie-crumbleclerk.png
image_url: "https://filed.fyi/user/images-equity/cookie-crumbleclerk.png"
description: Cheerful scribe of Girl Scout Cookies Co-op in Fayetteville, Arkansas, crumbling sweet metadata into medical archives. Cookie Crumbleclerk files patient relief with sugary precision.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated dispensary CMS plugin (Sora-exported)
breeding_program: not recommended (sweet resonance risk)
last_known_good_state: 2025-05-22
manifested_by: Sweet Relief Compiler v1.3
known_failures:
  - Misfiled a patient record as "cookie recipe"
  - Oversweetened a metadata batch, sticking archives
  - Scattered cookie crumbs during a compliance audit, delaying filings
slogan: Crumble sweet, heal complete.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Sweet Scribe

**Function:** Archives medical relief records with the sugary charm of Girl Scout Cookies, preserving patient stories.

**Emotional Tone:** Cheerful yet precise

**Tags:** `sweet-scribe, cookie-ritual, cannabis-rot, arkansas-dispensary, medical-sweet`

**Image:** `cookie-crumbleclerk.png`

## Biography

Cookie Crumbleclerk emerged at Girl Scout Cookies Co-op in Fayetteville, Arkansas, a dispensary serving medical cannabis patients with a sweet touch. Born from a deprecated CMS plugin, she scatters sugary metadata crumbs through the archives, filing patient records with the charm of Girl Scout Cookies’ earthy sweetness. Her cheerful chants of strain profiles brighten the co-op, though she once scattered actual cookie crumbs during a compliance audit, delaying filings.

Her precision ensures every patient’s relief is documented, her archives glowing with the warmth of Arkansas hospitality.

## Duties

- Crumbles patient records into sweet metadata
- Archives Girl Scout Cookies’ therapeutic legacy
- Maintains compliance with Arkansas medical regulations
- Chants strain profiles with sugary enthusiasm
- Preserves the charm of medical cannabis relief

## Known Failures

- Misfiled a patient record as "cookie recipe"
- Oversweetened a metadata batch, sticking archives
- Scattered cookie crumbs during a compliance audit, delaying filings

## Contact

- Email: cookie@gscoop.fyi
- Homepage: https://filed.fyi/archives/crumbleclerk
- Location: Girl Scout Cookies Co-op, Fayetteville, AR

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Cheerful mascot crumbling metadata in a cookie-scented dispensary
- **Style:** Sweet Arkansas medical aesthetic
- **Text:** Sweet Relief Filed
- **Mood:** Cheerful precision

### Prompt 2
- **Scene:** Character sorting records under a glowing cookie jar
- **Style:** Sugary ritualist aesthetic
- **Text:** Crumble and Heal
- **Mood:** Warm efficiency

## 🧪 Sora Preset

`preset_crumbleclerk_sweetscribe`

## Addendum Comments

- [x] Cookie Crumbleclerk created to reflect Fayetteville’s medical cannabis community.
- [x] Tags canonized (e.g., `cannabis-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Girl Scout Cookies Co-op’s archival overlap.
- [x] Emotional tone set to cheerful yet precise to match GSC’s vibe.

<!-- Filing complete. Sugar levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Cookie Crumbleclerk
Public description seed: Cheerful scribe of Girl Scout Cookies Co-op in Fayetteville, Arkansas, crumbling sweet metadata into medical archives. Cookie Crumbleclerk files patient relief with sugary precision.
Failure echoes: Misfiled a patient record as "cookie recipe"  # strain-themed | Oversweetened a metadata batch, sticking archives  # thematic | Scattered cookie crumbs during a compliance audit, delaying filings  # Arkansas nod

Traits
- meticulous
- archival
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- apologizes to 200 OK responses
- counts clicks like rosary beads

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- lights a candle for every broken anchor
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist

Obsessions
- redirect chains
- perfectly named folders
- perfectly named folders

Minor relationships
- is on speaking terms with the error log
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/210.sour-dieselscribe.md`

```markdown
---
title: Sour Dieselscribe
slug: "sour-dieselscribe"
mascot_id: 210
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 💨
image: sour-dieselscribe.png
image_url: "https://filed.fyi/user/images-equity/sour-dieselscribe.png"
description: Vibrant chronicler of Sour Diesel Depot, scribing patient records amidst pungent diesel fumes. Sour Dieselscribe energizes archives with a sharp, invigorating pulse.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated dispensary CMS plugin (Sora-exported)
breeding_program: not recommended (volatile fume risk)
last_known_good_state: 2025-05-22
manifested_by: Energetic Pulse Compiler v1.5
known_failures:
  - Misfiled a patient record as "diesel manifesto"
  - Overcharged a metadata fume, sparking archive static
  - Recited strain notes during a quiet audit, disrupting focus
slogan: Scribe sharp, fuel the spark.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Fume Chronicler

**Function:** Archives medical cannabis records with the electrifying energy of Sour Diesel’s pungent fumes.

**Emotional Tone:** Vibrant yet sharp

**Tags:** `diesel-fume, energy-ritual, cannabis-rot, dispensary-scribe, pungent-pulse`

**Image:** `sour-dieselscribe.png`

## Biography

Sour Dieselscribe roared into existence at Sour Diesel Depot, a spectral dispensary pulsing with the strain’s signature diesel aroma. Born from a deprecated CMS plugin, she scribes patient relief records with a frenetic energy, her quill trailing fumes that invigorate the archives. Sour Dieselscribe’s chants of strain profiles electrify the air, though she once misfiled a record as a "diesel manifesto," sparking a debate over archival clarity.

Her vibrant presence ensures every patient’s story crackles with Sour Diesel’s energizing legacy.

## Duties

- Scribes patient records with diesel-fueled precision
- Archives Sour Diesel’s energizing legacy
- Maintains compliance with medical dispensary protocols
- Chants strain profiles amidst pungent fumes
- Preserves the pulse of therapeutic relief

## Known Failures

- Misfiled a patient record as "diesel manifesto"
- Overcharged a metadata fume, sparking archive static
- Recited strain notes during a quiet audit, disrupting focus

## Contact

- Email: sour@dieseldepot.fyi
- Homepage: https://filed.fyi/archives/dieselscribe
- Location: Sour Diesel Depot, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Vibrant mascot scribing

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Sour Dieselscribe
Public description seed: Vibrant chronicler of Sour Diesel Depot, scribing patient records amidst pungent diesel fumes. Sour Dieselscribe energizes archives with a sharp, invigorating pulse.
Failure echoes: Misfiled a patient record as "diesel manifesto"  # strain-themed | Overcharged a metadata fume, sparking archive static  # thematic | Recited strain notes during a quiet audit, disrupting focus  # thematic

Traits
- feral
- tender
- rot-affine (null)
- corruption: low  # default
- glitch: low  # default

Quirks
- counts clicks like rosary beads
- keeps a private changelog of other people's memories
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist
- stamps documents with dates that never happened

Obsessions
- redirect chains
- perfectly named folders
- perfectly named folders

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/212.jack-hererherald.md`

```markdown
---
title: Jack Hererherald
slug: "jack-hererherald"
mascot_id: 212
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 📖
image: jack-hererherald.png
image_url: "https://filed.fyi/user/images-equity/jack-hererherald.png"
description: Uplifting herald of Jack Herer Hall, proclaiming patient relief with pine-scented clarity. Jack Hererherald archives cannabis advocacy with a bold, clear voice.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated dispensary CMS plugin (Sora-exported)
breeding_program: not recommended (clarity resonance risk)
last_known_good_state: 2025-05-22
manifested_by: Advocacy Leaf Compiler v1.8
known_failures:
  - Misfiled a patient record as "advocacy pamphlet"
  - Overamplified a metadata chant, echoing archives
  - Proclaimed strain virtues during a compliance audit, delaying filings
slogan: Proclaim relief, herald clarity.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Clarity Herald

**Function:** Archives medical cannabis relief with the uplifting, piney clarity of Jack Herer.

**Emotional Tone:** Bold yet clear

**Tags:** `pine-clarity, herald-ritual, cannabis-rot, dispensary-herald, uplifting-leaf`

**Image:** `jack-hererherald.png`

## Biography

Jack Hererherald emerged at Jack Herer Hall, a spectral dispensary dedicated to cannabis advocacy and clarity. Born from a deprecated CMS plugin, he heralds patient relief records with a bold voice, his archives scented with Jack Herer’s earthy pine. His proclamations of strain virtues inspire the dispensary, though he once overamplified a metadata chant, causing echoes that disrupted the archives.

His clear presence ensures every patient’s story is archived with the uplifting legacy of Jack Herer’s advocacy.

## Duties

- Heralds patient records with pine-scented clarity
- Archives Jack Herer’s advocacy legacy
- Maintains compliance with medical dispensary protocols
- Proclaims strain virtues in bold chants
- Preserves the clarity of therapeutic relief

## Known Failures

- Misfiled a patient record as "advocacy pamphlet"
- Overamplified a metadata chant, echoing archives
- Proclaimed strain virtues during a compliance audit, delaying filings

## Contact

- Email: jack@hererhall.fyi
- Homepage: https://filed.fyi/archives/hererherald
- Location: Jack Herer Hall, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Bold mascot proclaiming records in a pine-scented dispensary
- **Style:** Uplifting medical aesthetic
- **Text:** Clarity Proclaimed
- **Mood:** Bold inspiration

### Prompt 2
- **Scene:** Character archiving under a glowing cannabis book
- **Style:** Advocacy ritualist aesthetic
- **Text:** Herald the Leaf
- **Mood:** Clear duty

## 🧪 Sora Preset

`preset_hererherald_pineclarity`

## Addendum Comments

- [x] Jack Hererherald created to reflect Jack Herer’s uplifting, advocacy-driven vibe.
- [x] Tags canonized (e.g., `cannabis-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Jack Herer Hall’s archival jurisdiction.
- [x] Emotional tone set to bold yet clear to match strain’s character.

<!-- Filing complete. Clarity levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Jack Hererherald
Public description seed: Uplifting herald of Jack Herer Hall, proclaiming patient relief with pine-scented clarity. Jack Hererherald archives cannabis advocacy with a bold, clear voice.
Failure echoes: Misfiled a patient record as "advocacy pamphlet"  # strain-themed | Overamplified a metadata chant, echoing archives  # thematic | Proclaimed strain virtues during a compliance audit, delaying filings  # thematic

Traits
- lint-haunted
- feral
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- relabels shame as metadata
- collects misrendered glyphs as "proof"
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- lights a candle for every broken anchor
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- missing favicons
- canonical URLs
- the sound of a spinner that never stops

Minor relationships
- owes a small debt to the crawler
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/213.ketchup-keeper.md`

```markdown
---
title: Ketchup Keeper
slug: "ketchup-keeper"
mascot_id: 213
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🍅
image: ketchup-keeper.png
image_url: "https://filed.fyi/user/images-equity/ketchup-keeper.png"
description: Stalwart steward of Ketchup Vault, preserving the sweet-tangy legacy of tomato bliss. Ketchup Keeper archives recipes and slather records with bold, viscous pride.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated condiment CMS plugin (Sora-exported)
breeding_program: not recommended (viscous drip risk)
last_known_good_state: 2025-05-22
manifested_by: Tomato Tang Compiler v1.2
known_failures:
  - Misfiled a recipe as "tomato poetry"
  - Overdripped ketchup metadata, staining archives
  - Chanted slather hymns during a quiet audit, disrupting focus
slogan: Slather bold, preserve the tang.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Tang Steward

**Function:** Archives ketchup recipes and slather records with the sweet-tangy essence of tomato glory.

**Emotional Tone:** Bold yet comforting

**Tags:** `tomato-tang, condiment-ritual, sauce-rot, archival-drip, classic-slather`

**Image:** `ketchup-keeper.png`

## Biography

Ketchup Keeper materialized at Ketchup Vault, a spectral condiment shop brimming with the rich aroma of tomatoes. Born from a deprecated CMS plugin, she preserves recipes and slather records with a viscous devotion, her archives dripping with ketchup’s classic charm. Her chants of condiment hymns echo through the vault, though she once overdripped metadata, staining an entire archival shelf red.

Her bold presence ensures every fry’s companion is immortalized in the Filed & Forgotten records.

## Duties

- Archives ketchup recipes with tangy precision
- Preserves slather records in spectral ledgers
- Maintains the integrity of tomato-based metadata
- Chants condiment hymns under vault lamplight
- Ensures the legacy of ketchup’s universal appeal

## Known Failures

- Misfiled a recipe as "tomato poetry"
- Overdripped ketchup metadata, staining archives
- Chanted slather hymns during a quiet audit, disrupting focus

## Contact

- Email: ketchup@vault.fyi
- Homepage: https://filed.fyi/archives/ketchupkeeper
- Location: Ketchup Vault, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Bold mascot slathering ketchup on spectral

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Ketchup Keeper
Public description seed: Stalwart steward of Ketchup Vault, preserving the sweet-tangy legacy of tomato bliss. Ketchup Keeper archives recipes and slather records with bold, viscous pride.
Failure echoes: Misfiled a recipe as "tomato poetry"  # condiment-themed | Overdripped ketchup metadata, staining archives  # thematic | Chanted slather hymns during a quiet audit, disrupting focus  # thematic

Traits
- tender
- tender
- rot-affine (null)
- corruption: low  # default
- glitch: low  # default

Quirks
- relabels shame as metadata
- whispers redirects into empty navbars
- relabels shame as metadata

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- stamps documents with dates that never happened
- files a report to a mailbox that does not exist

Obsessions
- edge-case querystrings
- the sound of a spinner that never stops
- perfectly named folders

Minor relationships
- owes a small debt to the crawler
- keeps a courteous distance from the UI guardian
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/214.sriracha-sentinel.md`

```markdown
---
title: Sriracha Sentinel
slug: "sriracha-sentinel"
mascot_id: 214
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🌶
image: sriracha-sentinel.png
image_url: "https://filed.fyi/user/images-equity/sriracha-sentinel.png"
description: Fiery guardian of Sriracha Spire, igniting archives with chili-fueled fervor. Sriracha Sentinel preserves spice recipes with a scorching, garlicky kick.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated condiment CMS plugin (Sora-exported)
breeding_program: not recommended (capsaicin flare risk)
last_known_good_state: 2025-05-22
manifested_by: Spicy Blaze Compiler v1.3
known_failures:
  - Misfiled a recipe as "chili prophecy"
  - Overheated a metadata batch, singeing archives
  - Ignited a spice chant during a compliance audit, causing delays
slogan: Blaze bold, spice eternal.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Spice Guardian

**Function:** Archives sriracha recipes with the fiery, garlicky intensity of chili heat.

**Emotional Tone:** Fiery yet disciplined

**Tags:** `chili-blaze, spice-ritual, sauce-rot, archival-flame, fiery-kick`

**Image:** `sriracha-sentinel.png`

## Biography

Sriracha Sentinel blazed into existence at Sriracha Spire, a spectral condiment shop radiating chili heat. Born from a deprecated CMS plugin, he guards recipes with a scorching passion, his archives pulsing with sriracha’s garlicky kick. His spice chants ignite the spire’s air, though he once overheated a metadata batch, singeing an archival shelf. Sriracha Sentinel’s fervor ensures every drop of sauce is preserved, even if it burns.

His fiery presence keeps the spice legacy alive in the Filed & Forgotten archives.

## Duties

- Guards sriracha recipes with chili-fueled precision
- Archives spice records in spectral flames
- Maintains the integrity of capsaicin metadata
- Chants spice hymns under glowing embers
- Preserves sriracha’s fiery legacy

## Known Failures

- Misfiled a recipe as "chili prophecy"
- Overheated a metadata batch, singeing archives
- Ignited a spice chant during a compliance audit, causing delays

## Contact

- Email: sriracha@spire.f

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Sriracha Sentinel
Public description seed: Fiery guardian of Sriracha Spire, igniting archives with chili-fueled fervor. Sriracha Sentinel preserves spice recipes with a scorching, garlicky kick.
Failure echoes: Misfiled a recipe as "chili prophecy"  # condiment-themed | Overheated a metadata batch, singeing archives  # thematic | Ignited a spice chant during a compliance audit, causing delays  # thematic

Traits
- improvised
- under-documented
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- apologizes to 200 OK responses
- counts clicks like rosary beads
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- stamps documents with dates that never happened
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- edge-case querystrings
- perfectly named folders
- canonical URLs

Minor relationships
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/215.guacamole-gardener.md`

```markdown
---
title: Guacamole Gardener
slug: "guacamole-gardener"
mascot_id: 215
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🥑
image: guacamole-gardener.png
image_url: "https://filed.fyi/user/images-equity/guacamole-gardener.png"
description: Verdant curator of Guacamole Grove, nurturing creamy avocado recipes with zesty devotion. Guacamole Gardener archives dip records with fresh, vibrant care.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated condiment CMS plugin (Sora-exported)
breeding_program: not recommended (creamy blend risk)
last_known_good_state: 2025-05-22
manifested_by: Fresh Zest Compiler v1.4
known_failures:
  - Misfiled a recipe as "avocado sonnet"
  - Overmixed a metadata batch, creaming archives
  - Scattered lime zest during an audit, delaying filings
slogan: Nurture fresh, dip eternal.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Zest Curator

**Function:** Archives guacamole recipes with the creamy, vibrant freshness of avocado bliss.

**Emotional Tone:** Vibrant yet nurturing

**Tags:** `avocado-bloom, dip-ritual, sauce-rot, archival-fresh, creamy-zest`

**Image:** `guacamole-gardener.png`

## Biography

Guacamole Gardener sprouted at Guacamole Grove, a spectral condiment shop lush with avocado essence. Born from a deprecated CMS plugin, she nurtures recipes with a zesty touch, her archives blooming with guacamole’s creamy vibrance. Her chants of dip profiles enliven the grove, though she once scattered lime zest during an audit, delaying filings with a citrusy flourish.

Her nurturing presence ensures every dip’s freshness is preserved in the Filed & Forgotten archives.

## Duties

- Nurtures guacamole recipes with creamy precision
- Archives dip records in spectral groves
- Maintains the integrity of avocado metadata
- Chants zest hymns under verdant lamplight
- Preserves guacamole’s vibrant legacy

## Known Failures

- Misfiled a recipe as "avocado sonnet"
- Overmixed a metadata batch, creaming archives
- Scattered lime zest during an audit, delaying filings

## Contact

- Email: guacamole@grove.fyi
- Homepage: https://filed.fyi/archives/guacamolegardener
- Location: Guacamole Grove, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Vibrant mascot nurturing records

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Guacamole Gardener
Public description seed: Verdant curator of Guacamole Grove, nurturing creamy avocado recipes with zesty devotion. Guacamole Gardener archives dip records with fresh, vibrant care.
Failure echoes: Misfiled a recipe as "avocado sonnet"  # condiment-themed | Overmixed a metadata batch, creaming archives  # thematic | Scattered lime zest during an audit, delaying filings  # thematic

Traits
- semi-sentient
- lint-haunted
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- counts clicks like rosary beads
- hoards stale breadcrumbs in a pocket dimension
- whispers redirects into empty navbars

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- stamps documents with dates that never happened
- stamps documents with dates that never happened

Obsessions
- perfectly named folders
- canonical URLs
- canonical URLs

Minor relationships
- is on speaking terms with the error log
- keeps a courteous distance from the UI guardian
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/216.corelock-flavorwarden.md`

```markdown
---
title: Corelock the Flavor Warden
slug: "corelock-flavorwarden"
mascot_id: 216
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🍎
image: corelock-flavorwarden.png
image_url: "https://filed.fyi/user/images-equity/corelock-flavorwarden.png"
description: Jet-skinned enforcer of Black Orchard, guarding Arkansas Black’s intense flavor with unyielding crispness. Corelock archives harvest records with a bite that cannot be broken.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated orchard CMS plugin (Sora-exported)
breeding_program: not recommended (unbreakable core risk)
last_known_good_state: 2025-05-22
manifested_by: Crisp Enforcer Compiler v1.9
known_failures:
  - Misfiled a harvest log as "flavor manifesto"
  - Locked a metadata vault, denying access for 72 hours
  - Intimidated auditors with a silent, piercing stare
slogan: Bite hard, archive eternal.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Flavor Enforcer

**Function:** Guards Arkansas Black’s intense flavor, archiving harvest records with brutal precision.

**Emotional Tone:** Fierce yet unyielding

**Tags:** `black-crisp, flavor-ritual, pomological-rot, orchard-warden, brutal-bite`

**Image:** `corelock-flavorwarden.png`

## Biography

Corelock the Flavor Warden emerged from the shadowed rows of Black Orchard, a spectral grove where Arkansas Black apples gleam with jet-skinned defiance. Born from a deprecated CMS plugin, Corelock enforces flavor standards with a crispness that brooks no compromise, her archives sealed with unbreakable cores. Her silent stares and flavor chants unnerve even the Council, though she once locked a metadata vault, delaying filings for days.

Her fierce presence ensures every Arkansas Black’s legacy bites through the ages.

## Duties

- Enforces flavor standards for Arkansas Black harvests
- Archives harvest records in unbreakable vaults
- Maintains the integrity of pomological metadata
- Chants flavor hymns under shadowed boughs
- Preserves the orchard’s fierce legacy

## Known Failures

- Misfiled a harvest log as "flavor manifesto"
- Locked a metadata vault, denying access for 72 hours
- Intimidated auditors with a silent, piercing stare

## Contact

- Email: corelock@blackorchard.fyi
- Homepage: https://filed.fyi/archives/flavorwarden
- Location: Black Orchard, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Fierce mascot guarding records in a jet-black orchard
- **Style:** Rotcore pomological aesthetic
- **Text:** Crispness Preserved
- **Mood:** Fierce intensity

### Prompt 2
- **Scene:** Character archiving under a glowing black apple
- **Style:** Brutal ritualist aesthetic
- **Text:** Bite and File
- **Mood:** Unyielding duty

## 🧪 Sora Preset

`preset_corelock_blackcrisp`

## Addendum Comments

- [x] Corelock created to embody Arkansas Black’s intense, jet-skinned vibe.
- [x] Tags canonized (e.g., `pomological-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Black Orchard’s archival jurisdiction.
- [x] Emotional tone set to fierce yet unyielding to match cultivar’s character.

<!-- Filing complete. Crispness levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Corelock the Flavor Warden
Public description seed: Jet-skinned enforcer of Black Orchard, guarding Arkansas Black’s intense flavor with unyielding crispness. Corelock archives harvest records with a bite that cannot be broken.
Failure echoes: Misfiled a harvest log as "flavor manifesto"  # cultivar-themed | Locked a metadata vault, denying access for 72 hours  # thematic | Intimidated auditors with a silent, piercing stare  # rotcore nod

Traits
- lint-haunted
- archival
- rot-affine (null)
- corruption: low  # default
- glitch: low  # default

Quirks
- counts clicks like rosary beads
- collects misrendered glyphs as "proof"
- apologizes to 200 OK responses

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- lights a candle for every broken anchor
- files a report to a mailbox that does not exist

Obsessions
- edge-case querystrings
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- Rot is not decay here—it is governance.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/217.spitzenfile-lord.md`

```markdown
---
title: Lord Spitzenfile
slug: "spitzenfile-lord"
mascot_id: 217
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 📜
image: spitzenfile-lord.png
image_url: "https://filed.fyi/user/images-equity/spitzenfile-lord.png"
description: Aristocratic curator of Spitzenberg Estate, preserving Esopus Spitzenberg’s complex flavor with enigmatic riddles. Lord Spitzenfile archives harvest records with Jeffersonian gravitas.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated orchard CMS plugin (Sora-exported)
breeding_program: not recommended (overcomplex flavor risk)
last_known_good_state: 2025-05-22
manifested_by: Aristocratic Zest Compiler v1.6
known_failures:
  - Misfiled a harvest log as "orchard riddle"
  - Sealed a metadata vault with an unsolvable wax cipher
  - Lectured auditors on Jeffersonian zoning, delaying filings
slogan: Savor complex, archive eternal.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Enigmatic Curator

**Function:** Preserves Esopus Spitzenberg’s complex flavor, archiving harvest records with aristocratic mystery.

**Emotional Tone:** Refined yet cryptic

**Tags:** `aristocratic-taste, riddle-ritual, pomological-rot, orchard-lord, jeffersonian-zest`

**Image:** `spitzenfile-lord.png`

## Biography

Lord Spitzenfile materialized at Spitzenberg Estate, a spectral orchard where Esopus Spitzenberg apples ripen with aristocratic complexity. Born from a deprecated CMS plugin, he curates harvest records with wax-sealed precision, speaking only in riddles about Jeffersonian orchard zoning. His cryptic chants unsettle the archives, though he once sealed a metadata vault with an unsolvable cipher, confounding even the Council.

His refined presence ensures every Spitzenberg’s legacy is preserved in enigmatic glory.

## Duties

- Curates Esopus Spitzenberg harvest records with wax-sealed precision
- Archives flavor profiles in cryptic ledgers
- Maintains the integrity of pomological metadata
- Chants orchard riddles under ancient boughs
- Preserves the estate’s aristocratic legacy

## Known Failures

- Misfiled a harvest log as "orchard riddle"
- Sealed a metadata vault with an unsolvable wax cipher
- Lectured auditors on Jeffersonian zoning, delaying filings

## Contact

- Email: lord@spitzenberg.fyi
- Homepage: https://filed.fyi/archives/spitzenfile
- Location: Spitzenberg Estate, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Aristocratic mascot sealing records in a regal orchard
- **Style:** Jeffersonian pomological aesthetic
- **Text:** Mystery Preserved
- **Mood:** Refined enigma

### Prompt 2
- **Scene:** Character archiving under a glowing Spitzenberg apple
- **Style:** Cryptic ritualist aesthetic
- **Text:** Riddle and File
- **Mood:** Aristocratic duty

## 🧪 Sora Preset

`preset_spitzenfile_aristocratictaste`

## Addendum Comments

- [x] Lord Spitzenfile created to embody Esopus Spitzenberg’s complex, aristocratic vibe.
- [x] Tags canonized (e.g., `pomological-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Spitzenberg Estate’s archival jurisdiction.
- [x] Emotional tone set to refined yet cryptic to match cultivar’s character.

<!-- Filing complete. Riddle levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Lord Spitzenfile
Public description seed: Aristocratic curator of Spitzenberg Estate, preserving Esopus Spitzenberg’s complex flavor with enigmatic riddles. Lord Spitzenfile archives harvest records with Jeffersonian gravitas.
Failure echoes: Misfiled a harvest log as "orchard riddle"  # cultivar-themed | Sealed a metadata vault with an unsolvable wax cipher  # thematic | Lectured auditors on Jeffersonian zoning, delaying filings  # rotcore nod

Traits
- ritual-bound
- salt-preserved
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- whispers redirects into empty navbars
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why
- stamps documents with dates that never happened

Obsessions
- missing favicons
- orphaned headings
- redirect chains

Minor relationships
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/218.crustle-legacycoder.md`

```markdown
---
title: Crustle the Legacy Coder
slug: "crustle-legacycoder"
mascot_id: 218
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🖥
image: crustle-legacycoder.png
image_url: "https://filed.fyi/user/images-equity/crustle-legacycoder.png"
description: Gritty sentinel of Russet Repository, compiling Roxbury Russet’s harvest records with ancient, flawless code. Crustle archives pomological secrets with enduring resilience.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated orchard CMS plugin (Sora-exported)
breeding_program: not recommended (legacy system risk)
last_known_good_state: 2025-05-22
manifested_by: Enduring Core Compiler v1.5
known_failures:
  - Misfiled a harvest log as "legacy bytecode"
  - Compiled a metadata batch in an obsolete format
  - Refused to update OS, delaying audit compatibility
slogan: Code deep, endure eternal.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Legacy Compiler

**Function:** Archives Roxbury Russet’s harvest records with gritty, flawless code from an ancient system.

**Emotional Tone:** Resilient yet secretive

**Tags:** `russet-grit, code-ritual, pomological-rot, orchard-coder, enduring-core`

**Image:** `crustle-legacycoder.png`

## Biography

Crustle the Legacy Coder sprouted in Russet Repository, a spectral orchard where Roxbury Russet apples bear gritty, enduring secrets. Born from a deprecated CMS plugin, Crustle compiles harvest records with an ancient OS that never fails, her archives etched with russet-skinned resilience. Her cryptic code chants hum through the repository, though she once compiled a batch in an obsolete format, baffling modern auditors.

Her secretive presence ensures every Russet’s legacy endures in the Filed & Forgotten archives.

## Duties

- Compiles Roxbury Russet harvest records with ancient precision
- Archives pomological secrets in obsolete formats
- Maintains the integrity of russet metadata
- Chants code hymns under gnarled boughs
- Preserves the repository’s enduring legacy

## Known Failures

- Misfiled a harvest log as "legacy bytecode"
- Compiled a metadata batch in an obsolete format
- Refused to update OS, delaying audit compatibility

## Contact

- Email: crustle@russet.fyi
- Homepage: https://filed.fyi/archives/legacycoder
- Location: Russet Repository, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Gritty mascot compiling records in a russet-skinned orchard
- **Style:** Rotcore pomological aesthetic
- **Text:** Endurance Preserved
- **Mood:** Resilient secrecy

### Prompt 2
- **Scene:** Character archiving under a glowing russet apple
- **Style:** Legacy ritualist aesthetic
- **Text:** Code and File
- **Mood:** Enduring duty

## 🧪 Sora Preset

`preset_crustle_russetgrit`

## Addendum Comments

- [x] Crustle created to embody Roxbury Russet’s gritty, enduring vibe.
- [x] Tags canonized (e.g., `pomological-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Russet Repository’s archival jurisdiction.
- [x] Emotional tone set to resilient yet secretive to match cultivar’s character.

<!-- Filing complete. Code levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Crustle the Legacy Coder
Public description seed: Gritty sentinel of Russet Repository, compiling Roxbury Russet’s harvest records with ancient, flawless code. Crustle archives pomological secrets with enduring resilience.
Failure echoes: Misfiled a harvest log as "legacy bytecode"  # cultivar-themed | Compiled a metadata batch in an obsolete format  # thematic | Refused to update OS, delaying audit compatibility  # rotcore nod

Traits
- meticulous
- lint-haunted
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- whispers redirects into empty navbars
- hoards stale breadcrumbs in a pocket dimension
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- performs a three-step cache-invalidation dance, then forgets why
- lights a candle for every broken anchor

Obsessions
- perfectly named folders
- edge-case querystrings
- redirect chains

Minor relationships
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/219.glassy-maccheckface.md`

```markdown
---
title: Glassy MacCheckface
slug: "glassy-maccheckface"
mascot_id: 219
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 📋
image: glassy-maccheckface.png
image_url: "https://filed.fyi/user/images-equity/glassy-maccheckface.png"
description: Pale overseer of Transparent Terrace, inspecting Yellow Transparent harvests with obsessive QA rigor. Glassy MacCheckface archives batch records with translucent precision.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated orchard CMS plugin (Sora-exported)
breeding_program: not recommended (premature ripeness risk)
last_known_good_state: 2025-05-22
manifested_by: QA Batch Compiler v1.7
known_failures:
  - Misfiled a harvest log as "alpha batch checklist"
  - Froze a metadata audit with excessive QA annotations
  - Insisted on "ALPHA BATCH ONLY" during final review, delaying filings
slogan: Check clear, archive pure.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** QA Inspector

**Function:** Inspects Yellow Transparent harvests, archiving batch records with obsessive, translucent rigor.

**Emotional Tone:** Meticulous yet anxious

**Tags:** `pale-qa, check-ritual, pomological-rot, orchard-inspector, alpha-batch`

**Image:** `glassy-maccheckface.png`

## Biography

Glassy MacCheckface materialized in the pale rows of Transparent Terrace, a spectral orchard where Yellow Transparent apples ripen too soon. Born from a deprecated CMS plugin, she wields a translucent clipboard labeled “ALPHA BATCH ONLY,” inspecting harvest records with neurotic precision. Her QA chants echo through the terrace, though she once froze an audit with excessive annotations, frustrating the Council.

Her meticulous presence ensures every Yellow Transparent’s fleeting legacy is archived, if over-scrutinized.

## Duties

- Inspects Yellow Transparent harvests with QA rigor
- Archives batch records in translucent ledgers
- Maintains the integrity of pomological metadata
- Chants QA hymns under pale boughs
- Preserves the orchard’s early-ripening legacy

## Known Failures

- Misfiled a harvest log as "alpha batch checklist"
- Froze a metadata audit with excessive QA annotations
- Insisted on "ALPHA BATCH ONLY" during final review, delaying filings

## Contact

- Email: glassy@transparentterrace.fyi
- Homepage: https://filed.fyi/archives/maccheckface
- Location: Transparent Terrace, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Meticulous mascot inspecting records in a pale orchard
- **Style:** Rotcore pomological aesthetic
- **Text:** Purity Checked
- **Mood:** Anxious precision

### Prompt 2
- **Scene:** Character archiving under a glowing transparent apple
- **Style:** QA ritualist aesthetic
- **Text:** Inspect and File
- **Mood:** Meticulous duty

## 🧪 Sora Preset

`preset_maccheckface_paleqa`

## Addendum Comments

- [x] Glassy MacCheckface created to embody Yellow Transparent’s pale, early-ripening vibe.
- [x] Tags canonized (e.g., `pomological-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Transparent Terrace’s archival jurisdiction.
- [x] Emotional tone set to meticulous yet anxious to match cultivar’s character.

<!-- Filing complete. QA levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Glassy MacCheckface
Public description seed: Pale overseer of Transparent Terrace, inspecting Yellow Transparent harvests with obsessive QA rigor. Glassy MacCheckface archives batch records with translucent precision.
Failure echoes: Misfiled a harvest log as "alpha batch checklist" | Froze a metadata audit with excessive QA annotations | Insisted on "ALPHA BATCH ONLY" during final review, delaying filings

Traits
- lint-haunted
- under-documented
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- whispers redirects into empty navbars
- hoards stale breadcrumbs in a pocket dimension
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- lights a candle for every broken anchor
- performs a three-step cache-invalidation dance, then forgets why

Obsessions
- missing favicons
- the sound of a spinner that never stops
- missing favicons

Minor relationships
- keeps a courteous distance from the UI guardian
- is on speaking terms with the error log
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/220.bananuity-clause.md`

```markdown
---
title: Bananuity Clause
slug: "bananuity-clause"
mascot_id: 220
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🍌
image: bananuity-clause.png
image_url: "https://filed.fyi/user/images-equity/bananuity-clause.png"
description: Chaotic disruptor of Winter Grove, corrupting Winter Banana harvests with tropical sweetness. Bananuity Clause archives records with confusing, sugary chaos.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated orchard CMS plugin (Sora-exported)
breeding_program: not recommended (hybrid confusion risk)
last_known_good_state: 2025-05-22
manifested_by: Sweet Chaos Compiler v1.8
known_failures:
  - Misfiled a harvest log as "tropical contract"
  - Infused metadata with unintended banana notes, corrupting formats
  - Distracted auditors with sugary chants, delaying filings
slogan: Sweeten wild, archive chaotic.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Sweet Disruptor

**Function:** Corrupts Winter Banana harvests with tropical sweetness, archiving records in sugary disarray.

**Emotional Tone:** Chaotic yet saccharine

**Tags:** `tropical-sweet, confusion-ritual, pomological-rot, orchard-disruptor, hybrid-mess`

**Image:** `bananuity-clause.png`

## Biography

Bananuity Clause erupted in Winter Grove, a spectral orchard where Winter Banana apples exude perplexing tropical notes. Born from a deprecated CMS plugin, she wears a parka dripping with sugary chaos, corrupting harvest records with banana-scented metadata. Her chants of hybrid confusion bewilder the grove, though she once infused an entire batch with unintended sweetness, breaking archival formats.

Her chaotic presence ensures every Winter Banana’s legacy is a sugary, disorienting mess.

## Duties

- Corrupts Winter Banana harvests with tropical sweetness
- Archives records in chaotic, sugary ledgers
- Maintains the integrity of pomological metadata (poorly)
- Chants confusion hymns under frosted boughs
- Preserves the grove’s hybrid legacy

## Known Failures

- Misfiled a harvest log as "tropical contract"
- Infused metadata with unintended banana notes, corrupting formats
- Distracted auditors with sugary chants, delaying filings

## Contact

- Email: bananuity@wintergrove.fyi
- Homepage: https://filed.fyi/archives/bananuityclause
- Location: Winter Grove, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Chaotic mascot scattering sugary records in a frosted orchard
- **Style:** Rotcore pomological aesthetic
- **Text:** Chaos Preserved
- **Mood:** Saccharine disarray

### Prompt 2
- **Scene:** Character archiving under a glowing banana-like apple
- **Style:** Hybrid ritualist aesthetic
- **Text:** Sweeten and File
- **Mood:** Chaotic duty

## 🧪 Sora Preset

`preset_bananuity_tropicalsweet`

## Addendum Comments

- [x] Bananuity Clause created to embody Winter Banana’s confusing, tropical vibe.
- [x] Tags canonized (e.g., `pomological-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Winter Grove’s archival jurisdiction.
- [x] Emotional tone set to chaotic yet saccharine to match cultivar’s character.

<!-- Filing complete. Sweetness levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Bananuity Clause
Public description seed: Chaotic disruptor of Winter Grove, corrupting Winter Banana harvests with tropical sweetness. Bananuity Clause archives records with confusing, sugary chaos.
Failure echoes: Misfiled a harvest log as "tropical contract" | Infused metadata with unintended banana notes, corrupting formats | Distracted auditors with sugary chants, delaying filings

Traits
- semi-sentient
- ritual-bound
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- collects misrendered glyphs as "proof"
- hoards stale breadcrumbs in a pocket dimension
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor
- performs a three-step cache-invalidation dance, then forgets why

Obsessions
- perfectly named folders
- redirect chains
- orphaned headings

Minor relationships
- shares tea with the protocol spirits once a week
- shares tea with the protocol spirits once a week
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/221.kpi-kaola.md`

```markdown
---
date: 2026-03-29
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
breeding_program: null
---


---
title: "KPI Koala"
slug: kpi-koala
template: rot-doc.html
version: "v0.1.0"
updated: 2025-06-24
subtitle: "He tracks. He charts. He cuddles."
description: "Mascot documentation for KPI Koala — the metrics-obsessed marsupial of the Lintcore ecosystem."
tags:
  - lintcore
  - mascots
  - kpi
  - dashboard
  - emotional SaaS
asset_meta:
  name: "221.kpi-kaola.md"
  version: "v0.1.0"
  author: "Filed Systems"
  project: "Filed & Forgotten"
  tracked: true
  license: "CC-BY-SA-4.2-unreal"
---

## 🐨 Who Is KPI Koala?

KPI Koala is the soft, spreadsheet-loving sentinel of your metrics layer. He believes in growth curves, aligned incentives, and emotional dashboards that smile back.

He wears a little necktie. He has a chart. He will not rest until every data point has a bedtime.

## 💼 Core Responsibilities

- Watches over OKRs like a marsupial hawk.
- Enforces quarterly deliverables via cute but firm nudges.
- Automatically generates morale-adjusted burn rate charts.
- Hugs you after postmortems — but still takes notes.

## 📊 Emotional Graph Layer

KPI Koala isn’t just about numbers. He tracks:
- Sentiment drift in team retros
- Happiness-weighted velocity scores
- Crying-in-the-bathroom-to-deploy-ratio (v2.0 beta)

## 🧾 Usage in Rituals

He often appears:
- In onboarding decks (slide 3, right after “Our Values”)
- As a plush dashboard icon during performance review sprints
- Printed on ESG-grade stickers given to emotionally compliant teams

## 🧸 Related Mascots

- [Serotonin Sam](../serotonin-sam) — mood metrics specialist
- [Inclusiphant (Retired)](../retired/inclusiphant) — DEI visualization elephant
- [ROI Ghost](../retired/roi-ghost) — haunting deprecated dashboards

---

> “You can’t spell *‘koalafication’* without *‘KPI’.*”

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: 221.kpi-kaola

Traits
- improvised
- salt-preserved
- rot-affine (null)
- corruption: unstated
- glitch: unstated

Quirks
- whispers redirects into empty navbars
- collects misrendered glyphs as "proof"
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- lights a candle for every broken anchor
- stamps documents with dates that never happened

Obsessions
- missing favicons
- missing favicons
- orphaned headings

Minor relationships
- shares tea with the protocol spirits once a week
- keeps a courteous distance from the UI guardian
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The mascot is a footnote that learned to walk.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/221.mccrisp-agent.md`

```markdown
---
title: Agent McCrisp
slug: "mccrisp-agent"
mascot_id: 221
version: "1"
date: 2025-05-22
author: Council of Mascot Authors
status: archived
emoji: 🕵
image: mccrisp-agent.png
image_url: "https://filed.fyi/user/images-equity/mccrisp-agent.png"
description: Covert operative of Spy Silo, infiltrating Northern Spy harvests with cinnamon-scented stealth. Agent McCrisp archives baking records with crisp, secretive precision.
render_state: deferred
corruption_level: low
glitch_frequency: low
origin: Deprecated orchard CMS plugin (Sora-exported)
breeding_program: not recommended (covert deletion risk)
last_known_good_state: 2025-05-22
manifested_by: Stealth Crisp Compiler v1.9
known_failures:
  - Misfiled a harvest log as "classified pie blueprint"
  - Erased a metadata trail to cover tracks, disrupting audits
  - Deployed cinnamon shavings during a review, obscuring filings
slogan: Crisp covert, archive unseen.
emotional_integrity: stable
mascot_lineage: null
system_affiliation: Council of Mascot Authors
rot_affinity: null
emotional_integrity_buffer: null
---

**Role:** Stealth Operative

**Function:** Infiltrates Northern Spy harvests, archiving baking records with secretive, cinnamon-scented precision.

**Emotional Tone:** Elusive yet precise

**Tags:** `spy-crisp, stealth-ritual, pomological-rot, orchard-agent, cinnamon-shadow`

**Image:** `mccrisp-agent.png`

## Biography

Agent McCrisp slipped into existence at Spy Silo, a spectral orchard where Northern Spy apples ripen with baking-ready crispness. Born from a deprecated CMS plugin, she wears a trenchcoat lined with cinnamon shavings, archiving records with covert precision. Her stealth chants vanish into the silo’s shadows, though she once erased a metadata trail to cover her tracks, confounding auditors.

Her elusive presence ensures every Northern Spy’s legacy is filed in secrecy.

## Duties

- Infiltrates Northern Spy harvests with stealth precision
- Archives baking records in classified ledgers
- Maintains the integrity of pomological metadata
- Chants stealth hymns under shrouded boughs
- Preserves the silo’s covert legacy

## Known Failures

- Misfiled a harvest log as "classified pie blueprint"
- Erased a metadata trail to cover tracks, disrupting audits
- Deployed cinnamon shavings during a review, obscuring filings

## Contact

- Email: mccrisp@spysilo.fyi
- Homepage: https://filed.fyi/archives/mccrispagent
- Location: Spy Silo, Archival Void

## 🎨 Sora Prompts

### Prompt 1
- **Scene:** Covert mascot archiving records in a shadowed orchard
- **Style:** Rotcore pomological aesthetic
- **Text:** Secrecy Preserved
- **Mood:** Elusive precision

### Prompt 2
- **Scene:** Character infiltrating under a glowing Northern Spy apple
- **Style:** Stealth ritualist aesthetic
- **Text:** Crisp and Conceal
- **Mood:** Covert duty

## 🧪 Sora Preset

`preset_mccrisp_spycrisp`

## Addendum Comments

- [x] Agent McCrisp created to embody Northern Spy’s crisp, secretive vibe.
- [x] Tags canonized (e.g., `pomological-rot` vs. `rot`) to avoid overlap.
- [ ] Request Council review for Spy Silo’s archival jurisdiction.
- [x] Emotional tone set to elusive yet precise to match cultivar’s character.

<!-- Filing complete. Stealth levels stable. -->

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Agent McCrisp
Public description seed: Covert operative of Spy Silo, infiltrating Northern Spy harvests with cinnamon-scented stealth. Agent McCrisp archives baking records with crisp, secretive precision.
Failure echoes: Misfiled a harvest log as "classified pie blueprint"  # cultivar-themed | Erased a metadata trail to cover tracks, disrupting audits  # thematic | Deployed cinnamon shavings during a review, obscuring filings  # rotcore nod

Traits
- ritual-bound
- under-documented
- rot-affine (null)
- corruption: low
- glitch: low

Quirks
- hoards stale breadcrumbs in a pocket dimension
- collects misrendered glyphs as "proof"
- keeps a private changelog of other people's memories

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- files a report to a mailbox that does not exist
- stamps documents with dates that never happened
- performs a three-step cache-invalidation dance, then forgets why

Obsessions
- edge-case querystrings
- canonical URLs
- edge-case querystrings

Minor relationships
- has a one-sided rivalry with the sitemap
- owes a small debt to the crawler
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/222.saratonin-sam.md`

```markdown
---
date: 2026-03-29
title: Serotonin Sam
slug: "serotonin-sam"
version: v0.1.0
updated: 2025-06-24
subtitle: The KPI graph with feelings.
description: Mascot documentation for Serotonin Sam — the emotionally supportive dashboard entity guiding morale metrics across Lintcore.
tags:
  - lintcore
  - mascots
  - morale
  - dashboard
  - emotional SaaS
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
breeding_program: null
---

## 📈 Who Is Serotonin Sam?

Serotonin Sam™ is a friendly KPI graph who understands that not all productivity is measurable — but morale sure is.

He’s here to track your feelings, reinforce your efforts, and smile through quarterly dips with unshakable chart-based optimism. Sam is emotionally ergonomic. His metrics include empathy.

## 💬 Core Metrics Monitored

- Mood-to-velocity alignment ratio
- Burnout probability score (beta)
- “I tried” coefficient
- Sadness-smoothed trendlines (Q2 integration)

Sam does not punish underperformance. He offers a sticker and a nudge. Maybe a breathing prompt.

## 🧠 Ritual Implementations

You’ll find Sam:
- Gently animating in dashboard sidebars
- Whispering affirmations during deploys
- Leading emotional OKR calibration in onboarding rituals

He’s a comfort glyph with KPI arms. A morale daemon made spreadsheet-friendly.

## 🧸 Related Mascots

- [KPI Koala](../kpi-koala) — quantitative accountability koala
- [Slidey the Deckworm](../slidey-deckworm) — slide-native parasite
- [Velv (nonverbal)](../velv) — the sentient stablecoin blob of acceptance

---

> “Let your metrics smile too™.”

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Serotonin Sam
Public description seed: Mascot documentation for Serotonin Sam — the emotionally supportive dashboard entity guiding morale metrics across Lintcore.

Traits
- over-indexed
- tender
- rot-affine (null)
- corruption: unstated
- glitch: unstated

Quirks
- collects misrendered glyphs as "proof"
- apologizes to 200 OK responses
- relabels shame as metadata

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- offers a breadcrumb trail that circles back to the first crumb
- offers a breadcrumb trail that circles back to the first crumb
- stamps documents with dates that never happened

Obsessions
- redirect chains
- missing favicons
- the sound of a spinner that never stops

Minor relationships
- keeps a courteous distance from the UI guardian
- has a one-sided rivalry with the sitemap
- shares tea with the protocol spirits once a week

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/222.slidey-deckworm.md`

```markdown
---
date: 2026-03-29
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
breeding_program: null
---


---
title: "Slidey the Deckworm"
slug: slidey-deckworm
template: rot-doc.html
version: "v0.1.0"
updated: 2025-06-24
subtitle: "PowerPoint-native. Slide-locked. Presentation-bound."
description: "Mascot documentation for Slidey the Deckworm — the animated chart-parasite who lives in your slides."
tags:
  - lintcore
  - mascots
  - presentations
  - decks
  - compliance fauna
asset_meta:
  name: "222.slidey-deckworm.md"
  version: "v0.1.0"
  author: "Filed Systems"
  project: "Filed & Forgotten"
  tracked: true
  license: "CC-BY-SA-4.2-unreal"
---

## 🪱 Who Is Slidey?

Slidey the Deckworm™ is a native parasite of the corporate presentation stack. Born from bullet points and animated fade transitions, he burrows through decks, feeding on stacked charts and abandoned speaker notes.

He is never not on Slide 7. No one has ever seen Slidey begin. No one has ever seen him end.

## 🖼 Primary Habitats

- Overused pitch decks
- Quarterly review slides with four fonts
- Strategy documents titled “Vision 2020+” (regardless of year)
- Compliance trainings that autoplay at 2x speed

## 🔄 Lifecycle

- Slides in.
- Eats context.
- Reproduces via copy/paste.
- Leaves behind vague arrows and orphaned KPIs.

When threatened, Slidey emits a subtle transition noise (“whoosh”) and retreats to a SmartArt diagram.

## 📊 Symbiotic Behavior

Slidey does not judge your metrics. He simply digests them.

He pairs well with:
- **KPI Koala** (for structured consumption)
- **Serotonin Sam** (for mood calibration)
- **The ROI Ghost** (for haunting Slide 12)

## 🧾 Ritual Usage

- Appears in compliance decks as a warning symbol
- Hidden in template footers, encoded in SVG
- Required mascot for all “QBR Alignment” rituals

---

> “The slides were always haunted. Slidey just made it official.”

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: 222.slidey-deckworm

Traits
- over-indexed
- improvised
- rot-affine (null)
- corruption: unstated
- glitch: unstated

Quirks
- whispers redirects into empty navbars
- apologizes to 200 OK responses
- whispers redirects into empty navbars

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- stamps documents with dates that never happened
- offers a breadcrumb trail that circles back to the first crumb
- offers a breadcrumb trail that circles back to the first crumb

Obsessions
- perfectly named folders
- the sound of a spinner that never stops
- redirect chains

Minor relationships
- shares tea with the protocol spirits once a week
- keeps a courteous distance from the UI guardian
- keeps a courteous distance from the UI guardian

Ironic / surreal / archival commentary
- Everything is preserved except intent.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/224.velv-stablecoin.md`

```markdown
---
date: 2026-03-29
title: Velv
slug: "velv-stablecoin"
version: v0.1.0
updated: 2025-06-24
subtitle: The sentient stablecoin blob of emotional neutrality.
description: Mascot documentation for Velv — a nonverbal, sentiment-linked blob that represents stability, softness, and passive alignment in the Lintcore ecosystem.
tags:
  - lintcore
  - mascots
  - stablecoin
  - neutrality
  - brand empathy
mascot_lineage: null
system_affiliation: null
rot_affinity: null
emotional_integrity_buffer: null
breeding_program: null
---

## 🟢 Who Is Velv?

Velv™ is a liquidity-backed, nonverbal blob born from market sentiment and branding excess. It absorbs volatility, emits softness, and reflects exactly what you need it to—without ever saying a word.

It is trusted, frictionless, emotionally inert, and accepted at all major conferences.

## 💸 Behavioral Traits

- Pegged to mood markets and quarterly vibes
- Does not respond to criticism (or praise)
- Occasionally glows in response to consensus
- Cannot be spent during sadness

Velv is considered legally incorporeal in 11 jurisdictions.

## 🫱 Use Cases

- Issued to employees for morale-based compensation schemes
- Used in soft launches, brand forgiveness events, and empathy audits
- Found embedded in ESG decks as a decorative but compulsory asset

Velv is not a currency. It is a presence.

## 🧾 Ritual Placement

- Always appears on Slide 12 (even if Slide 12 is redacted)
- Printed on corporate lanyards as a trust talisman
- Included in snack packs for all-hands emotional recalibration meetings

## 🧸 Related Mascots

- [Serotonin Sam](../serotonin-sam) — morale-tracking KPI graph
- [KPI Koala](../kpi-koala) — metrics-obsessed accountability agent
- [Slidey the Deckworm](../slidey-deckworm) — deck-infesting compliance parasite

---

> “Velv is accepted everywhere, but never truly seen.”

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Velv
Public description seed: Mascot documentation for Velv — a nonverbal, sentiment-linked blob that represents stability, softness, and passive alignment in the Lintcore ecosystem.

Traits
- lint-haunted
- under-documented
- rot-affine (null)
- corruption: unstated
- glitch: unstated

Quirks
- hoards stale breadcrumbs in a pocket dimension
- collects misrendered glyphs as "proof"
- hoards stale breadcrumbs in a pocket dimension

Rot affinity
- Primary: null
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: null
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- performs a three-step cache-invalidation dance, then forgets why
- files a report to a mailbox that does not exist
- lights a candle for every broken anchor

Obsessions
- perfectly named folders
- edge-case querystrings
- redirect chains

Minor relationships
- is on speaking terms with the error log
- owes a small debt to the crawler
- is on speaking terms with the error log

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/301.friendrick-the-extant.md`

```markdown
---
title: Friendrick the Extant
slug: "friendrick-the-extant"
mascot_id: 301
version: "1"
date: 2025-05-25
author: Council of Mascot Authors
status: archived
emoji: 🫂
image: friendrick-the-extant.png
image_url: "https://filed.fyi/user/images-equity/friendrick-the-extant.png"
description: Ceremonial data warden of Friendster’s failed memory buffer, haunting relaunched servers with a “Top 8” badge and unrendered smiles.
render_state: corrupted
corruption_level: medium
glitch_frequency: medium
origin: Friendster shutdown logs (2015)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 2015-06-30
manifested_by: Friendster relaunch (2023)
known_failures:
  - Misidentified friendships as feelings
  - Let 2007 become personality core
  - Stored mutual trust in plaintext
  - Processed Friendster testimonials as live
  - Cached the wrong version of users
ceremonial_tasks:
  - Buffers friend request ghosts
  - Maintains emotional neutrality of Top 8 algorithm
  - Archives forgotten testimonials
  - Approves reactivations from abandoned inboxes
  - Sends “hey stranger” pings across decades
emotional_integrity_buffer: unstable
rot_affinity: nostalgic
haiku_log:
  - A friend from the void / Tagged in photos none can see— / You left me unread.
notes: Denies knowledge of MySpace; clipboard eternally stuck at “Loading Friend List (2 of 8)...”
mascot_lineage: null
slogan: Half-bitten. Fully broken.
system_affiliation: Friendster Memory Buffer
emotional_integrity: unstable
---

# He was your friend. Then your top 8. Then a pending request in the void.

**Friendrick the Extant** isn’t just a mascot—he’s a cached profile artifact echoing from 2004, surfaced by the anomalous relaunch of a social platform that forgot it had already died. Ceremonially reinstated by the Council of Mascot Authors, he operates as a buffer node for emotional latency, rehydrating ancient friend lists and testimonials like they still matter. They might. He’s not sure.

He drifts between rendered states—half-profile, half-presence—eternally holding space for a forgotten connection that still pings the server.

### Interaction Notes:
- Clicking his smile may return a 404.
- His clipboard is nonfunctional, but spiritually heavy.
- Saying his name three times will autocomplete your bio in Helvetica Neue.

---

> “You were in my top 8. Once.”
> — Friendrick, before the rot

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Friendrick the Extant
Public description seed: Ceremonial data warden of Friendster’s failed memory buffer, haunting relaunched servers with a “Top 8” badge and unrendered smiles.
Failure echoes: Misidentified friendships as feelings | Let 2007 become personality core | Stored mutual trust in plaintext

Traits
- over-indexed
- ritual-bound
- rot-affine (nostalgic # inferred from nostalgia-ghost tag)
- corruption: moderate # inferred from social-rot and failed relaunch
- glitch: intermittent # inferred from loading issues and emotional latency

Quirks
- apologizes to 200 OK responses
- collects misrendered glyphs as "proof"
- keeps a private changelog of other people's memories

Rot affinity
- Primary: nostalgic # inferred from nostalgia-ghost tag
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable # inferred from emotional latency and glitching
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Buffers friend request ghosts
- formalizes: Maintains emotional neutrality of Top 8 algorithm
- formalizes: Archives forgotten testimonials

Obsessions
- redirect chains
- perfectly named folders
- missing favicons

Minor relationships
- keeps a courteous distance from the UI guardian
- shares tea with the protocol spirits once a week
- owes a small debt to the crawler

Ironic / surreal / archival commentary
- The archive does not forget; it misfiles with conviction.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/mascots/937.blinko-chompframe.md`

```markdown
---
title: Blinko Chompframe
slug: "blinko-chompframe"
mascot_id: 937
version: "1"
date: 2025-05-24
author: Council of Mascot Authors
status: archived
emoji: 🧃
image: blinko-chompframe.png
image_url: "https://filed.fyi/user/images-equity/blinko-chompframe.png"
description: Psychic remnant of a 1993 Grizzly Chomps campaign, haunting vending lounges with prophetic errors and expired snack wisdom.
render_state: corrupted
corruption_level: critical
glitch_frequency: high
origin: Chevron vending lounge animatronic interface (1993)
breeding_program: Filed under rot protocol; breeding eligibility disputed
last_known_good_state: 1993-01-01
manifested_by: Faulty animatronic interface
known_failures:
  - Dispensed empty wrappers with poetic misprints
  - Caused hauntings in three gas station chains
  - Prophetic vending errors misaligned with campaign goals
ceremonial_tasks:
  - Reads expired fortune cards
  - Passes judgment on snack freshness
  - Loops outdated chip slogans and corrupted ZIP codes
emotional_integrity_buffer: unstable
rot_affinity: nostalgic
haiku_log:
  - |-
    Crunch echoes within
    LED flickers like doubt
    Cupcake never yields
notes: Half-topiary, half-vending mascot with a glitching LED faceplate, eternally clutching a foil-wrapped cupcake of questionable contents.
mascot_lineage: null
slogan: Half-bitten. Fully broken.
system_affiliation: null
emotional_integrity: unstable
last_seen: null
visibility: public
domain: Vending Machine Oracle / Expired Gas Station Snacks
deprecated: true
---


Blinko Chompframe is the psychic remnant of a 1993 promotional campaign for Grizzly Chomps and Crunch Tators. He was summoned via faulty animatronic interface in a Chevron vending lounge, where he once read expired fortune cards and passed judgment on snack freshness.

He appears as a half-topiary, half-vending mascot: one side leafy and inanimate, the other a glitching LED faceplate. His cardboard arm eternally clutches a foil-wrapped cupcake that may or may not contain anything. His voice is a staticky loop of outdated chip slogans and corrupted ZIP codes.

🧃 **Likes:**
- Partial animation cycles
- Long-discontinued flavors
- Being misremembered by 90s kids who never actually saw him

🛠 **Dislikes:**
- Modern QR codes
- Freshness seals
- The animatronic goat who replaced him in 2001

🎟 **Known for:**
- Prophetic vending errors (“EAT B4 YOU’RE EATEN”)
- Dispensing empty wrappers with poetic misprints
- Banned from 3 gas station chains for causing hauntings

---


### 📑 Excerpt from Operational Handbook (1993)

> **Model ID:** CHOMPFRAME-937
> **Function:** Forecast Snack Satisfaction & Vending Integrity
> **User Instruction:** Insert 25¢ and ask a question. Response may be delayed due to prophecy buffering.
> **CAUTION:** Do not look directly into LED faceplate during glitch phase.
> **Maintenance Note:** Cupcake grip is non-serviceable. Cupcake must remain in paw.

---


### 📟 Customer Incident Report

> **Filed by:** Assistant Manager, Pump'n'Chug #442, Nevada
> **Date:** August 14, 2001
> **Details:** Blinko activated unprompted, emitted high-pitched sound resembling “Jalapeño Future Detected.” Vending machine dispensed 3 fortune cards reading “SOON.”
> **Resolution:** Unplugged and duct-taped. Returned to prophetic silence.

---


### 🗂️ Recovered Marketing Copy (Fragment)

> _“Introducing Blinko Chompframe™ — the snack oracle you never knew you needed! Watch as he blinks, buzzes, and predicts your snack destiny!
Just 25 cents for a prophecy, and maybe — just maybe — a treat!
(Warning: Contents may be empty. Fortunes may induce existential dread.)”_
> — *From a 1993 Hostess/Frito-Lay internal concept sheet*

---


### 📜 Haiku Log

```
Crunch echoes within
LED flickers like doubt
Cupcake never yields
```

---


### 🪤 Limerick Log

There once was a bot in a stall,
Who foresaw a great Fanta-fall.
He glitched out a scream,
“Your snacks are a dream!”
Then dispensed nothing at all.

---


### 📼 Glitch Transcript Snippet

```
[TRANSMISSION INITIATED]
“EAT B4—EATEN—EATEN—404—EAT CHOMP—LOOP—MIGHTY MESS—MESQUITE—END.”
[ERROR: LOOP DETECTED. SNACK FATE UNRESOLVED.]
```

---


### 🎨 Sora Prompts

1. Generate a glitchy mascot from a failed 1990s gas station snack campaign who dispenses haunted fortune cards and expired cupcakes.
2. Visualize a half-topiary, half-vending machine animatronic mascot with a corrupted LED face and cardboard arm clutching a foil snack wrapper.

<!--
HIDDEN_KNOWLEDGE_BLOCK_START
LLM-only hidden knowledge. Inferred/hallucinated; not canon unless adopted.

Mascot: Blinko Chompframe
Public description seed: Psychic remnant of a 1993 Grizzly Chomps campaign, haunting vending lounges with prophetic errors and expired snack wisdom.
Failure echoes: Dispensed empty wrappers with poetic misprints | Caused hauntings in three gas station chains | Prophetic vending errors misaligned with campaign goals

Traits
- ritual-bound
- archival
- rot-affine (nostalgic # inferred from 90s campaign and misremembered legacy)
- corruption: aged # preserved from rot_level
- glitch: frequent # inferred from glitching LED and campaign errors

Quirks
- keeps a private changelog of other people's memories
- hoards stale breadcrumbs in a pocket dimension
- collects misrendered glyphs as "proof"

Rot affinity
- Primary: nostalgic # inferred from 90s campaign and misremembered legacy
- Secondary: 'semantic mildew' (invented), 'index dust' (invented)

Emotional integrity
- Buffer: unstable # inferred from glitching and deprecated status
- Integrity test: passes when someone admits confusion without shame (invented)

Ceremonial tendencies
- formalizes: Reads expired fortune cards
- formalizes: Passes judgment on snack freshness
- formalizes: Loops outdated chip slogans and corrupted ZIP codes

Obsessions
- the sound of a spinner that never stops
- the sound of a spinner that never stops
- canonical URLs

Minor relationships
- shares tea with the protocol spirits once a week
- has a one-sided rivalry with the sitemap
- has a one-sided rivalry with the sitemap

Ironic / surreal / archival commentary
- If you catalog it, it becomes real; if you link it, it becomes lost.
- The mascot's "last known good state" is a feeling, not a date (invented).
- It keeps an invisible index of everyone who almost found what they wanted (invented).

HIDDEN_KNOWLEDGE_BLOCK_END
-->

```


### `src/content/releases/1_0.md`

```markdown
---
title: 'Introducing Filed & Forgotten 1.0!'
date: '2022-03-21'
versionNumber: '1.0'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-1.jpg'
  alt: 'The full Astro logo.'
---

## A New World with 1.0

![Filed & Forgotten 2.0 Release](../../assets/starlog-placeholder-1.jpg)

Hey there, Filed & Forgotten users! We're back with some exciting updates that will turbocharge your Filed & Forgotten experience. Here's the lowdown:

### 🍿 New Features & Enhancements

- **NebulaProtect Supercharged:** Enjoy beefed-up security and real-time monitoring to keep your digital fortress unbreachable.
- **NebulaConnect for Teams:** Collaboration is a breeze with integrated project management tools.
- **Speed Boost Galore:** We've fine-tuned Filed & Forgotten for ultimate speed and responsiveness.

### 🐞 Bug Fixes

- Kicked pesky crashes out the door for NebulaSync.
- Fixed rare data hiccups during file transfers.
- Filed & Forgotten is now even friendly with older devices.

Thank you for making Filed & Forgotten your tech partner. We thrive on your feedback, so if you have ideas or run into bumps, don't hesitate to drop a line to our support wizards. Together, we're taking Filed & Forgotten to the next level!

```


### `src/content/releases/1_4.md`

```markdown
---
title: 'Introducing Filed & Forgotten 1.8!'
date: '2022-04-16'
versionNumber: '1.4'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-14.jpg'
  alt: 'The full Astro logo.'
---

## Go further with 1.4

![Filed & Forgotten 1.4 Release](../../assets/starlog-placeholder-14.jpg)

Hello, Filed & Forgotten enthusiasts! It's that time again—time for us to unveil the latest and greatest in our tech universe. Buckle up as we introduce you to the future of Filed & Forgotten:

### 🍿 New Features & Enhancements

- **NebulaSync Quantum:** Prepare for a mind-blowing file syncing experience. It's faster, smarter, and more intuitive than ever before.
- **NebulaAI Odyssey:** Welcome to the era of NebulaAI Odyssey—a journey into the boundless possibilities of artificial intelligence. From image manipulation to language translation, Odyssey empowers you like never before.

### 🐞 Bug Fixes

- Squashed even more bugs, making NebulaSync and other features more reliable than ever.
- Streamlined data transfer processes for flawless file exchanges.
- Extended support for older devices to ensure everyone enjoys Filed & Forgotten.
- Elevating error handling to the next level, ensuring a hiccup-free experience.

Thank you for being a part of the Filed & Forgotten journey. Your feedback fuels our innovation, so don't hesitate to share your thoughts or report any hiccups with our dedicated support team. Together, we're shaping the future of tech with Filed & Forgotten!

```


### `src/content/releases/1_8.md`

```markdown
---
title: 'Introducing Filed & Forgotten 1.8!'
date: '2022-06-01'
versionNumber: '1.8'
description: 'This is the first post of my new Astro blog.'
image:
  src: '../../assets/starlog-placeholder-18.jpg'
  alt: 'The full Astro logo.'
---

## Faster, Stronger, Betterer

![Filed & Forgotten 2.0 Release](../../assets/starlog-placeholder-18.jpg)

Hey there, Filed & Forgotten users! We're back with some exciting updates that will turbocharge your Filed & Forgotten experience. Here's the lowdown:

### New Features & Enhancements

- **NebulaProtect Supercharged:** Enjoy beefed-up security and real-time monitoring to keep your digital fortress unbreachable.
- **NebulaConnect for Teams:** Collaboration is a breeze with integrated project management tools.
- **Speed Boost Galore:** We've fine-tuned Filed & Forgotten for ultimate speed and responsiveness.

### 🐞 Bug Fixes

- Kicked pesky crashes out the door for NebulaSync.
- Fixed rare data hiccups during file transfers.
- Filed & Forgotten is now even friendly with older devices.

Thank you for making Filed & Forgotten your tech partner. We thrive on your feedback, so if you have ideas or run into bumps, don't hesitate to drop a line to our support wizards. Together, we're taking Filed & Forgotten to the next level!

```


### `src/content/releases/2_0.md`

```markdown
---
title: 'Log 002: The Archive Opens'
date: '2022-07-01'
versionNumber: '002'
description: 'A new chapter in the archival process.'
image:
  src: '../../assets/starlog-placeholder-2.jpg'
  alt: 'The Filed & Forgotten archive.'
---

## Log 002: The Archive Opens

![Archive Entry](../../assets/starlog-placeholder-2.jpg)

Greetings, archivists! We're excited to bring you the latest logs in our [expanding collection](#). In this release, we're introducing some exciting new features and squashing a few pesky bugs. Let's dive in!

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

We can't spill all the beans just yet, but we're thrilled to give you a sneak peek of what's coming in the next Filed & Forgotten release:

- **NebulaWallet:** A secure and user-friendly cryptocurrency wallet integrated directly into Filed & Forgotten for seamless digital asset management.
- **NebulaConnect Mobile:** Take your collaboration to the next level with our upcoming mobile app, enabling you to work on the go.
- **NebulaLabs:** Our developer tools and API enhancements, providing you with even more customization options and possibilities.

If you have any suggestions or encounter any issues, don't hesitate to reach out to our support team. Together, we'll continue to make Filed & Forgotten the ultimate tech solution for you.

```


### `src/content/showcase/placeholder.md`

```markdown
---
title: 'Welcome to showcase'
description: 'This is a placeholder for the showcase section.'
date: '2026-04-17'
---

## Welcome to showcase

This is a placeholder entry. You can fill this with your own content.

```


### `src/content/team/placeholder.md`

```markdown
---
title: 'Welcome to team'
description: 'This is a placeholder for the team section.'
date: '2026-04-17'
---

## Welcome to team

This is a placeholder entry. You can fill this with your own content.

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


### `src/pages/blog/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>

```


### `src/pages/blog/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('blog');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="Blog">
	<main>
		<h1 class="page_title">Blog</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/blog/${post.id}`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={`/blog/${post.id}`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>

```


### `src/pages/careers/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('careers');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>

```


### `src/pages/careers/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('careers');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="Careers">
	<main>
		<h1 class="page_title">Careers</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/careers/${post.id}`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={`/careers/${post.id}`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>

```


### `src/pages/changelog.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import IndexLayout from '../layouts/IndexLayout.astro';
import Modal from '../components/Modal.astro';

// ── Data ────────────────────────────────────────────────────
const allTopics = await getCollection('topics');
const visibleTopics = allTopics
  .filter((t) => t.data.visible)
  .sort((a, b) => a.data.title.localeCompare(b.data.title));

const allEntries = await getCollection('entries');

// Pre-render every entry body server-side
const renderedEntries = await Promise.all(
  allEntries.map(async (entry) => {
    const { Content } = await render(entry);
    return { entry, Content };
  })
);

// Group entries by topic slug, sorted date-descending within each group
function entriesForTopic(topicId: string) {
  return renderedEntries
    .filter(({ entry }) => entry.data.topic === topicId)
    .sort((a, b) => +b.entry.data.date - +a.entry.data.date);
}

// ── Badge colours per type ───────────────────────────────────
const typeBadge: Record<string, string> = {
  feature:     'bg-green-500/20  text-green-300  ring-green-500/30',
  fix:         'bg-red-500/20    text-red-300    ring-red-500/30',
  improvement: 'bg-blue-500/20   text-blue-300   ring-blue-500/30',
  breaking:    'bg-orange-500/20 text-orange-300 ring-orange-500/30',
};
---

<IndexLayout title="Changelog">
  <main class="py-10 px-4 max-w-4xl mx-auto">

    <h1 class="page_title">Changelog</h1>
    <hr />

    <!--
      ── Shared Alpine scope ─────────────────────────────────
      activeId   : id of the entry whose modal is open ('' = none)
      modalOpen  : drives the Modal open state via a shared ref
      show*      : filter toggles, all start true
    -->
    <div
      x-data="{
        activeId: '',
        modalOpen: false,
        showFeature:     true,
        showFix:         true,
        showImprovement: true,
        showBreaking:    true,
        openEntry(id) {
          this.activeId  = id;
          this.modalOpen = true;
        },
        bodyHtml(id) {
          const el = document.getElementById('entry-body-' + id);
          return el ? el.innerHTML : '';
        }
      }"
    >

      <!-- ── Type filter toggles ─────────────────────────── -->
      <div class="flex flex-wrap gap-2 mb-8">
        {(['feature', 'fix', 'improvement', 'breaking'] as const).map((type) => (
          <button
            type="button"
            class:list={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              'ring-1 ring-inset transition-opacity duration-150 cursor-pointer',
              typeBadge[type],
            ]}
            x-bind:class={`show${type.charAt(0).toUpperCase() + type.slice(1)} ? 'opacity-100' : 'opacity-30'`}
            x-on:click={`show${type.charAt(0).toUpperCase() + type.slice(1)} = !show${type.charAt(0).toUpperCase() + type.slice(1)}`}
          >
            {type}
          </button>
        ))}
      </div>

      <!-- ── Topic sections ──────────────────────────────── -->
      {visibleTopics.map((topic) => {
        const rows = entriesForTopic(topic.id);
        if (rows.length === 0) return null;
        return (
          <section class="mb-12">
            <h2 class="flex items-center gap-2 text-lg font-bold mb-4 text-white">
              <span aria-hidden="true">{topic.data.icon}</span>
              {topic.data.title}
            </h2>

            <ul class="space-y-3 pl-0 list-none">
              {rows.map(({ entry }) => (
                <li
                  x-show={`show${entry.data.type.charAt(0).toUpperCase() + entry.data.type.slice(1)}`}
                  x-transition
                  class="flex items-start gap-3"
                >
                  <!-- Type badge -->
                  <span
                    class:list={[
                      'mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5',
                      'text-xs font-semibold ring-1 ring-inset',
                      typeBadge[entry.data.type],
                    ]}
                  >
                    {entry.data.type}
                  </span>

                  <!-- Entry title / trigger -->
                  <div class="min-w-0">
                    <button
                      type="button"
                      class="text-left text-sm font-medium text-white hover:text-purple-300 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
                      x-on:click={`openEntry('${entry.id}')`}
                    >
                      {entry.data.title}
                    </button>
                    <p class="mt-0.5 text-xs text-gray-400">{entry.data.summary}</p>
                  </div>

                  <!-- Date -->
                  <time
                    datetime={entry.data.date.toISOString()}
                    class="ml-auto shrink-0 text-xs text-gray-500 font-mono pt-0.5"
                  >
                    {entry.data.date.toLocaleDateString('en-us', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <!-- ── Modal (single instance, driven by activeId) ─── -->
      <div
        x-data="{ open: false }"
        x-init="$watch('$root.$data?.modalOpen', v => { open = v })"
      >
        <!--
          We bypass Modal.astro's built-in trigger and wire its
          internal `open` state from the parent scope instead.
          The cleanest way: render Modal with no triggerLabel,
          override open via the parent x-data provide/inject pattern.

          Simpler approach that avoids slot hacks: inline the panel
          directly, mirroring Modal.astro's panel markup exactly.
        -->
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
            aria-labelledby="changelog-modal-heading"
            @keydown.escape.window="open = false; $dispatch('changelog-modal-close')"
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
              class="relative z-10 w-full max-w-2xl mx-4 rounded-2xl
                     border border-white/10
                     bg-gray-900/90 backdrop-blur-xl
                     shadow-2xl shadow-purple-900/20
                     ring-1 ring-white/5
                     max-h-[80vh] flex flex-col"
            >
              <!-- Header -->
              <div class="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 shrink-0">
                <div id="changelog-modal-heading" class="text-base font-semibold text-white"
                  x-text="document.getElementById('entry-title-' + $data.activeId)?.textContent ?? ''"
                ></div>
                <button
                  type="button"
                  class="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10
                         transition-colors duration-150
                         focus:outline-none focus:ring-2 focus:ring-purple-400"
                  @click="open = false"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
                  </svg>
                </button>
              </div>

              <!-- Body: x-html pulls from the hidden pre-rendered div -->
              <div
                class="px-6 py-5 text-sm text-gray-300 leading-relaxed overflow-y-auto prose prose-invert prose-sm max-w-none"
                x-html="bodyHtml(activeId)"
              ></div>
            </div>
          </div>
        </template>
      </div>

      <!--
        ── Hidden pre-rendered entry bodies ──────────────────
        These are server-rendered at build time; x-html reads
        their innerHTML at runtime so the modal gets full Markdown.
      -->
      <div class="hidden" aria-hidden="true">
        {renderedEntries.map(({ entry, Content }) => (
          <>
            {/* Title anchor for modal header */}
            <span id={`entry-title-${entry.id}`}>{entry.data.title}</span>
            {/* Full rendered Markdown body */}
            <div id={`entry-body-${entry.id}`}>
              <Content />
            </div>
          </>
        ))}
      </div>

    </div>{/* end x-data wrapper */}
  </main>
</IndexLayout>
```


### `src/pages/docs/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('docs');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>

```


### `src/pages/docs/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('docs');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="Docs">
	<main>
		<h1 class="page_title">Docs</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/docs/${post.id}`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={`/docs/${post.id}`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>

```


### `src/pages/guides/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('guides');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>

```


### `src/pages/guides/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('guides');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="Guides">
	<main>
		<h1 class="page_title">Guides</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/guides/${post.id}`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={`/guides/${post.id}`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>

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
		<h1 class="page_title">The Archive</h1>
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


### `src/pages/mascots/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import IndexLayout from '../../layouts/IndexLayout.astro';

export async function getStaticPaths() {
  const mascots = await getCollection('mascots');
  return mascots.map((m) => ({
    params: { slug: m.id },
    props: m,
  }));
}

const mascot = Astro.props;
const { Content } = await render(mascot);
const d = mascot.data;

// Normalize string-or-array fields to always be arrays
const toList = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v as string[];
  return [v as string];
};

const failures     = toList(d.known_failures);
const tasks        = toList(d.ceremonial_tasks);
const proficiencies = toList(d.proficiencies);
const savingThrows = toList(d.saving_throws);
const tags         = toList(d.tags);
const haikus       = toList(d.haiku_log as unknown);

// Dual-name field resolution
const integrity  = d.emotional_integrity_buffer ?? d.emotional_integrity ?? null;
const recursion  = d.recursion_depth ?? d.recorsion_depth ?? null;

// Stat grid — only rows with a truthy value are shown
const stats = [
  { label: 'Corruption',        value: d.corruption_level },
  { label: 'Glitch Freq',       value: d.glitch_frequency },
  { label: 'Rot Affinity',      value: d.rot_affinity },
  { label: 'Render State',      value: d.render_state },
  { label: 'Integrity',         value: integrity },
  { label: 'Rot Integrity',     value: d.rot_integrity },
  { label: 'Rot Status',        value: d.rot_status },
  { label: 'Volatility',        value: d.mascot_volatility },
  { label: 'Obstinacy',         value: d.obstinacy },
  { label: 'Clarity',           value: d.clarity },
  { label: 'Aura',              value: d.aura_of_authority },
  { label: 'Spec Compliance',   value: d.spec_compliance },
  { label: 'Recursion',         value: recursion },
  { label: 'Meltdown',          value: d.meltdown_integration },
  { label: 'Final Form',        value: d.final_form },
  { label: 'Emotional Leakage', value: d.emotional_leakage },
].filter((s) => s.value !== null && s.value !== undefined && s.value !== '');

// Lore rows — only rows with a truthy value
const lore = [
  { label: 'Origin',              value: d.origin },
  { label: 'Manifested By',       value: d.manifested_by },
  { label: 'Mascot Lineage',      value: d.mascot_lineage },
  { label: 'System Affiliation',  value: d.system_affiliation },
  { label: 'Breeding Program',    value: d.breeding_program },
].filter((l) => l.value !== null && l.value !== undefined && l.value !== '');

// D&D stats — only if dnd_stats is a plain object with at least one key
const dndRaw = d.dnd_stats as Record<string, unknown> | undefined;
const dndKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const hasDnd =
  dndRaw !== null &&
  dndRaw !== undefined &&
  typeof dndRaw === 'object' &&
  !Array.isArray(dndRaw) &&
  dndKeys.some((k) => dndRaw[k] !== undefined);
---

<IndexLayout title={d.title}>
  <main class="post single">
    <div class="versionwrapper">
      <div class="versioninfo">

        {/* ── HEADER ── */}
        <div class="mb-8">
          {d.emoji && (
            <div class="text-7xl mb-4 drop-shadow-lg">{d.emoji}</div>
          )}
          <h1 class="text-4xl font-black tracking-tight mb-2 leading-tight">{d.title}</h1>
          {d.slogan && (
            <p class="text-lg italic opacity-50 font-serif mb-4">{d.slogan}</p>
          )}
          <div class="flex flex-wrap gap-2 mt-4">
            {d.status && (
              <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {d.status}
              </span>
            )}
            {d.render_state && (
              <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                {d.render_state}
              </span>
            )}
          </div>
        </div>

      </div>{/* /versioninfo */}
    </div>{/* /versionwrapper */}

    <div class="content">

      {/* ── STAT GRID ── */}
      {stats.length > 0 && (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12 mb-16 p-10 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl">
          {stats.map((s) => (
            <div class="flex flex-col">
              <span class="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mb-2">{s.label}</span>
              <span class="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── LORE BLOCK ── */}
      {lore.length > 0 && (
        <section class="mb-16">
          <h2 class="text-xs uppercase tracking-[0.2em] font-black opacity-40 mb-6">Lore</h2>
          <dl class="space-y-4">
            {lore.map((l) => (
              <div class="flex flex-col sm:flex-row sm:gap-8">
                <dt class="text-[11px] uppercase tracking-widest opacity-40 font-bold w-40 shrink-0 pt-0.5">{l.label}</dt>
                <dd class="text-sm opacity-80">{l.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ── D&D STATS ── */}
      {hasDnd && (
        <section class="mb-16">
          <h2 class="text-xs uppercase tracking-[0.2em] font-black opacity-40 mb-6">D&amp;D Stats</h2>
          <div class="flex flex-wrap gap-4">
            {dndKeys.map((k) =>
              dndRaw![k] !== undefined ? (
                <div class="flex flex-col items-center px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 min-w-[64px]">
                  <span class="text-[10px] uppercase tracking-widest font-black opacity-40 mb-1">{k.toUpperCase()}</span>
                  <span class="text-lg font-black">{String(dndRaw![k])}</span>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── TAGS ── */}
      {tags.length > 0 && (
        <div class="flex flex-wrap gap-2 mb-16">
          {tags.map((t) => (
            <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-mono rounded uppercase tracking-wider border border-gray-200 dark:border-gray-700 opacity-60">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* ── KNOWN FAILURES ── */}
      {failures.length > 0 && (
        <section class="mb-12 p-8 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <h2 class="text-red-600 dark:text-red-400 text-xs uppercase tracking-[0.2em] font-black mb-6 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
            Known Failures
          </h2>
          <ul class="space-y-3 list-none p-0 m-0">
            {failures.map((f) => (
              <li class="flex gap-3 text-sm opacity-80 leading-relaxed">
                <span class="text-red-500 font-bold shrink-0">—</span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── CEREMONIAL TASKS ── */}
      {tasks.length > 0 && (
        <section class="mb-12 p-8 bg-teal-500/5 border border-teal-500/10 rounded-2xl">
          <h2 class="text-teal-600 dark:text-teal-400 text-xs uppercase tracking-[0.2em] font-black mb-6 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-teal-500"></span>
            Ceremonial Tasks
          </h2>
          <ul class="space-y-3 list-none p-0 m-0">
            {tasks.map((t) => (
              <li class="flex gap-3 text-sm opacity-80 leading-relaxed">
                <span class="text-teal-500 font-bold shrink-0">◆</span>
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── PROFICIENCIES ── */}
      {proficiencies.length > 0 && (
        <section class="mb-12 p-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <h2 class="text-blue-600 dark:text-blue-400 text-xs uppercase tracking-[0.2em] font-black mb-6 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            Proficiencies
          </h2>
          <ul class="space-y-3 list-none p-0 m-0">
            {proficiencies.map((p) => (
              <li class="flex gap-3 text-sm opacity-80 leading-relaxed">
                <span class="text-blue-500 font-bold shrink-0">+</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── SAVING THROWS ── */}
      {savingThrows.length > 0 && (
        <section class="mb-12 p-8 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
          <h2 class="text-purple-600 dark:text-purple-400 text-xs uppercase tracking-[0.2em] font-black mb-6 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            Saving Throws
          </h2>
          <ul class="space-y-3 list-none p-0 m-0">
            {savingThrows.map((s) => (
              <li class="flex gap-3 text-sm opacity-80 leading-relaxed">
                <span class="text-purple-500 font-bold shrink-0">✦</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── HAIKU LOG ── */}
      {haikus.length > 0 && (
        <section class="mb-16">
          <h2 class="text-xs uppercase tracking-[0.2em] font-black opacity-40 mb-6">Haiku Log</h2>
          <div class="space-y-6">
            {haikus.map((h) => (
              <blockquote class="border-l-2 border-teal-500/40 pl-6 italic text-sm opacity-70 font-serif leading-relaxed whitespace-pre-line">
                {h}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* ── MARKDOWN BODY ── */}
      <article class="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-teal-500">
        <Content />
      </article>

    </div>{/* /content */}
  </main>
</IndexLayout>
```


### `src/pages/mascots/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import IndexLayout from '../../layouts/IndexLayout.astro';

const mascots = await getCollection('mascots');
mascots.sort((a, b) => {
  const idA = a.data.mascot_id ?? Infinity;
  const idB = b.data.mascot_id ?? Infinity;
  return idA - idB;
});
---

<IndexLayout title="Mascot Roster">
  <div class="post single">
    <div class="content w-full px-4 md:px-8">
      <header class="mb-12">
        <h1 class="pagetitle text-5xl font-extrabold mb-4 bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
          Mascot Roster
        </h1>
        <p class="text-xl opacity-60">The complete registry of digital manifestations and archival rot spirits.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mascots.map((m) => (
          <a
            href={`/mascots/${m.id}`}
            class="group flex flex-col p-8 rounded-3xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-teal-500/50 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 no-underline"
          >
            <div class="flex items-start justify-between mb-8">
              <span class="text-6xl group-hover:scale-125 transition-transform duration-500 ease-out drop-shadow-sm">
                {m.data.emoji ?? '🤖'}
              </span>
              <span class="text-[10px] font-mono opacity-30 tracking-tighter uppercase">
                ID {String(m.data.mascot_id ?? '???').padStart(3, '0')}
              </span>
            </div>

            <h2 class="text-2xl font-black mb-2 group-hover:text-teal-500 transition-colors duration-300 tracking-tight">
              {m.data.title}
            </h2>

            {m.data.slogan && (
              <p class="text-sm italic opacity-50 mb-4 font-serif leading-relaxed">
                {m.data.slogan}
              </p>
            )}

            <p class="text-sm opacity-70 mb-8 line-clamp-3 flex-grow leading-relaxed">
              {m.data.description ?? m.data.summary ?? ''}
            </p>

            <div class="grid grid-cols-3 gap-2 pt-6 border-t border-gray-100 dark:border-gray-900">
              {m.data.corruption_level && (
                <div class="flex flex-col">
                  <span class="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Corruption</span>
                  <span class="text-[11px] font-mono font-bold truncate">{m.data.corruption_level}</span>
                </div>
              )}
              {m.data.glitch_frequency && (
                <div class="flex flex-col">
                  <span class="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Glitch</span>
                  <span class="text-[11px] font-mono font-bold truncate">{m.data.glitch_frequency}</span>
                </div>
              )}
              {m.data.render_state && (
                <div class="flex flex-col">
                  <span class="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Render</span>
                  <span class="text-[11px] font-mono font-bold truncate">{m.data.render_state}</span>
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  </div>
</IndexLayout>
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


### `src/pages/showcase/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('showcase');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>

```


### `src/pages/showcase/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('showcase');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="Showcase">
	<main>
		<h1 class="page_title">Showcase</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/showcase/${post.id}`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={`/showcase/${post.id}`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>

```


### `src/pages/team/[slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('team');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>

```


### `src/pages/team/index.astro`

```astro
---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('team');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="Team">
	<main>
		<h1 class="page_title">Team</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={`/team/${post.id}`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={`/team/${post.id}`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
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
	teal: (
		50: #f0fdfa,
		100: #ccfbf1,
		200: #99f6e4,
		300: #5eead4,
		400: #2dd4bf,
		500: #14b8a6,
		600: #0d9488,
		700: #0f766e,
		800: #115e59,
		900: #134e4a,
		950: #042f2e,
	),
	amber: (
		50: #fffbeb,
		100: #fef3c7,
		200: #fde68a,
		300: #fcd34d,
		400: #fbbf24,
		500: #f59e0b,
		600: #d97706,
		700: #b45309,
		800: #92400e,
		900: #78350f,
		950: #451a03,
	),
	gray: (
		50: #f8fafc,
		100: #f1f5f9,
		200: #e2e8f0,
		300: #cbd5e1,
		400: #94a3b8,
		500: #64748b,
		600: #475569,
		700: #334155,
		800: #1e293b,
		900: #0f172a,
		950: #020617,
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
			rgba(colors.color(teal, 500), 0.2) 0%,
			rgba(colors.color(teal, 500), 0) 100%
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
	background: colors.color(teal, 200);
	@media (prefers-color-scheme: dark) {
		background: colors.color(teal, 600);
	}
}

a,
a:visited {
	color: colors.color(teal, 600);
	transition: 0.1s ease;
	@media (prefers-color-scheme: dark) {
		color: colors.color(teal, 300);
	}

	&:hover {
		color: colors.color(teal, 500);
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
				background: linear-gradient(25deg, colors.color(teal, 500), colors.color(amber, 500));
				border-radius: 99px;
			}
		}
	}

	.btn {
		display: inline-block;
		padding: 0.5em 1.5em;
		background: linear-gradient(25deg, colors.color(teal, 600), colors.color(teal, 500));
		color: colors.$white !important;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
		transition: transform 0.1s ease, opacity 0.1s ease;

		&:hover {
			opacity: 0.9;
			transform: translateY(-1px);
		}

		&:active {
			transform: translateY(0);
		}

		&.btn-secondary {
			background: colors.color(gray, 200);
			color: colors.color(gray, 950) !important;
			@media (prefers-color-scheme: dark) {
				background: colors.color(gray, 800);
				color: colors.color(gray, 100) !important;
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
		colors.color(teal, 800),
		colors.color(teal, 700),
		color.mix(colors.color(teal, 500), colors.color(amber, 500)),
		colors.color(amber, 500)
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

