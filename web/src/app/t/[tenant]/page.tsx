import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPro } from "@/lib/billing";
import { requireTenant } from "@/lib/tenant";
import { fmtDate, fmtMoney } from "@/lib/format";
import { canEdit, DOC_STATUS_LABEL, DOC_TYPE_LABEL, type DocStatus, type DocType } from "@/lib/types";
import { buttonClass, Card, EmptyState } from "@/components/ui";

type DocRow = {
  id: string;
  doc_type: DocType;
  number: string;
  doc_date: string;
  customer_name: string;
  total: number;
  status: DocStatus;
};

export default async function DocumentsPage({ params }: PageProps<"/t/[tenant]">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);

  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, doc_type, number, doc_date, customer_name, total, status")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .order("doc_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<DocRow[]>();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Баримтууд</h1>
        {canEdit(role) && (
          <button disabled className={buttonClass("dark")} title="Дараагийн алхамд нэмэгдэнэ">
            ＋ Шинэ баримт <span className="text-xs font-normal opacity-70">(удахгүй)</span>
          </button>
        )}
      </div>

      {!isPro(tenant) && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Үнэгүй багц: <b>өдөрт 1 баримт</b>.{" "}
          <Link href="/billing" className="font-semibold text-indigo-600 hover:underline">
            Хязгааргүй болгох →
          </Link>
        </p>
      )}

      {docs?.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Огноо</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3">Дугаар</th>
                <th className="px-4 py-3">Харилцагч</th>
                <th className="px-4 py-3 text-right">Дүн</th>
                <th className="px-4 py-3">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(d.doc_date)}</td>
                  <td className="px-4 py-3">{DOC_TYPE_LABEL[d.doc_type]}</td>
                  <td className="px-4 py-3 font-mono">{d.number}</td>
                  <td className="px-4 py-3">{d.customer_name}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{fmtMoney(d.total)} ₮</td>
                  <td className="px-4 py-3">{DOC_STATUS_LABEL[d.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Одоогоор баримт алга">
          Баримт засварлагч дараагийн алхамд нэмэгдэнэ. Хуучин аппынхаа түүхийг ч импортлох боломжтой болно.
        </EmptyState>
      )}
    </>
  );
}
