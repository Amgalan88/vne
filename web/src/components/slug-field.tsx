"use client";

import { Field, Input } from "./ui";
import { SLUG_HINT, useSlugCheck } from "./use-slug-check";

/** Маягт доторх "[____].hhk.mn" талбар — name="slug" */
export function SlugField({ defaultValue = "", rootDomain }: { defaultValue?: string; rootDomain: string }) {
  const { slug, setSlug, status } = useSlugCheck(defaultValue);
  return (
    <Field label="Компанийн хаяг" hint={SLUG_HINT[status]}>
      <div className="flex items-center gap-1">
        <Input
          name="slug"
          required
          value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="tumen"
          maxLength={30}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="text-right"
        />
        <span className="shrink-0 text-sm font-semibold text-slate-500">.{rootDomain}</span>
      </div>
    </Field>
  );
}
