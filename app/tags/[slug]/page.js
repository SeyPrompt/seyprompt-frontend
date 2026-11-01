import { notFound, permanentRedirect } from 'next/navigation';
import { fetchPublicTaxonomyRecord } from '@/lib/api';
import { taxonomyMetadata } from '@/lib/taxonomy-seo';
import TaxonomyLanding from '@/components/taxonomy-landing';
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  return taxonomyMetadata(await fetchPublicTaxonomyRecord('tags', slug), Object.keys(await searchParams || {}).length > 0);
}
export default async function TaxonomyPage({ params, searchParams }) {
  const { slug } = await params;
  const record = await fetchPublicTaxonomyRecord('tags', slug); if (!record) notFound();
  if (record.slug !== slug) permanentRedirect(record.path);
  return <TaxonomyLanding record={record} searchParams={await searchParams} />;
}
