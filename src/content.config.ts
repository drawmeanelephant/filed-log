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