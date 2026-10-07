import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { canEdit } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/format";
import { dueDate, overdueDays } from "@/lib/due";
import { Card, EmptyState } from "@/components/ui";
import { markPaid } from "./actions";

export const metadata: Metadata = { title: "Тайлан" };

type Doc = {
  id: string;
  doc_type: "quote" | "invoice" | "dispatch" | "letter";
  number: string;
  doc_date: string;
  customer_name: string;
  total: number;
  status: "draft" | "issued" | "paid" | "cancelled";
  pay_due: string | null;
  cust_email: string | null;
  cust_phone: string | null;
};

const MONTHS = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар", "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];
const ym = (d: string) => d.slice(0, 7);
const label = (m: string) => `${m.slice(0, 4)} оны ${MONTHS[Number(m.slice(5, 7)) - 1]}`;
function shift(m: string, by: number) {
  const d = new Date(`${m}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
}

export default async function ReportsPage({ params, searchParams }: PageProps<"/t/[tenant]/reports">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  const sp = await searchParams;
  const now = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });
  const month = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : ym(now);
  const from6 = `${shift(month, -5)}-01`;
  const toEnd = `${shift(month, 1)}-01`;

  const supabase = await createClient();
  const [{ data: periodDocs }, { data: openDocs }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, number, doc_date, customer_name, total, status, pay_due:data->>payDue")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .gte("doc_date", from6)
      .lt("doc_date", toEnd)
      .limit(5000)
      .returns<Doc[]>(),
    // Хугацаа хэтэрсэн нь сараас үл хамаарна — бүх төлөгдөөгүй нэхэмжлэх
    supabase
      .from("documents")
      .select("id, doc_type, number, doc_date, customer_name, total, status, pay_due:data->>payDue, cust_email:data->>custEmail, cust_phone:data->>custPhone")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .eq("doc_type", "invoice")
      .eq("status", "issued")
      .order("doc_date")
      .limit(1000)
      .returns<Doc[]>(),
  ]);

  const all = periodDocs ?? [];
  const inMonth = all.filter(d => ym(d.doc_date) === month && d.status !== "cancelled");
  const invoices = inMonth.filter(d => d.doc_type === "invoice");
  const sum = (xs: Doc[]) => xs.reduce((s, d) => s + Number(d.total || 0), 0);
  const invoiced = sum(invoices);
  const paid = sum(invoices.filter(d => d.status === "paid"));
  const unpaid = sum(invoices.filter(d => d.status === "issued"));
  const quotes = inMonth.filter(d => d.doc_type === "quote");
  const today = new Date(`${now}T12:00:00Z`);
  const overdue = (openDocs ?? []).map(d => ({ ...d, late: overdueDays(d, today) })).filter(d => d.late > 0).sort((a, b) => b.late - a.late);
  const overdueSum = overdue.reduce((s, d) => s + Number(d.total || 0), 0);

  // Сүүлийн 6 сарын нэхэмжлэл
  const months = Array.from({ length: 6 }, (_, i) => shift(month, i - 5));
  const series = months.map(m => ({ m, v: sum(all.filter(d => d.doc_type === "invoice" && d.status !== "cancelled" && ym(d.doc_date) === m)) }));
  const max = Math.max(1, ...series.map(x => x.v));

  // Харилцагчаар
  const byCustomer = new Map<string, { total: number; count: number }>();
  for (const d of invoices) {
    const k = d.customer_name || "—";
    const cur = byCustomer.get(k) ?? { total: 0, count: 0 };
    byCustomer.set(k, { total: cur.total + Number(d.total || 0), count: cur.count + 1 });
  }
  const topCustomers = [...byCustomer.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);

  const stats = [
    { label: "Нэхэмжилсэн", value: invoiced, sub: `${invoices.length} нэхэмжлэх`, tone: "text-slate-900" },
    { label: "Төлөгдсөн", value: paid, sub: invoiced ? `${Math.round((paid / invoiced) * 100)}%` : "—", tone: "text-emerald-700" },
    { label: "Төлөгдөөгүй", value: unpaid, sub: "энэ сард", tone: "text-amber-700" },
    { label: "Хугацаа хэтэрсэн", value: overdueSum, sub: `${overdue.length} нэхэмжлэх (бүх хугацаанд)`, tone: "text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Тайлан</h1>
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          <Link href={`?m=${shift(month, -1)}`} className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-slate-100" aria-label="Өмнөх сар">←</Link>
          <span className="px-2 text-sm font-bold">{label(month)}</span>
          <Link href={`?m=${shift(month, 1)}`} className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-slate-100" aria-label="Дараах сар">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-extrabold tabular-nums sm:text-2xl ${s.tone}`}>{fmtMoney(s.value)}₮</p>
            <p className="text-xs text-slate-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold">Сүүлийн 6 сарын нэхэмжлэл</h2>
          <div className="mt-5 flex h-44 items-end gap-3">
            {series.map(x => (
              <Link key={x.m} href={`?m=${x.m}`} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold tabular-nums text-slate-500">{x.v ? fmtMoney(Math.round(x.v / 1000)) + "k" : ""}</span>
                <span
                  className={`w-full rounded-t-md ${x.m === month ? "bg-brand" : "bg-indigo-200 group-hover:bg-indigo-300"}`}
                  style={{ height: `${Math.max(3, (x.v / max) * 130)}px` }}
                />
                <span className={`text-[11px] ${x.m === month ? "font-bold" : "text-slate-500"}`}>{Number(x.m.slice(5))}-р</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold">Шилдэг харилцагчид · {label(month)}</h2>
          {topCustomers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Энэ сард нэхэмжлэх алга.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {topCustomers.map(([name, v]) => (
                <li key={name} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="shrink-0 tabular-nums">{fmtMoney(v.total)}₮</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(v.total / (topCustomers[0][1].total || 1)) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-slate-400">Үнийн санал: {quotes.length} ш, {fmtMoney(sum(quotes))}₮</p>
        </Card>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-bold">Хугацаа хэтэрсэн нэхэмжлэх ({overdue.length})</h2>
          <p className="text-sm text-slate-500">«Гаргасан» төлөвтэй, «Төлөх хугацаа» (жишээ нь 14 хоног) өнгөрсөн нэхэмжлэхүүд.</p>
        </div>
        {overdue.length === 0 ? (
          <EmptyState title="Хугацаа хэтэрсэн нэхэмжлэх алга ✓" />
        ) : (
          <Card className="divide-y divide-slate-100">
            {overdue.map(d => {
              const due = dueDate(d.doc_date, d.pay_due);
              const reminder = `Сайн байна уу,\n\n${tenant.name}-аас ${fmtDate(d.doc_date)}-нд илгээсэн №${d.number} нэхэмжлэхийн ${fmtMoney(d.total)}₮-ийн төлбөрийн хугацаа ${due ? fmtDate(due) : ""}-нд дууссан байна. Төлбөрөө шилжүүлнэ үү.\n\nХүндэтгэсэн,\n${tenant.name}`;
              return (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/documents/${d.id}`} className="font-semibold text-indigo-600 hover:underline">№{d.number}</Link>{" "}
                    <span className="font-semibold">{d.customer_name}</span>
                    <p className="text-xs text-slate-500">
                      {fmtMoney(d.total)}₮ · {fmtDate(d.doc_date)} · <b className="text-red-600">{d.late} хоног хэтэрсэн</b>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {d.cust_email && (
                      <a
                        href={`mailto:${d.cust_email}?subject=${encodeURIComponent(`Төлбөрийн сануулга — №${d.number}`)}&body=${encodeURIComponent(reminder)}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                      >
                        ✉ Сануулга
                      </a>
                    )}
                    {d.cust_phone && (
                      <a href={`sms:${d.cust_phone.replace(/\s/g, "")}?body=${encodeURIComponent(reminder)}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                        💬 SMS
                      </a>
                    )}
                    {canEdit(role) && (
                      <form action={markPaid.bind(null, tenant.id, d.id)}>
                        <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">✓ Төлөгдсөн</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
