"use client";

import { useEffect, useState } from "react";
import { checkSlug } from "@/app/slug-actions";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

export type SlugStatus = "empty" | "invalid" | "checking" | "free" | "taken";

/** Бичиж дуусахыг 400ms хүлээгээд дэд домэйн сул эсэхийг шалгана */
export function useSlugCheck(initial = "") {
  const [slug, setSlugRaw] = useState(normalizeSlug(initial));
  const [result, setResult] = useState<{ slug: string; free: boolean } | null>(null);

  useEffect(() => {
    if (!isValidSlug(slug)) return;
    let live = true;
    const t = setTimeout(() => checkSlug(slug).then(free => live && setResult({ slug, free })), 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [slug]);

  const status: SlugStatus = !slug
    ? "empty"
    : !isValidSlug(slug)
      ? "invalid"
      : result?.slug !== slug
        ? "checking"
        : result.free
          ? "free"
          : "taken";

  return { slug, setSlug: (v: string) => setSlugRaw(normalizeSlug(v)), status };
}

export const SLUG_HINT: Record<SlugStatus, string> = {
  empty: "Латин жижиг үсэг, тоо, зураас. 3–30 тэмдэгт.",
  invalid: "⚠️ Зөвхөн латин жижиг үсэг (a-z), тоо, зураас. 3–30 тэмдэгт.",
  checking: "Шалгаж байна…",
  free: "✅ Сул байна",
  taken: "❌ Авагдсан эсвэл боломжгүй",
};
