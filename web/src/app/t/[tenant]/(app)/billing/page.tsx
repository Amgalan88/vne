import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import { fmtDate, fmtMoney } from "@/lib/format";
import { FREE_FEATURES, isPro, PAYMENT, PRO_FEATURES, PRO_PRICE } from "@/lib/billing";
import { Card } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = { title: "Багц, төлбөр" };

export default async function BillingPage({ params }: PageProps<"/t/[tenant]/billing">) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug);
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
        <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {[
            ["Банк", PAYMENT.bank, false],
            ["Дансны дугаар", PAYMENT.account, true],
            ["Хүлээн авагч", PAYMENT.holder, false],
            ["Дүн", `${fmtMoney(PRO_PRICE)}₮ (1 сар)`, false],
            ["Гүйлгээний утга", reference, true],
          ].map(([k, v, copy]) => (
            <div key={k as string} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-slate-500">{k}</dt>
              <dd className="flex items-center gap-2 text-right font-semibold">
                <span className={copy ? "font-mono" : ""}>{v}</span>
                {copy && <CopyButton value={String(v)} />}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-slate-500">
          Олон сараар төлбөл дүнг сарын тоогоор үржүүлж шилжүүлнэ. Төлбөр орсноос хойш ажлын 1 өдрийн дотор идэвхжинэ.
          Хугацаа дуусаагүй байхад сунгавал үлдсэн хугацаан дээр нэмэгдэнэ.
        </p>
      </Card>
    </div>
  );
}
