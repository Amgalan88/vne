"use client";

import { useActionState, useState, useTransition } from "react";
import { buttonClass, Card, Field, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { SITE_COLORS, SITE_TEMPLATES, THEME, siteImageUrl, type Service, type SiteColor, type SiteTemplate } from "@/lib/site";
import { removeSiteImage, saveSite, uploadServiceImage, uploadSiteImage, type ImageKind, type SiteState } from "./actions";

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
  template: SiteTemplate;
  cover: string | null;
  logo: string | null;
  aboutImage: string | null;
};

const textarea =
  "w-full rounded-lg border-[1.5px] border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500";

/** Загвар бүрийн жижиг дүрслэл — сонгоход ойлгомжтой */
function TemplateThumb({ tpl, color }: { tpl: SiteTemplate; color: SiteColor }) {
  const t = THEME[color];
  if (tpl === "modern")
    return (
      <div className={`relative h-full bg-gradient-to-br ${t.grad} p-2`}>
        <div className="absolute inset-0 bg-network" />
        <div className="relative mt-3 h-2 w-12 rounded bg-white/90" />
        <div className="relative mt-1 h-1.5 w-16 rounded bg-white/50" />
        <div className="relative mt-2 h-8 w-14 translate-x-14 -translate-y-6 rounded bg-white/25 ring-1 ring-white/40" />
      </div>
    );
  if (tpl === "clean")
    return (
      <div className="h-full bg-white p-2">
        <div className={`h-1 w-5 rounded ${t.solid}`} />
        <div className="mt-2 h-2 w-12 rounded bg-slate-800" />
        <div className="mt-1 h-1.5 w-14 rounded bg-slate-300" />
        <div className={`mt-2 h-8 w-14 translate-x-14 -translate-y-8 rounded ${t.soft}`} />
      </div>
    );
  if (tpl === "bold")
    return (
      <div className={`h-full ${t.solid} p-2`}>
        <div className="mt-3 h-3 w-20 rounded bg-white" />
        <div className="mt-1 h-3 w-14 rounded bg-white" />
        <div className="mt-3 flex gap-1">
          <div className="h-5 w-8 bg-slate-900" />
          <div className="h-5 w-8 bg-white/60" />
          <div className="h-5 w-8 bg-slate-900" />
        </div>
      </div>
    );
  return (
    <div className="relative h-full overflow-hidden bg-slate-950 p-2">
      <div className={`absolute -top-6 left-1/2 h-14 w-24 -translate-x-1/2 rounded-full blur-xl ${t.glow}`} />
      <div className="relative mx-auto mt-4 h-2 w-14 rounded bg-white" />
      <div className={`relative mx-auto mt-1 h-1.5 w-16 rounded ${t.solid} opacity-70`} />
      <div className="relative mt-3 flex justify-center gap-1">
        <div className="h-4 w-8 rounded border border-white/20" />
        <div className="h-4 w-8 rounded border border-white/20" />
      </div>
    </div>
  );
}

