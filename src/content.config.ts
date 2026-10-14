import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    outcome: z.string(),
    stack: z.array(z.string()),
    year: z.number(),
    order: z.number(),
    caseStudy: z.boolean().default(false),
  }),
});

export const collections = { projects };
