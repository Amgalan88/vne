"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card, Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { Issuer } from "@/lib/documents";
import { saveIssuer, type IssuerState } from "./actions";

export function IssuerForm({ tenantId, issuer }: { tenantId: string; issuer: Issuer | null }) {
  const [state, action] = useActionState(saveIssuer.bind(null, tenantId, issuer?.id ?? null), {} as IssuerState);
  const v = issuer ?? { name: "", address: "", rd: "", phone: "", email: "", bank: "", account: "", director: "" };
  return (
    <Card className="p-5">
      <form action={action} className="space-y-3">
        {state.error && (
          <Notice tone="error">
            {state.error}{" "}
            {state.upgrade && <Link href="/billing" className="font-semibold underline">Төлбөртэй багц →</Link>}
          </Notice>
        )}
        {state.message && <Notice tone="success">{state.message}</Notice>}
        <Field label="Байгууллагын нэр">
          <Input name="name" required defaultValue={v.name} placeholder="ЖИШЭЭ ХХК" />
        </Field>
        <Field label="Хаяг">
          <textarea
            name="address"
            defaultValue={v.address}
            className="min-h-16 w-full rounded-lg border-[1.5px] border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Регистрийн №"><Input name="rd" defaultValue={v.rd} /></Field>
          <Field label="Утас"><Input name="phone" defaultValue={v.phone} /></Field>
          <Field label="Имэйл"><Input name="email" type="email" defaultValue={v.email} /></Field>
          <Field label="Банк"><Input name="bank" defaultValue={v.bank} placeholder="Хаан банк" /></Field>
          <Field label="Дансны дугаар"><Input name="account" defaultValue={v.account} /></Field>
          <Field label="Захирлын нэр"><Input name="director" defaultValue={v.director} placeholder="Б.Болд" /></Field>
        </div>
        <SubmitButton variant="primary">{issuer ? "Хадгалах" : "Нэмэх"}</SubmitButton>
      </form>
    </Card>
  );
}
