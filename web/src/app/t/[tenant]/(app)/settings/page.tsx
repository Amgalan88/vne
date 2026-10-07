import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { canManage } from "@/lib/types";
import { isPro } from "@/lib/billing";
import type { Issuer } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import { UpgradeNotice } from "@/components/upgrade-notice";
import { loadIssuerAssets } from "@/lib/assets";
import { IssuerForm } from "./issuer-form";
import { StampPanel, type StampInfo } from "./stamp-panel";
import { LegacyImport } from "./legacy-import";

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

  const [assets, { data: files }] = await Promise.all([
    loadIssuerAssets(supabase, tenant.id),
    supabase
      .from("issuers")
      .select("id, logo_path, stamp_path, signature_path, stamp_mode, sig_mode")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .returns<{ id: string; logo_path: string | null; stamp_path: string | null; signature_path: string | null; stamp_mode: "on" | "pin" | "off"; sig_mode: "on" | "pin" | "off" }[]>(),
  ]);
  const infos = new Map<string, StampInfo>();
  await Promise.all(
    (files ?? []).map(async f => {
      const { data: st } = await supabase.rpc("stamp_status", { p_issuer: f.id });
      const a = assets[f.id];
      infos.set(f.id, {
        hasPin: !!st?.has_pin,
        unlocked: !st?.has_pin || !!st?.unlocked_until,
        lockedUntil: st?.locked_until ?? null,
        stampMode: f.stamp_mode,
        sigMode: f.sig_mode,
        // PIN-ээр нээсэн үед л харуулах горимд, нээсэн эзэмшигч тохиргоон дээр харна
        urls: { logo: a?.logo ?? null, stamp: a?.stamp ?? null, signature: a?.signature ?? null },
        has: { logo: !!f.logo_path, stamp: !!f.stamp_path, signature: !!f.signature_path },
      });
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold">Байгууллагын мэдээлэл</h1>
        <p className="mt-1 text-sm text-slate-500">Энэ мэдээлэл баримтын толгой, нэхэмжлэгчийн хэсэгт гарна.</p>
      </div>
      {issuers?.map(i => (
        <div key={i.id} className="space-y-4">
          <IssuerForm tenantId={tenant.id} issuer={i} />
          {infos.get(i.id) && (
            <StampPanel tenantId={tenant.id} issuerId={i.id} name={i.name} info={infos.get(i.id)!} isOwner={role === "owner"} isPro={isPro(tenant)} />
          )}
        </div>
      ))}

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

      {!!issuers?.length && <LegacyImport tenantId={tenant.id} issuers={issuers.map(i => ({ id: i.id, name: i.name }))} />}

    </div>
  );
}
