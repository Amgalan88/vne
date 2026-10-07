"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Input, Notice } from "@/components/ui";
import { buttonClass } from "@/components/ui";
import { unlockStamp } from "../settings/stamp-actions";

/** Тамга, гарын үсэг PIN горимтой үед баримт дээр харуулахын тулд PIN-ээр 15 минут нээнэ */
export function StampUnlock({ issuerId }: { issuerId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">🔒 Тамга, гарын үсэг PIN-ээр хамгаалагдсан</p>
      {error && <Notice tone="error">{error}</Notice>}
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          start(async () => {
            const r = await unlockStamp(issuerId, ref.current?.value ?? "");
            if (r.error) setError(r.error);
            else router.refresh();
          });
        }}
      >
        <Input ref={ref} type="password" inputMode="numeric" maxLength={6} placeholder="PIN" required className="w-28" />
        <button disabled={pending} className={buttonClass("dark", "px-3 py-1.5")}>Нээх</button>
      </form>
    </div>
  );
}
