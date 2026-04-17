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
