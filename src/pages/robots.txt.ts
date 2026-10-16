import { site } from '../site';

export function GET() {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site.url) lines.push('', `Sitemap: ${site.url}/sitemap.xml`);
  return new Response(lines.join('\n') + '\n');
}
