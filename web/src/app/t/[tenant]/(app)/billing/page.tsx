import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import { FREE_FEATURES, isPro, PLANS, PRO_FEATURES, PRO_PRICE } from "@/lib/billing";
import { Card } from "@/components/ui";
import { PayForm } from "./pay-form";

export const metadata: Metadata = { title: "Багц, төлбөр" };

const STATUS = {
  pending: ["Хүлээгдэж байна", "bg-amber-100 text-amber-800"],
  confirmed: ["Баталгаажсан", "bg-emerald-100 text-emerald-800"],
  rejected: ["Татгалзсан", "bg-slate-200 text-slate-600"],
} as const;

export default async function BillingPage({ params }: PageProps<"/t/[tenant]/billing">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, months, amount, status, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<{ id: string; months: number; amount: number; status: "pending" | "confirmed" | "rejected"; created_at: string }[]>();
  const pro = isPro(tenant);
  // Гүйлгээний утга хөгжүүлэлтийн үед ч жинхэнэ хаягаар
  const reference = `${tenant.slug}.hhk.mn`;
  const expired = tenant.plan === "pro" && !pro;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold">Багц, төлбөр</h1>
        <p className="mt-1 text-sm text-slate-500">
          Одоогийн багц:{" "}
          {pro ? (
            <b className="text-indigo-700">Төлбөртэй · {fmtDate(tenant.paid_until!)} хүртэл</b>
          ) : (
            <b>Үнэгүй{expired && ` (төлбөртэй багцын хугацаа ${fmtDate(tenant.paid_until!)}-нд дууссан)`}</b>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={`p-5 ${!pro ? "ring-2 ring-slate-900" : ""}`}>
          <p className="font-semibold text-slate-500">Үнэгүй</p>
          <p className="mt-1 text-3xl font-extrabold">0₮</p>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            {FREE_FEATURES.map(f => <li key={f}>✓ {f}</li>)}
          </ul>
        </Card>
        <Card className={`p-5 ${pro ? "ring-2 ring-indigo-600" : ""}`}>
          <p className="font-semibold text-indigo-700">Төлбөртэй</p>
          <p className="mt-1 text-3xl font-extrabold">
            {fmtMoney(PRO_PRICE)}₮<span className="text-base font-medium text-slate-400"> / сар</span>
          </p>
          <p className="text-sm text-slate-500">эсвэл 1 жил — {fmtMoney(PLANS[1].price)}₮</p>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            {PRO_FEATURES.map(f => <li key={f}>✓ {f}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-bold">{pro ? "Хугацаа сунгах" : "Төлбөртэй багц идэвхжүүлэх"}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Доорх данс руу шилжүүлээрэй. <b>Гүйлгээний утга</b> дээр компанийнхаа хаягийг заавал бичнэ — ингэж л таны
          төлбөрийг танина.
        </p>
        <PayForm tenantId={tenant.id} reference={reference} canRequest={role === "owner" || role === "admin"} />
        <p className="mt-4 text-sm text-slate-500">
          Шилжүүлсний дараа хүсэлт илгээнэ — төлбөр орсон нь шалгагдмагц ажлын 1 өдрийн дотор идэвхжинэ.
          Хугацаа дуусаагүй байхад сунгавал үлдсэн хугацаан дээр нэмэгдэнэ.
        </p>
      </Card>

      {!!payments?.length && (
        <Card className="p-5">
          <h2 className="font-bold">Миний илгээсэн хүсэлтүүд</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {payments.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  <b>{fmtMoney(p.amount)}₮</b> · {PLANS.find(x => x.months === p.months)?.label ?? `${p.months} сар`}
                  <span className="text-slate-400"> · {fmtDateTime(p.created_at)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