/** Нэг зураг оруулах, солих, устгах (лого, нүүр зураг, «Бидний тухай» зураг) */
function ImageSlot({ tenantId, kind, url, label, hint, shape }: { tenantId: string; kind: ImageKind; url: string | null; label: string; hint: string; shape: string }) {
  const [msg, setMsg] = useState<SiteState>({});
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center justify-center overflow-hidden bg-slate-100 text-xs text-slate-400 ring-1 ring-slate-200 ${shape}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : "Зураггүй"}
        </div>
        <div className="space-y-1">
          <label className={buttonClass("light", "cursor-pointer py-1.5")}>
            {pending ? "Хадгалж байна…" : url ? "Солих" : "Оруулах"}
            <input
              id={`site-${kind}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={pending}
              onChange={e => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const fd = new FormData();
                fd.set("file", f);
                start(async () => setMsg(await uploadSiteImage(tenantId, kind, fd)));
              }}
            />
          </label>
          {url && (
            <button type="button" disabled={pending} onClick={() => start(async () => setMsg(await removeSiteImage(tenantId, kind)))} className="block text-xs font-semibold text-red-600 hover:underline">
              Устгах
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">{hint}</p>
      {msg.error && <Notice tone="error">{msg.error}</Notice>}
      {msg.message && <Notice tone="success">{msg.message}</Notice>}
    </div>
  );
}

/** Үйлчилгээний зургийн жижиг хайрцаг */
function ServiceImage({ tenantId, path, onChange }: { tenantId: string; path: string | null | undefined; onChange: (p: string | null) => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const url = siteImageUrl(path);
  return (
    <div className="w-24 shrink-0 space-y-1">
      <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-center text-[11px] text-slate-400 ring-1 ring-slate-200 hover:ring-slate-400">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {pending ? "…" : url ? <img src={url} alt="" className="h-full w-full object-cover" /> : "＋ Зураг"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={pending}
          onChange={e => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const fd = new FormData();
            fd.set("file", f);
            start(async () => {
              const r = await uploadServiceImage(tenantId, fd);
              if (r.error) setErr(r.error);
              else {
                setErr("");
                onChange(r.path!);
              }
            });
          }}
        />
      </label>
      {url && (
        <button type="button" onClick={() => onChange(null)} className="block w-full text-center text-[11px] text-red-600 hover:underline">
          Хасах
        </button>
      )}
      {err && <p className="text-[11px] text-red-600">{err}</p>}
    </div>
  );
}

export function SiteForm({ tenantId, values }: { tenantId: string; values: SiteValues }) {
  const [state, action] = useActionState(saveSite.bind(null, tenantId), {} as SiteState);
  const [services, setServices] = useState<Service[]>(values.services.length ? values.services : [{ title: "", text: "" }]);
  const [color, setColor] = useState<SiteColor>(values.color);
  const [template, setTemplate] = useState<SiteTemplate>(values.template);
  const setService = (i: number, patch: Partial<Service>) =>
    setServices(services.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="services" value={JSON.stringify(services)} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="template" value={template} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}

      <Card className="p-5">
        <p className="mb-1 text-sm font-bold">1. Загвараа сонгоно уу</p>
        <p className="mb-3 text-xs text-slate-500">Дараа нь хүссэн үедээ сольж болно — агуулга хэвээр үлдэнэ.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SITE_TEMPLATES.map(tp => (
            <button
              key={tp.key}
              type="button"
              onClick={() => setTemplate(tp.key)}
              className={`overflow-hidden rounded-xl border text-left transition ${template === tp.key ? "border-indigo-600 ring-2 ring-indigo-600" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="h-20 overflow-hidden">
                <TemplateThumb tpl={tp.key} color={color} />
              </div>
              <div className="p-2.5">
                <p className="text-sm font-bold">{tp.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{tp.text}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-5 mb-2 text-sm font-bold">Өнгө</p>
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

      <Card className="grid gap-6 p-5 sm:grid-cols-2">
        <p className="text-sm font-bold sm:col-span-2">2. Лого ба нүүр зураг</p>
        <ImageSlot tenantId={tenantId} kind="logo" url={values.logo} label="Лого" hint="Дөрвөлжин, ил тод дэвсгэртэй PNG хамгийн сайн. Цэсний зүүн талд гарна." shape="h-20 w-20 rounded-xl" />
        <ImageSlot tenantId={tenantId} kind="cover" url={values.cover} label="Нүүр зураг" hint="Оффис, бүтээгдэхүүн, багийн өргөн зураг. Байхгүй бол нэрийн үсгээр гоё дэвсгэр гарна." shape="h-20 w-32 rounded-xl" />
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-bold">3. Танилцуулга</p>
        <Field label="Уриа үг / Товч танилцуулга">
          <Input name="headline" defaultValue={values.headline} placeholder="Оффисын бараа, хэвлэлийн цаасны бөөний худалдаа" />
        </Field>
        <Field label="Бидний тухай">
          <textarea name="about" defaultValue={values.about} className={`${textarea} min-h-28`} placeholder="Манай компани 2015 оноос хойш…" />
        </Field>
        <ImageSlot tenantId={tenantId} kind="about" url={values.aboutImage} label="«Бидний тухай» хэсгийн зураг" hint="Багийн, оффисын эсвэл ажлын зураг." shape="h-20 w-32 rounded-xl" />
      </Card>

      <Card className="p-5">
        <p className="mb-1 text-sm font-bold">4. Бүтээгдэхүүн, үйлчилгээ</p>
        <p className="mb-3 text-xs text-slate-500">Зураг, үнэ, тайлбартай. Үнэ хоосон бол харагдахгүй. «Үнэ тохиролцоно» гэж бичиж болно.</p>
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <ServiceImage tenantId={tenantId} path={s.image} onChange={p => setService(i, { image: p })} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input value={s.title} onChange={e => setService(i, { title: e.target.value })} placeholder="Нэр (жишээ нь: Хэвлэлийн цаас)" className="flex-1" />
                  <Input value={s.price ?? ""} onChange={e => setService(i, { price: e.target.value })} placeholder="Үнэ (45,000₮)" className="w-32" />
                </div>
                <textarea value={s.text} onChange={e => setService(i, { text: e.target.value })} placeholder="Тайлбар — юу багтдаг, хугацаа, онцлог…" className={`${textarea} min-h-16`} />
              </div>
              <button
                type="button"
                onClick={() => setServices(services.filter((_, j) => j !== i))}
                className="self-start px-1 text-slate-400 hover:text-red-600"
                aria-label="Устгах"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {services.length < 12 && (
          <button type="button" onClick={() => setServices([...services, { title: "", text: "" }])} className={buttonClass("light", "mt-2 w-full")}>
            ＋ Нэмэх
          </button>
        )}
      </Card>

      <Card className="grid gap-3 p-5 sm:grid-cols-2">
        <p className="text-sm font-bold sm:col-span-2">5. Холбоо барих</p>
        <Field label="Утас"><Input name="phone" defaultValue={values.phone} placeholder="8888-8888" /></Field>
        <Field label="Имэйл"><Input name="email" type="email" defaultValue={values.email} /></Field>
        <Field label="Хаяг"><Input name="address" defaultValue={values.address} placeholder="Улаанбаатар, ..." /></Field>
        <Field label="Facebook хуудас"><Input name="facebook" defaultValue={values.facebook} placeholder="facebook.com/tumen" /></Field>
      </Card>

      <Card className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={values.published} className="h-4 w-4 accent-indigo-600" />
          Нийтэд харуулах
        </label>
        <SubmitButton variant="primary">Хадгалах</SubmitButton>
      </Card>
    </form>
  );
}
