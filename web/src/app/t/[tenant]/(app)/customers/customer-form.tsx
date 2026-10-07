"use client";

import { useActionState } from "react";
import { Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveCustomer, type CustomerState } from "./actions";

export type CustomerRow = { id: string; name: string; rd: string; address: string; phone: string; email: string; note: string };

export function CustomerForm({ tenantId, customer }: { tenantId: string; customer: CustomerRow | null }) {
  const [state, action] = useActionState(saveCustomer.bind(null, tenantId, customer?.id ?? null), {} as CustomerState);
  const v = customer ?? { name: "", rd: "", address: "", phone: "", email: "", note: "" };
  return (
    <form action={action} className="space-y-3">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Нэр"><Input name="name" required defaultValue={v.name} placeholder="ЖИШЭЭ ХХК" /></Field>
        <Field label="Регистрийн №"><Input name="rd" defaultValue={v.rd} /></Field>
        <Field label="Утас"><Input name="phone" defaultValue={v.phone} /></Field>
        <Field label="Имэйл"><Input name="email" type="email" defaultValue={v.email} /></Field>
      </div>
      <Field label="Хаяг"><Input name="address" defaultValue={v.address} /></Field>
      <Field label="Тэмдэглэл"><Input name="note" defaultValue={v.note} /></Field>
      <SubmitButton variant="primary">{customer ? "Хадгалах" : "Нэмэх"}</SubmitButton>
    </form>
  );
}
