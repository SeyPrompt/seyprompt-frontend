import { notFound, permanentRedirect } from 'next/navigation';
import { fetchPublicTaxonomyRecord } from '@/lib/api';
import { taxonomyMetadata } from '@/lib/taxonomy-seo';
import TaxonomyLanding from '@/components/taxonomy-landing';
async function resolve(params) {
  const { categorySlug, subcategorySlug } = await params;
  const record = await fetchPublicTaxonomyRecord('categories', subcategorySlug);
  return record?.parent && (record.parent.slug === categorySlug || record.parent.previousSlugs?.includes(categorySlug)) ? record : null;
}
export async function generateMetadata({ params, searchParams }) { return taxonomyMetadata(await resolve(params), Object.keys(await searchParams || {}).length > 0); }
export default async function SubcategoryPage({ params, searchParams }) {
  const record = await resolve(params); if (!record) notFound();
  const { categorySlug, subcategorySlug } = await params;
  if (record.parent.slug !== categorySlug || record.slug !== subcategorySlug) permanentRedirect(record.path);
  return <TaxonomyLanding record={record} searchParams={await searchParams} />;
}
