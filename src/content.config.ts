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

const entries = defineCollection({
	// Load Markdown files in the src/content/entries directory.
	loader: glob({ base: './src/content/entries', pattern: '**/*.md' }),
	schema: z.object({
		/** Slug of the parent topic (must match a filename in src/content/topics/) */
		topic: z.string(),
		/** Publication date — accepts any string/number that Date can parse */
		date: z.coerce.date(),
		/** Category of change */
		type: z.enum(['feature', 'fix', 'improvement', 'breaking']),
		/** Short headline shown in listings */
		title: z.string(),
		/** One-liner teaser displayed in cards / feeds */
		summary: z.string(),
	}),
});

const genericSchema = z.object({
	title: z.string(),
	description: z.string(),
	date: z.coerce.date(),
});

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	schema: genericSchema,
});
const showcase = defineCollection({
	loader: glob({ base: './src/content/showcase', pattern: '**/*.md' }),
	schema: genericSchema,
});
const team = defineCollection({
	loader: glob({ base: './src/content/team', pattern: '**/*.md' }),
	schema: genericSchema,
});
const careers = defineCollection({
	loader: glob({ base: './src/content/careers', pattern: '**/*.md' }),
	schema: genericSchema,
});
const docs = defineCollection({
	loader: glob({ base: './src/content/docs', pattern: '**/*.md' }),
	schema: genericSchema,
});
const guides = defineCollection({
	loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
	schema: genericSchema,
});

const mascots = defineCollection({
  loader: glob({ base: './src/content/mascots', pattern: '**/*.md' }),
  schema: z.object({

    // === IDENTITY ===
    mascot_id:    z.number().nullable().optional(),
    name:         z.string().optional(),
    title:        z.string(),
    slug:         z.string().optional(),
    emoji:        z.string().optional(),
    emoji_url:    z.string().optional(),
    subtitle:     z.string().optional(),
    description:  z.string().optional(),
    summary:      z.string().optional(),
    slogan:       z.string().optional(),
    background:   z.string().optional(),
    domain:       z.string().optional(),
    class:        z.string().optional(),
    subclass:     z.string().optional(),
    rank:         z.string().optional(),
    alignment:    z.string().optional(),

    // === DATES / STATUS ===
    date:                  z.coerce.date().optional(),
    updated:               z.coerce.date().optional(),
    updated_at:            z.coerce.date().optional(),
    first_seen:            z.coerce.date().optional(),
    last_seen:             z.coerce.date().optional(),
    last_functional:       z.string().nullable().optional(),
    last_known_good_state: z.string().nullable().optional(),
    status:                z.string().optional(),
    deprecated:            z.boolean().optional(),
    visibility:            z.string().optional(),

    // === STAT BLOCK (the baseball card) ===
    corruption_level:           z.string().nullable().optional(),
    glitch_frequency:           z.string().nullable().optional(),
    emotional_integrity:        z.string().nullable().optional(),
    emotional_integrity_buffer: z.string().nullable().optional(),
    emotional_leakage:          z.string().nullable().optional(),
    rot_affinity:               z.string().nullable().optional(),
    rot_integrity:              z.string().nullable().optional(),
    rot_status:                 z.string().nullable().optional(),
    render_state:               z.string().nullable().optional(),
    mascot_volatility:          z.string().nullable().optional(),
    meltdown_integration:       z.string().nullable().optional(),
    obstinacy:                  z.string().nullable().optional(),
    clarity:                    z.string().nullable().optional(),
    aura_of_authority:          z.string().nullable().optional(),
    spec_compliance:            z.string().nullable().optional(),
    recursion_depth:            z.string().nullable().optional(),
    final_form:                 z.string().nullable().optional(),

    // === LORE / LINEAGE ===
    origin:             z.string().nullable().optional(),
    manifested_by:      z.string().nullable().optional(),
    mascot_lineage:     z.string().nullable().optional(),
    system_affiliation: z.string().nullable().optional(),
    breeding_program:   z.string().nullable().optional(),
    known_failures:     z.union([z.string(), z.array(z.string())]).nullable().optional(),
    known_vulnerabilities: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    vulnerabilities:    z.union([z.string(), z.array(z.string())]).nullable().optional(),
    ceremonial_tasks:   z.union([z.string(), z.array(z.string())]).nullable().optional(),
    proficiencies:      z.union([z.string(), z.array(z.string())]).nullable().optional(),
    saving_throws:      z.union([z.string(), z.array(z.string())]).nullable().optional(),
    dnd_stats:          z.record(z.unknown()).optional(),

    // === META / AUTHORING ===
    author:         z.string().optional(),
    compiled_by:    z.string().optional(),
    reviewed_by:    z.string().optional(),
    version:        z.string().optional(),
    template:       z.string().optional(),
    rotkeeper:      z.string().optional(),
    type:           z.string().optional(),
    tags:           z.union([z.array(z.string()), z.string()]).optional(),
    taxonomy:       z.record(z.unknown()).optional(),
    categories:     z.union([z.array(z.string()), z.string()]).optional(),
    notes:          z.string().nullable().optional(),
    addendum_comments: z.unknown().optional(),

    // === ASSETS / MEDIA ===
    image:     z.string().optional(),
    image_url: z.string().optional(),
    source_url: z.string().optional(),

    // === SORA / AI GENERATION (strip later) ===
    sora_prompt:         z.unknown().optional(),
    sora_prompt_enabled: z.boolean().optional(),
    sora_config:         z.unknown().optional(),
    visualizations:      z.unknown().optional(),

    // === MISC JUNK (accept, ignore) ===
    haiku_log:                  z.unknown().optional(),
    asset_meta:                 z.unknown().optional(),
    spec_reference:             z.string().optional(),
    system_log_reference:       z.string().optional(),
    templating_behavior_notes:  z.string().optional(),
    yaml_behavior_notes:        z.string().optional(),
    __file:                     z.string().optional(),
  }),
});

export const collections = { releases, topics, entries, blog, showcase, team, careers, docs, guides, mascots };
