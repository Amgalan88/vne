"use client";

import { useActionState } from "react";
import { Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { SlugField } from "@/components/slug-field";
import { createTenant, type NewTenantState } from "./actions";

export function NewTenantForm({
  rootDomain,
  defaults,
}: {
  rootDomain: string;
  defaults: { name: string; slug: string; taken: boolean };
}) {
  const [state, action] = useActionState(createTenant, {} as NewTenantState);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {!state.error && defaults.taken && (
        <Notice tone="error">{defaults.slug} хаягийг таныг баталгаажуулах хооронд өөр хүн авчихлаа. Өөр хаяг сонгоно уу.</Notice>
      )}
      <SlugField defaultValue={state.slug ?? (defaults.taken ? "" : defaults.slug)} rootDomain={rootDomain} />
      <Field label="Компанийн нэр">
        <Input name="name" required defaultValue={state.name ?? defaults.name} placeholder="ТҮМЭН ХХК" />
      </Field>
      <SubmitButton variant="primary" className="w-full py-2.5" pendingText="Үүсгэж байна…">
        Компани нээх
      </SubmitButton>
    </form>
  );
}
