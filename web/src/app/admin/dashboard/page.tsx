import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import { Card, EmptyState } from "@/components/ui";
import { adminLogout, decidePayment } from "../actions";

type Row = {
  id: string;
  created_at: string;
  decided_at: string | null;
  status: "pending" | "confirmed" | "rejected";
  months: number;
  amount: number;
  tenant_slug: string;
  tenant_name: string;
  paid_until: string | null;
  requester_email: string | null;
};

const periodLabel = (m: number) => (m === 12 ? "1 жил" : `${m} сар`);
const STATUS = {
  pending: ["Хүлээгдэж байна", "bg-amber-100 text-amber-800"],
  confirmed: ["Баталгаажсан", "bg-emerald-100 text-emerald-800"],
  rejected: ["Татгалзсан", "bg-slate-200 text-slate-600"],
} as const;

export default async function AdminDashboard() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/admin/login");

  const { data } = await supabase.rpc("admin_payments");
  const rows = (data ?? []) as Row[];
  const pending = rows.filter(r => r.status === "pending");
  const done = rows.filter(r => r.status !== "pending");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Төлбөрийн хүсэлтүүд</h1>
          <p className="mt-1 text-sm text-slate-500">
            Банкны хуулгаас гүйлгээний утга (компани.hhk.mn) болон дүнг тулгаж баталгаажуулна.
          </p>
        </div>
        <form action={adminLogout}>
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">Гарах</button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="font-bold">Хүлээгдэж буй ({pending.length})</h2>
        {pending.length === 0 && <EmptyState title="Шинэ хүсэлт алга" />}
        {pending.map(r => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-bold">{r.tenant_name}</p>
                <p className="font-mono text-sm text-slate-500">{r.tenant_slug}.hhk.mn</p>
                <p className="mt-2 text-sm text-slate-500">
                  {r.requester_email} · {fmtDateTime(r.created_at)}
                  {r.paid_until && ` · одоогийн хугацаа ${fmtDate(r.paid_until)} хүртэл`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold">{fmtMoney(r.amount)}₮</p>
                <p className="text-sm text-slate-500">{periodLabel(r.months)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <form action={decidePayment.bind(null, r.id, true)}>
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Баталгаажуулах
                </button>
              </form>
              <form action={decidePayment.bind(null, r.id, false)}>
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100">
                  Татгалзах
                </button>
              </form>
            </div>
          </Card>
        ))}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold">Түүх</h2>
          <Card className="divide-y divide-slate-100">
            {done.map(r => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{r.tenant_name} <span className="font-mono font-normal text-slate-400">{r.tenant_slug}</span></p>
                  <p className="text-slate-500">{fmtMoney(r.amount)}₮ · {periodLabel(r.months)} · {fmtDateTime(r.decided_at ?? r.created_at)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
