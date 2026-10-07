"use client";

import { useActionState, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PAYMENT, PLANS } from "@/lib/billing";
import { fmtMoney } from "@/lib/format";
import { requestPayment, type PayState } from "./actions";

export function PayForm({ tenantId, reference, canRequest }: { tenantId: string; reference: string; canRequest: boolean }) {
  const [months, setMonths] = useState<number>(PLANS[0].months);
  const [state, action] = useActionState(requestPayment.bind(null, tenantId), {} as PayState);
  const plan = PLANS.find(p => p.months === months)!;

  const rows: [string, string, boolean][] = [
    ["Банк", PAYMENT.bank, false],
    ["Дансны дугаар", PAYMENT.account, true],
    ["Хүлээн авагч", PAYMENT.holder, false],
    ["Дүн", `${fmtMoney(plan.price)}₮ (${plan.label})`, false],
    ["Гүйлгээний утга", reference, true],
  ];

  return (
    <form action={action} className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {PLANS.map(p => (
          <label
            key={p.months}
            className={`cursor-pointer rounded-xl border p-4 transition ${months === p.months ? "border-indigo-600 ring-2 ring-indigo-600" : "border-slate-200 hover:border-slate-300"}`}
          >
            <input type="radio" name="months" value={p.months} checked={months === p.months} onChange={() => setMonths(p.months)} className="sr-only" />
            <span className="block font-semibold">{p.label}</span>
            <span className="block text-2xl font-extrabold">{fmtMoney(p.price)}₮</span>
            {p.months === 12 && <span className="text-xs font-semibold text-emerald-700">{fmtMoney(PLANS[0].price * 12 - p.price)}₮ хэмнэнэ</span>}
          </label>
        ))}
      </div>

      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map(([k, v, copy]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
            <dt className="text-sm text-slate-500">{k}</dt>
            <dd className="flex items-center gap-2 text-right font-semibold">
              <span className={copy ? "font-mono" : ""}>{v}</span>
              {copy && <CopyButton value={v} />}
            </dd>
          </div>
        ))}
      </dl>

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.sent && <Notice tone="success">Хүсэлт илгээгдлээ. Төлбөр баталгаажмагц багц идэвхжинэ (ажлын 1 өдрийн дотор).</Notice>}
      {canRequest ? (
        <SubmitButton variant="primary" pendingText="Илгээж байна…">Төлбөр шилжүүллээ — хүсэлт илгээх</SubmitButton>
      ) : (
        <p className="text-sm text-slate-500">Хүсэлтийг зөвхөн компанийн эзэмшигч, админ илгээнэ.</p>
      )}
    </form>
  );
}
