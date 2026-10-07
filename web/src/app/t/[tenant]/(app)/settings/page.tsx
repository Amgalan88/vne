import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { canManage } from "@/lib/types";
import { isPro } from "@/lib/billing";
import type { Issuer } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import { UpgradeNotice } from "@/components/upgrade-notice";
import { IssuerForm } from "./issuer-form";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function SettingsPage({ params }: PageProps<"/t/[tenant]/settings">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!canManage(role)) notFound();

  const supabase = await createClient();
  const { data: issuers } = await supabase
    .from("issuers")
    .select("id, name, address, rd, phone, email, bank, account, director")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .order("created_at")
    .returns<Issuer[]>();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold">Байгууллагын мэдээлэл</h1>
        <p className="mt-1 text-sm text-slate-500">Энэ мэдээлэл баримтын толгой, нэхэмжлэгчийн хэсэгт гарна.</p>
      </div>
      {issuers?.map(i => <IssuerForm key={i.id} tenantId={tenant.id} issuer={i} />)}

      <div>
        <h2 className="mb-2 font-bold">Өөр ХХК-ийн нэрээр баримт гаргах</h2>
        {isPro(tenant) ? (
          <IssuerForm tenantId={tenant.id} issuer={null} />
        ) : (
          <UpgradeNotice title="Олон ХХК нь төлбөртэй багцад багтана">
            Нэг аккаунтаас хэд хэдэн компанийн нэрээр баримт гаргана.
          </UpgradeNotice>
        )}
      </div>

      <p className="text-sm text-slate-400">Лого, тамга, гарын үсгийн зураг оруулах боломж удахгүй нэмэгдэнэ.</p>
    </div>
  );
}
