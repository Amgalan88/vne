import Link from "next/link";

/** Тамганы дугуй хэлбэртэй тэмдэг + "hhk.mn" */
export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-extrabold tracking-tight">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600" />
        <circle cx="16" cy="16" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-indigo-600" />
        <path d="M11.5 12v8M20.5 12v8M11.5 16h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-indigo-600" />
      </svg>
      <span className={`text-lg ${light ? "text-white" : "text-slate-900"}`}>
        hhk<span className={light ? "text-indigo-300" : "text-indigo-600"}>.mn</span>
      </span>
    </Link>
  );
}
