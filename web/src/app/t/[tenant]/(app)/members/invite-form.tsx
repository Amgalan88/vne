"use client";

import { useActionState } from "react";
import { Input, Notice, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { inviteMember, type InviteState } from "./actions";

export function InviteForm({ tenantId, canInviteAdmin }: { tenantId: string; canInviteAdmin: boolean }) {
  const [state, action] = useActionState(inviteMember.bind(null, tenantId), {} as InviteState);
  return (
    <form action={action} className="space-y-3">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" required placeholder="ajiltan@gmail.com" className="flex-1" />
        <Select name="role" defaultValue="staff" className="sm:w-40">
          <option value="staff">Ажилтан</option>
          <option value="viewer">Харагч</option>
          {canInviteAdmin && <option value="admin">Админ</option>}
        </Select>
        <SubmitButton pendingText="…">Урих</SubmitButton>
      </div>
    </form>
  );
}
