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
