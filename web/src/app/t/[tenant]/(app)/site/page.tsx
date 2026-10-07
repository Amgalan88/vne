import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { canManage } from "@/lib/types";
import { tenantHost, tenantUrl } from "@/lib/hosts";
import { coverUrl } from "@/lib/site";
import { SiteForm, type SiteValues } from "./site-form";
import { Inquiries } from "./inquiries";

export const metadata: Metadata = { title: "Нийтийн хуудас" };

export default async function SitePage({ params }: PageProps<"/t/[tenant]/site">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!canManage(role)) notFound();

  const supabase = await createClient();
  // "*" — 008_site_templates.sql ажиллаагүй ч (template, cover_path багана байхгүй) уншина
  const { data } = await supabase.from("tenant_sites").select("*").eq("tenant_id", tenant.id).maybeSingle<Partial<SiteValues> & { cover_path?: string | null; logo_path?: string | null; about_image_path?: string | null }>();
  const values: SiteValues = {
    published: data?.published ?? false,
    headline: data?.headline ?? "",
    about: data?.about ?? "",
    services: data?.services ?? [],
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    address: data?.address ?? "",
    facebook: data?.facebook ?? "",
    color: data?.color ?? "indigo",
    template: data?.template ?? "modern",
    cover: coverUrl(data?.cover_path),
    logo: coverUrl(data?.logo_path),
    aboutImage: coverUrl(data?.about_image_path),
    hours: (data as { hours?: string } | null)?.hours ?? "",
    gallery: (data as { gallery?: string[] } | null)?.gallery ?? [],
    showMap: (data as { show_map?: boolean } | null)?.show_map ?? true,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Компанийн нийтийн хуудас</h1>
          <p className="mt-1 text-sm text-slate-500">
            <b>{tenantHost(tenant.slug)}</b> хаягаар орсон хүмүүст харагдана. Ажилтнууд нэвтэрмэгц ажлын хэсэг рүүгээ орно.
          </p>
        </div>
        <a href={tenantUrl(tenant.slug, "/?view=site")} target="_blank" className="text-sm font-semibold text-indigo-600 hover:underline">
          Хуудсаа харах ↗
        </a>
      </div>
      <Inquiries tenantId={tenant.id} />
      <SiteForm tenantId={tenant.id} values={values} />
    </div>
  );
}
