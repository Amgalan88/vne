import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Админ", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">Админ</span>
        </div>
        {children}
      </main>
    </div>
  );
}
