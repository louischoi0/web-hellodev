// Emits /sitemap.xml only when site.url is set; a sitemap needs absolute URLs.
import { getCollection } from 'astro:content';
import { site } from '../site';

export function getStaticPaths() {
  return site.url ? [{ params: { sitemap: 'sitemap' } }] : [];
}

export async function GET() {
  const projects = await getCollection('projects', (p) => p.data.caseStudy);
  const paths = ['/', '/about/', '/projects/', ...projects.map((p) => `/projects/${p.id}/`)];
  const urls = paths.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
}
