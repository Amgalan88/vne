import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant";
import type { PublicSiteData } from "@/lib/site";
import { PublicSite } from "@/components/public-site";

async function loadSite(slug: string): Promise<PublicSiteData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_site", { p_slug: slug });
  if (!error) return data as PublicSiteData | null;
  // 003_sites.sql ажиллаагүй үед — компани байгаа бол "удахгүй" хуудас харуулна
  const { data: found } = await supabase.rpc("tenant_by_slug", { p_slug: slug });
  return found?.[0] ? { name: found[0].name, slug, published: false } : null;
}

export async function generateMetadata({ params }: PageProps<"/t/[tenant]">): Promise<Metadata> {
  const site = await loadSite((await params).tenant);
  return site
    ? { title: { absolute: site.name }, description: site.headline || `${site.name} — hhk.mn` }
    : {};
}

/** slug.hhk.mn — гишүүн нэвтэрсэн бол ажлын хэсэг, бусад хүнд компанийн нийтийн хуудас */
export default async function TenantHome({ params, searchParams }: PageProps<"/t/[tenant]">) {
  const { tenant: slug } = await params;
  const ctx = await getTenantContext(slug);
  if (ctx.status === "ok" && (await searchParams).view !== "site") redirect("/documents");

  const site = await loadSite(slug);
  if (!site) notFound();
  return <PublicSite site={site} member={ctx.status === "ok"} />;
}
