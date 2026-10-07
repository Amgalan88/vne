import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { isPro } from "@/lib/billing";
import { canEdit, canManage, DOC_TYPE_LABEL, type DocStatus, type DocType } from "@/lib/types";
import { buttonClass, Card } from "@/components/ui";
import { DocList } from "./doc-list";
import { DocIconTile } from "@/components/doc-icon";

export const metadata: Metadata = { title: "Баримтууд" };

type DocRow = {
  id: string;
  doc_type: DocType;
  number: string;
  doc_date: string;
  customer_name: string;
  total: number;
  status: DocStatus;
  pay_due: string | null;
};

export default async function DocumentsPage({ params }: PageProps<"/t/[tenant]/documents">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);

  const supabase = await createClient();
  const [{ data: docs }, { data: issuer }, { data: site }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, number, doc_date, customer_name, total, status, pay_due:data->>payDue")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .order("doc_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<DocRow[]>(),
    supabase.from("issuers").select("rd, bank, account").eq("tenant_id", tenant.id).is("deleted_at", null).order("created_at").limit(1).maybeSingle(),
    supabase.from("tenant_sites").select("published").eq("tenant_id", tenant.id).maybeSingle(),
  ]);

  const editable = canEdit(role);
  const steps = [
    { done: !!(issuer?.rd && (issuer.bank || issuer.account)), label: "Байгууллагын мэдээллээ бөглөх (РД, банк, данс)", href: "/settings", manage: true },
    { done: !!docs?.length, label: "Анхны баримтаа гаргах", href: "/documents/new", manage: false },
    { done: !!site?.published, label: "Компанийн нийтийн хуудсаа нийтлэх", href: "/site", manage: true },
  ].filter(st => !st.manage || canManage(role));
  const showSteps = steps.some(st => !st.done);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Баримтууд</h1>
        {editable && (
          <Link href="/documents/new" className={buttonClass("primary")}>
            ＋ Шинэ баримт
          </Link>
        )}
      </div>

      {showSteps && (
        <Card className="mb-4 p-5">
          <p className="font-bold">Эхлэх алхмууд</p>
          <ol className="mt-3 space-y-2">
            {steps.map((st, i) => (
              <li key={st.href} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    st.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {st.done ? "✓" : i + 1}
                </span>
                {st.done ? (
                  <span className="text-slate-400 line-through">{st.label}</span>
                ) : (
                  <Link href={st.href} className="font-semibold text-indigo-600 hover:underline">
                    {st.label} →
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {editable && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(DOC_TYPE_LABEL) as DocType[]).map(t => (
            <Link
              key={t}
              href={`/documents/new?type=${t}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <DocIconTile className="transition group-hover:scale-105" />
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">{DOC_TYPE_LABEL[t]}</span>
                <span className="block text-xs text-slate-500">＋ Шинээр үүсгэх</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {!isPro(tenant) && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Үнэгүй багц: <b>өдөрт 1 баримт</b>.{" "}
          <Link href="/billing" className="font-semibold text-indigo-600 hover:underline">
            Хязгааргүй болгох →
          </Link>
        </p>
      )}

      {docs?.length ? (
        <DocList docs={docs} editable={editable} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="font-semibold">Одоогоор баримт алга</p>
          {editable && <p className="mt-2 text-sm text-slate-500">Дээрх товчнуудаас төрлөө сонгоод анхны баримтаа гаргаарай.</p>}
        </div>
      )}
    </>
  );
}
