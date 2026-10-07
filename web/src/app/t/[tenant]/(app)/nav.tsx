"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Хөтчийн хаяг "/members" ч байж болно, rewrite хийгдсэн "/t/umgm/members" ч байж болно — хоёуланг нь таньна
export function TenantNav({ links, slug }: { links: { href: string; label: string }[]; slug: string }) {
  const raw = usePathname();
  const path = raw.startsWith(`/t/${slug}`) ? raw.slice(`/t/${slug}`.length) || "/" : raw;

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
      {links.map(l => {
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              active ? "bg-white text-brand-navy shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
