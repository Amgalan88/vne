"use client";

import { useRouter } from "next/navigation";
import { SLUG_HINT, useSlugCheck } from "./use-slug-check";

/** Нүүр хуудасны "[tumen].hhk.mn  [Хаягаа авах]" — бүртгэл рүү хаягтай нь шилжүүлнэ */
export function SlugClaim({ rootDomain, onDark = false }: { rootDomain: string; onDark?: boolean }) {
  const router = useRouter();
  const { slug, setSlug, status } = useSlugCheck();
  const blocked = status === "invalid" || status === "taken";

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (blocked) return;
        router.push(slug ? `/signup?slug=${encodeURIComponent(slug)}` : "/signup");
      }}
      className="w-full max-w-lg"
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-indigo-900/10 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center rounded-xl px-3 py-2 focus-within:bg-slate-50">
          <span className="sr-only">Компанийн хаяг</span>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="tumen"
            maxLength={30}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full min-w-0 bg-transparent text-right text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-300"
          />
          <span className="shrink-0 text-lg font-semibold text-slate-400">.{rootDomain}</span>
        </label>
        <button
          type="submit"
          disabled={blocked}
          className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-indigo-600/25 transition hover:brightness-110 disabled:opacity-50"
        >
          Хаягаа авах →
        </button>
      </div>
      <p className={`mt-2 min-h-5 pl-2 text-sm ${onDark ? "text-indigo-100" : "text-slate-500"}`}>
        {status === "empty" ? "Компанийнхаа хаягийг бичээд үнэгүй эхлээрэй." : SLUG_HINT[status]}
      </p>
    </form>
  );
}
