import Link from "next/link";
import { Logo } from "@/components/logo";

/** Үйлчилгээний нөхцөл, нууцлалын бодлогын нийтлэг хэлбэр */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string[] }[] }) {
  return (
    <div className="flex-1 bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Нүүр хуудас</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Сүүлд шинэчилсэн: {updated}</p>
        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold">
                {i + 1}. {s.h}
              </h2>
              <div className="mt-2 space-y-2 leading-relaxed text-slate-700">
                {s.p.map(t => <p key={t}>{t}</p>)}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-12 text-sm text-slate-500">Асуулт байвал: erdenebilegamgalan@gmail.com</p>
      </main>
    </div>
  );
}
