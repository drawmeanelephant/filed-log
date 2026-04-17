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
