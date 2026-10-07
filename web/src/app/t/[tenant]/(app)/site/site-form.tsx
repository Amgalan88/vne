"use client";

import { useActionState, useState } from "react";
import { buttonClass, Card, Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { SITE_COLORS, THEME, type Service, type SiteColor } from "@/lib/site";
import { saveSite, type SiteState } from "./actions";

export type SiteValues = {
  published: boolean;
  headline: string;
  about: string;
  services: Service[];
  phone: string;
  email: string;
  address: string;
  facebook: string;
  color: SiteColor;
};

const textarea =
  "w-full rounded-lg border-[1.5px] border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500";

export function SiteForm({ tenantId, values }: { tenantId: string; values: SiteValues }) {
  const [state, action] = useActionState(saveSite.bind(null, tenantId), {} as SiteState);
  const [services, setServices] = useState<Service[]>(values.services.length ? values.services : [{ title: "", text: "" }]);
  const [color, setColor] = useState<SiteColor>(values.color);
  const setService = (i: number, patch: Partial<Service>) =>
    setServices(services.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="services" value={JSON.stringify(services)} />
      <input type="hidden" name="color" value={color} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}

      <Card className="space-y-3 p-5">
        <Field label="Уриа үг / Товч танилцуулга">
          <Input name="headline" defaultValue={values.headline} placeholder="Оффисын бараа, хэвлэлийн цаасны бөөний худалдаа" />
        </Field>
        <Field label="Бидний тухай">
          <textarea name="about" defaultValue={values.about} className={`${textarea} min-h-28`} placeholder="Манай компани 2015 оноос хойш…" />
        </Field>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Бүтээгдэхүүн, үйлчилгээ</p>
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={i} className="flex gap-2 rounded-lg border border-slate-200 p-2">
              <div className="flex-1 space-y-2">
                <Input value={s.title} onChange={e => setService(i, { title: e.target.value })} placeholder="Нэр (жишээ нь: Хэвлэлийн цаас)" />
                <Input value={s.text} onChange={e => setService(i, { text: e.target.value })} placeholder="Товч тайлбар" />
              </div>
              <button
                type="button"
                onClick={() => setServices(services.filter((_, j) => j !== i))}
                className="px-2 text-slate-400 hover:text-red-600"
                aria-label="Устгах"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {services.length < 9 && (
          <button type="button" onClick={() => setServices([...services, { title: "", text: "" }])} className={buttonClass("light", "mt-2 w-full")}>
            ＋ Нэмэх
          </button>
        )}
      </Card>

      <Card className="grid gap-3 p-5 sm:grid-cols-2">
        <Field label="Утас"><Input name="phone" defaultValue={values.phone} placeholder="8888-8888" /></Field>
        <Field label="Имэйл"><Input name="email" type="email" defaultValue={values.email} /></Field>
        <Field label="Хаяг"><Input name="address" defaultValue={values.address} placeholder="Улаанбаатар, ..." /></Field>
        <Field label="Facebook хуудас"><Input name="facebook" defaultValue={values.facebook} placeholder="facebook.com/tumen" /></Field>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Өнгө</p>
        <div className="flex flex-wrap gap-2">
          {SITE_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                color === c ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
              }`}
            >
              <span className={`h-4 w-4 rounded-full ${THEME[c].swatch}`} />
              {THEME[c].label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={values.published} className="h-4 w-4 accent-indigo-600" />
          Нийтэд харуулах
        </label>
        <SubmitButton variant="primary">Хадгалах</SubmitButton>
      </Card>
    </form>
  );
}
