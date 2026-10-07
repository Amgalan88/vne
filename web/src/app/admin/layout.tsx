import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Админ", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-slate-50 text-slate-900">
      <div className="bg-brand-dark">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-5">
          <Logo light />
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-teal-200 ring-1 ring-white/20">Админ</span>
        </div>
      </div>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
