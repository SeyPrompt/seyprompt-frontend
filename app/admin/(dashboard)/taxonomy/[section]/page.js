import { notFound } from "next/navigation";
import { requireAdminToken } from "@/lib/auth";
import AdminTaxonomyManager from "@/components/admin-taxonomy-manager";
export const metadata = { title: "Admin Taxonomy", robots: { index: false, follow: false } };
export default async function TaxonomyPage({ params }) {
  await requireAdminToken();
  const { section } = await params;
  if (!["categories", "subcategories", "tags", "collections", "migration", "bulk"].includes(section)) notFound();
  return <AdminTaxonomyManager section={section} />;
}
