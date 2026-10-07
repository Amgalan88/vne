"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Хөтчийн хаяг "/members" ч байж болно, rewrite хийгдсэн "/t/umgm/members" ч байж болно — хоёуланг нь таньна
export function TenantNav({ links, slug }: { links: { href: string; label: string }[]; slug: string }) {
  const raw = usePathname();
  const path = raw.startsWith(`/t/${slug}`) ? raw.slice(`/t/${slug}`.length) || "/" : raw;

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
      {links.map(l => {
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${
              active ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
