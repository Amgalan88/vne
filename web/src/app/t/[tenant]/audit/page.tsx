import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { fmtDateTime } from "@/lib/format";
import { canManage } from "@/lib/types";
import { describe, type AuditEntry } from "@/lib/audit";
import { Card, EmptyState } from "@/components/ui";
import { isPro } from "@/lib/billing";
import { UpgradeNotice } from "@/components/upgrade-notice";

export const metadata: Metadata = { title: "Аудит лог" };

const PAGE = 50;

export default async function AuditPage({ params, searchParams }: PageProps<"/t/[tenant]/audit">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!canManage(role)) notFound();
  if (!isPro(tenant)) {
    return (
      <>
        <h1 className="mb-4 text-lg font-bold">Аудит лог</h1>
        <UpgradeNotice title="Аудит лог нь төлбөртэй багцад багтана">
          Таны компанийн бүх үйлдэл одоо ч бүртгэгдэж байгаа. Төлбөртэй багц идэвхжмэгц хэн, хэзээ, юу хийснийг
          эхнээс нь харна.
        </UpgradeNotice>
      </>
    );
  }
  const before = Number((await searchParams).before) || null;

  const supabase = await createClient();
  let q = supabase
    .from("audit_log")
    .select("id, user_id, user_email, action, entity, entity_id, before, after, at")
    .eq("tenant_id", tenant.id)
    .order("id", { ascending: false })
    .limit(PAGE);
  if (before) q = q.lt("id", before);
  const { data: entries } = await q.returns<AuditEntry[]>();

  const userIds = [...new Set((entries ?? []).map(e => e.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds).returns<{ id: string; full_name: string }[]>()
    : { data: [] };
  const names = new Map((profiles ?? []).map(p => [p.id, p.full_name]));

  return (
    <>
      <h1 className="mb-1 text-lg font-bold">Аудит лог</h1>
      <p className="mb-4 text-sm text-slate-500">Хэн, хэзээ, юу хийснийг бүгдийг энд харна. Энэ түүхийг хэн ч засах, устгах боломжгүй.</p>
      {entries?.length ? (
        <Card className="divide-y divide-slate-100 dark:divide-slate-700">
          {entries.map(e => {
            const d = describe(e);
            const who = (e.user_id && names.get(e.user_id)) || e.user_email || "Систем";
            return (
              <div key={e.id} className="flex gap-4 px-4 py-3 text-sm">
                <time className="w-32 shrink-0 font-mono text-xs text-slate-400">{fmtDateTime(e.at)}</time>
                <div className="min-w-0">
                  <p>
                    <b>{who}</b> — {d.text}
                  </p>
                  {d.changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                      {d.changes.map(c => (
                        <li key={c}>• {c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyState title="Одоогоор бичлэг алга" />
      )}
      {entries?.length === PAGE && (
        <div className="mt-4 text-center">
          <Link href={`/audit?before=${entries[entries.length - 1].id}`} className="text-sm font-semibold underline">
            Цааш үзэх →
          </Link>
        </div>
      )}
    </>
  );
}
