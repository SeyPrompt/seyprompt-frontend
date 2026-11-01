import { apiFetch } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';
import { sitemapXml } from '@/lib/sitemap.mjs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const data = await apiFetch('/api/public/sitemap-data', { cache: 'no-store', timeoutMs: 20000 });
    return new Response(sitemapXml(data, SITE_URL), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60' } });
  } catch {
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Retry-After': '60' } });
  }
}
