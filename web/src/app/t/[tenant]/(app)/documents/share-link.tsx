"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/copy-button";
import { buttonClass } from "@/components/ui";
import { shareDocument } from "./actions";

/** Баримтыг харилцагчид холбоосоор илгээх — нэвтрэлгүй харж, PDF татна. Хүссэн үедээ хаана. */
export function ShareLink({ tenantId, docId, initialUrl }: { tenantId: string; docId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const run = (enable: boolean) =>
    start(async () => {
      const r = await shareDocument(tenantId, docId, enable);
      if (r.error) setErr(r.error);
      else {
        setErr("");
        setUrl(r.url ?? null);
      }
    });

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <p className="font-semibold">🔗 Харилцагчид холбоосоор илгээх</p>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {url ? (
        <>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{url}</span>
            <CopyButton value={url} />
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={url} target="_blank" className={buttonClass("light", "px-3 py-1.5 text-xs")}>Нээж харах</a>
            <a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("light", "px-3 py-1.5 text-xs")}>WhatsApp</a>
            <button type="button" disabled={pending} onClick={() => run(false)} className="px-2 text-xs font-semibold text-red-600 hover:underline">Холбоосыг хаах</button>
          </div>
          <p className="text-xs text-slate-500">Холбоостой хүн нэвтрэлгүйгээр харж, PDF татна. «Холбоосыг хаах» дарвал ажиллахаа болино.</p>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Ихэнхдээ PDF хангалттай. Харилцагч утсан дээрээ файл татахгүйгээр шууд нээж харах бол холбоос үүсгэнэ.
          </p>
          <button type="button" disabled={pending} onClick={() => run(true)} className={buttonClass("light", "w-full py-2")}>
            {pending ? "…" : "Холбоос үүсгэх"}
          </button>
        </>
      )}
    </div>
  );
}
