"use client";

import { useActionState } from "react";
import { Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { adminLogin, type CodeState } from "../actions";

export function AdminLoginForm() {
  const [state, action] = useActionState(adminLogin, {} as CodeState);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.step === "code" ? (
        <>
          <input type="hidden" name="email" value={state.email} />
          <Notice tone="success">
            {state.email} хаяг руу нэг удаагийн код илгээлээ. Имэйлээ (Spam хавтсыг ч) шалгана уу.
          </Notice>
          <Field label="Имэйлээр ирсэн код">
            <Input name="token" inputMode="numeric" autoComplete="one-time-code" required autoFocus minLength={6} maxLength={10} className="font-mono tracking-widest" />
          </Field>
          <SubmitButton variant="primary" className="w-full py-2.5">Нэвтрэх</SubmitButton>
        </>
      ) : (
        <>
          <Field label="Имэйл">
            <Input name="email" type="email" required autoComplete="email" autoFocus />
          </Field>
          <SubmitButton variant="primary" className="w-full py-2.5">Код илгээх</SubmitButton>
        </>
      )}
    </form>
  );
}
