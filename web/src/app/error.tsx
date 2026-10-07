"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Хуудас ачаалах үед гэнэтийн алдаа гарвал — цагаан дэлгэцийн оронд ойлгомжтой мессеж, дахин оролдох товч */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Алдаа гарлаа</h1>
      <p className="mt-2 max-w-md text-slate-500">
        Түр зуурын асуудал байж магадгүй. Дахин оролдоно уу. Давтагдвал доорх кодыг админд илгээнэ үү.
      </p>
      {error.digest && <p className="mt-3 font-mono text-xs text-slate-400">Код: {error.digest}</p>}
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Дахин оролдох</button>
        <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Нүүр хуудас</Link>
      </div>
    </main>
  );
}
