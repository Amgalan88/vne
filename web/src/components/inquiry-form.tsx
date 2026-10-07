"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/lib/inquiry-actions";

/** Нийтийн хуудасны захиалга / асуултын маягт (загвар бүрт таарах өнгөтэй) */
export function InquiryForm({ slug, tone, accent }: { slug: string; tone: "light" | "dark"; accent: string }) {
  const [state, action, pending] = useActionState(submitInquiry.bind(null, slug), {} as InquiryState);
  const field =
    tone === "dark"
      ? "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-white/40"
      : "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400";
  if (state.ok)
    return (
      <div className={`rounded-2xl p-6 text-center ${tone === "dark" ? "bg-white/10" : "bg-emerald-50 text-emerald-800"}`}>
        <p className="text-3xl">✓</p>
        <p className="mt-2 font-bold">Хүсэлт тань илгээгдлээ</p>
        <p className="mt-1 text-sm opacity-80">Бид удахгүй холбогдоно.</p>
      </div>
    );
  return (
    <form action={action} className="space-y-3">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <input id="inq-name" name="name" required maxLength={100} placeholder="Таны нэр" className={field} />
        <input id="inq-phone" name="phone" required type="tel" maxLength={30} placeholder="Утасны дугаар" className={field} />
      </div>
      <textarea id="inq-message" name="message" maxLength={1000} rows={3} placeholder="Захиалга, асуулт…" className={field} />
      {state.error && <p className={`text-sm ${tone === "dark" ? "text-red-300" : "text-red-600"}`}>{state.error}</p>}
      <button disabled={pending} className={`w-full rounded-xl px-5 py-3 text-sm font-bold shadow-lg disabled:opacity-60 ${tone === "dark" ? "bg-white text-slate-900" : `${accent} text-white`}`}>
        {pending ? "Илгээж байна…" : "Илгээх"}
      </button>
    </form>
  );
}
