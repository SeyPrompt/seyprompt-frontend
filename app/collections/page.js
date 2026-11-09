import Link from "next/link";
import { fetchPublicDiscovery } from "@/lib/api";
import { createPageMetadata } from "@/lib/seo";
export const metadata = createPageMetadata({ title: "Prompt Collections", description: "Explore curated prompt collections for your next idea.", path: "/collections" });
export default async function CollectionsPage() {
  const catalog = await fetchPublicDiscovery().catch(() => null);
  return <main className="section"><div className="container stack"><div><h1 className="page-title">A little inspiration, collected.</h1><p className="page-subtitle">Explore prompts brought together around an idea, occasion, or creative goal.</p></div>
    {catalog?.collections?.length ? <div className="discovery-collection-grid">{catalog.collections.map(row => <Link className="discovery-collection-card" href={`/collections/${row.slug}`} key={row.slug}>{row.image && <img src={row.image} alt="" />}<div><h2>{row.name}</h2><p>{row.description || "Explore this prompt collection"}</p><span>Explore collection →</span></div></Link>)}</div> : <div className="panel empty-state"><h2>{catalog ? "Fresh collections are on the way" : "Collections are temporarily unavailable"}</h2><p>You can explore every available prompt in the library.</p><Link className="button-primary" href="/">Explore prompts</Link></div>}
  </div></main>;
}
