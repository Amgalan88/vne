"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { SlugField } from "@/components/slug-field";
import { rootUrl } from "@/lib/hosts";
import { forgotPassword, login, signup, updatePassword, type FormState } from "./actions";

const initial: FormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Имэйл">
        <Input name="email" type="email" required autoComplete="email" defaultValue={state.email} autoFocus />
      </Field>
      <Field label="Нууц үг">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="text-slate-500 underline hover:text-slate-800">
          Нууц үгээ мартсан уу?
        </Link>
      </div>
      <SubmitButton variant="primary" className="w-full py-2.5">Нэвтрэх</SubmitButton>
    </form>
  );
}

/** company=null бол компанийн дэд домэйн дээр (урилгаар нэгдэх) — компанийн талбаргүй */
export function SignupForm({ next, company }: { next: string; company: { slug: string; rootDomain: string } | null }) {
  const [state, action] = useActionState(signup, initial);
  if (state.message)
    return (
      <div className="space-y-3">
        <Notice tone="success">{state.message}</Notice>
        <p className="text-sm text-slate-500">Имэйл ирэхгүй бол Spam хавтсаа шалгаарай.</p>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {company && (
        <>
          <SlugField defaultValue={state.slug ?? company.slug} rootDomain={company.rootDomain} />
          <Field label="Компанийн нэр" hint="Хувь хүн бол өөрийн нэрээ бичнэ">
            <Input name="company_name" required defaultValue={state.companyName} placeholder="ТҮМЭН ХХК" autoFocus={!!company.slug} />
          </Field>
        </>
      )}
      <Field label="Таны овог нэр">
        <Input name="full_name" required autoComplete="name" defaultValue={state.fullName} placeholder="Ю.Амгалан" autoFocus={!company} />
      </Field>
      <Field label="Имэйл">
        <Input name="email" type="email" required autoComplete="email" defaultValue={state.email} />
      </Field>
      <Field label="Нууц үг" hint="Дор хаяж 8 тэмдэгт">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton variant="primary" className="w-full py-2.5">
        {company ? "Үнэгүй эхлэх" : "Бүртгүүлэх"}
      </SubmitButton>
      <p className="text-center text-xs text-slate-500">
        Бүртгүүлснээр{" "}
        <a href={rootUrl("/terms")} target="_blank" className="underline">үйлчилгээний нөхцөл</a>,{" "}
        <a href={rootUrl("/privacy")} target="_blank" className="underline">нууцлалын бодлого</a>-ыг зөвшөөрсөнд тооцно.
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, initial);
  if (state.message) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Бүртгэлтэй имэйл">
        <Input name="email" type="email" required autoComplete="email" defaultValue={state.email} autoFocus />
      </Field>
      <SubmitButton variant="primary" className="w-full py-2.5">Сэргээх холбоос авах</SubmitButton>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(updatePassword, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Шинэ нууц үг" hint="Дор хаяж 8 тэмдэгт">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
      </Field>
      <Field label="Шинэ нууц үг давтах">
        <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton variant="primary" className="w-full py-2.5">Нууц үг хадгалах</SubmitButton>
    </form>
  );
}
