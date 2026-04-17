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

export const collections = { releases, topics, entries, blog, showcase, team, careers, docs, guides };
