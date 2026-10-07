import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { canManage } from "@/lib/types";
import { tenantHost, tenantUrl } from "@/lib/hosts";
import { SiteForm, type SiteValues } from "./site-form";

export const metadata: Metadata = { title: "Нийтийн хуудас" };

export default async function SitePage({ params }: PageProps<"/t/[tenant]/site">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!canManage(role)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_sites")
    .select("published, headline, about, services, phone, email, address, facebook, color")
    .eq("tenant_id", tenant.id)
    .maybeSingle<SiteValues>();
  const values: SiteValues = data ?? {
    published: false, headline: "", about: "", services: [], phone: "", email: "", address: "", facebook: "", color: "indigo",
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
      <SiteForm tenantId={tenant.id} values={values} />
    </div>
  );
}
