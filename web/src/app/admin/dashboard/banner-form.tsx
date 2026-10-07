"use client";

import { useActionState } from "react";
import { Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveBanner, type BannerState } from "../actions";

export function BannerForm({ link, alt, enabled, hasImage }: { link: string; alt: string; enabled: boolean; hasImage: boolean }) {
  const [state, action] = useActionState(saveBanner, {} as BannerState);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      <Field label={hasImage ? "Зураг солих (заавал биш)" : "Баннерын зураг"} hint="PNG, JPG, WEBP · 5MB хүртэл · өргөн зураг (жишээ нь 1600×400) хамгийн сайн">
        <input id="banner-file" name="file" type="file" accept="image/png,image/jpeg,image/webp" required={!hasImage} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      </Field>
      <Field label="Дарахад очих хаяг (заавал биш)" hint="Жишээ: /signup эсвэл https://facebook.com/hhk.mn">
        <Input id="banner-link" name="link" defaultValue={link} placeholder="/signup" />
      </Field>
      <Field label="Зургийн тайлбар (заавал биш)" hint="Зураг ачаалагдахгүй үед болон дэлгэц уншигчид харагдана">
        <Input id="banner-alt" name="alt" defaultValue={alt} placeholder="Шинэ жилийн урамшуулал — 1 жилийн эрх 400,000₮" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input id="banner-enabled" type="checkbox" name="enabled" defaultChecked={enabled} className="h-4 w-4" />
        Нүүр хуудсанд харуулах
      </label>
      <SubmitButton variant="primary">Хадгалах</SubmitButton>
    </form>
  );
}
