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
