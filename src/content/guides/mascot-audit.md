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