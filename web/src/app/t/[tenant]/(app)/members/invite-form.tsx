"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Input, Notice, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { inviteMember, type InviteState } from "./actions";

export function InviteForm({ tenantId, canInviteAdmin }: { tenantId: string; canInviteAdmin: boolean }) {
  const [state, action] = useActionState(inviteMember.bind(null, tenantId), {} as InviteState);
  const c = state.credentials;
  return (
    <form action={action} className="space-y-3">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      {c && (
        <div className="space-y-2 rounded-xl border border-slate-200 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.isLink ? "Урилгын холбоос (24 цаг хүчинтэй)" : "Нэвтрэх хаяг"}</p>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{c.url}</span>
            <CopyButton value={c.url} />
          </div>
          {c.emailed ? (
            <p className="font-semibold text-emerald-700">✓ {c.email} хаяг руу имэйлээр илгээгдлээ</p>
          ) : (
            <a
              className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-700"
              href={`mailto:${c.email}?subject=${encodeURIComponent(`${c.companyName} — таныг урилаа`)}&body=${encodeURIComponent(
                c.isLink
                  ? `Таныг ${c.companyName} компанид урилаа.\n\nДоорх холбоос дээр дарж урилгаа хүлээн авч, өөрийн нууц үгээ тохируулна уу (24 цаг хүчинтэй):\n${c.url}`
                  : `Таныг ${c.companyName} компанид урилаа.\n\nЭнэ имэйлээрээ нэвтэрч эсвэл бүртгүүлж орно уу:\n${c.url}`,
              )}`}
            >
              ✉ Имэйлээр илгээх
            </a>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" required placeholder="ajiltan@gmail.com" className="flex-1" />
        <Select name="role" defaultValue="staff" className="sm:w-40">
          <option value="staff">Ажилтан</option>
          <option value="viewer">Харагч</option>
          {canInviteAdmin && <option value="admin">Админ</option>}
        </Select>
        <SubmitButton pendingText="…">Урих</SubmitButton>
      </div>
      <p className="text-xs text-slate-500">
        Ажилтан урилгын холбоос дээр дармагц имэйл нь баталгаажиж, өөрийн нууц үгээ тохируулна. Таны мэдэх нууц үг шаардлагагүй.
      </p>
    </form>
  );
}
