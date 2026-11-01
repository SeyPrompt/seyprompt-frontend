import { permanentRedirect } from 'next/navigation';
import { fetchPublicTaxonomyRecord } from '@/lib/api';
import { taxonomyMetadata } from '@/lib/taxonomy-seo';
import TaxonomyLanding from '@/components/taxonomy-landing';
import LegacyCategoryPage from '@/components/legacy-category-page';
const aliases = { design: 'design-creativity', marketing: 'business-marketing', business: 'business-marketing', coding: 'coding-technology', education: 'education-learning', career: 'career-productivity', productivity: 'career-productivity', resume: 'resume-cover-letters', 'social-media': 'social-media-marketing', lifestyle: 'personal-lifestyle', travel: 'personal-lifestyle' };
async function resolve(slug) {
  return await fetchPublicTaxonomyRecord('categories', slug) || (aliases[slug] ? await fetchPublicTaxonomyRecord('categories', aliases[slug]) : null);
}
export async function generateMetadata({ params, searchParams }) {
  const { categorySlug } = await params;
  const record = await resolve(categorySlug);
  return record ? taxonomyMetadata(record, Object.keys(await searchParams || {}).length > 0) : { title: 'Prompt Category', robots: { index: false, follow: true } };
}
export default async function CategoryPage({ params, searchParams }) {
  const { categorySlug } = await params;
  const record = await resolve(categorySlug);
  if (!record) return <LegacyCategoryPage params={Promise.resolve({ categorySlug })} searchParams={searchParams} />;
  if (record.path !== `/categories/${categorySlug}`) permanentRedirect(record.path);
  return <TaxonomyLanding record={record} searchParams={await searchParams} />;
}
