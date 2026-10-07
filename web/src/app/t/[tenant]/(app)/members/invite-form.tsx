"use client";

import { useActionState, useRef } from "react";
import { CopyButton } from "@/components/copy-button";
import { Input, Notice, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { inviteMember, type InviteState } from "./actions";

const randomPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, b => chars[b % chars.length]).join("");
};

export function InviteForm({ tenantId, canInviteAdmin }: { tenantId: string; canInviteAdmin: boolean }) {
  const [state, action] = useActionState(inviteMember.bind(null, tenantId), {} as InviteState);
  const pw = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="space-y-3">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      {state.credentials && (
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
          {[
            ["Нэвтрэх хаяг", state.credentials.url],
            ["Имэйл", state.credentials.email],
            ["Түр нууц үг", state.credentials.password],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="text-slate-500">{k}</dt>
              <dd className="flex min-w-0 items-center gap-2 font-mono font-semibold">
                <span className="truncate">{v}</span>
                <CopyButton value={v} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {state.credentials && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {state.credentials.emailed ? (
            <span className="font-semibold text-emerald-700">✓ {state.credentials.email} хаяг руу имэйлээр илгээгдлээ</span>
          ) : (
            <a
              className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-700"
              href={`mailto:${state.credentials.email}?subject=${encodeURIComponent(`${state.credentials.companyName} — таныг урилаа`)}&body=${encodeURIComponent(
                `Таныг ${state.credentials.companyName} компанид урилаа.\n\nНэвтрэх: ${state.credentials.url}\nИмэйл: ${state.credentials.email}\nТүр нууц үг: ${state.credentials.password}\n\nАнх нэвтрэхэд өөрийн шинэ нууц үгээ тохируулна.`,
              )}`}
            >
              ✉ Имэйлээр илгээх
            </a>
          )}
          {!state.credentials.emailed && <span className="text-xs text-slate-500">Таны имэйл програм нээгдэж, бэлэн текстээр гарна.</span>}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" required placeholder="ajiltan@gmail.com" className="flex-1" />
        <Select name="role" defaultValue="staff" className="sm:w-40">
          <option value="staff">Ажилтан</option>
          <option value="viewer">Харагч</option>
          {canInviteAdmin && <option value="admin">Админ</option>}
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input ref={pw} id="invite-password" name="password" type="text" minLength={8} autoComplete="off" placeholder="Түр нууц үг (заавал биш, 8+ тэмдэгт)" className="flex-1 font-mono" />
        <button type="button" onClick={() => pw.current && (pw.current.value = randomPassword())} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
          Санамсаргүй үүсгэх
        </button>
        <SubmitButton pendingText="…">Урих</SubmitButton>
      </div>
      <p className="text-xs text-slate-500">
        Түр нууц үг өгвөл ажилтан тэр даруй нэвтэрч чадна, анх нэвтрэхдээ өөрийн нууц үгээ шинээр тохируулна. Өгөхгүй бол ажилтан өөрөө бүртгүүлнэ.
      </p>
    </form>
  );
}
