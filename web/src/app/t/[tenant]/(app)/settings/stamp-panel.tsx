"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { buttonClass, Card, Field, Input, Notice, Select } from "@/components/ui";
import {
  lockStamp,
  removeAsset,
  resetPin,
  saveModes,
  setPin,
  unlockStamp,
  uploadAsset,
  type AssetKind,
  type StampState,
} from "./stamp-actions";

export type StampInfo = {
  hasPin: boolean;
  unlocked: boolean;
  lockedUntil: string | null;
  stampMode: "on" | "pin" | "off";
  sigMode: "on" | "pin" | "off";
  urls: { logo: string | null; stamp: string | null; signature: string | null };
  has: { logo: boolean; stamp: boolean; signature: boolean };
};

const MODE_LABEL = { on: "Үргэлж гаргах", pin: "PIN-ээр нээсэн үед", off: "Гаргахгүй" } as const;
const KINDS: { kind: AssetKind; label: string; hint: string }[] = [
  { kind: "logo", label: "Лого", hint: "Баримтын толгойд" },
  { kind: "stamp", label: "Тамга", hint: "Ил тод дэвсгэртэй PNG хамгийн сайн" },
  { kind: "signature", label: "Гарын үсэг", hint: "Цагаан цаас дээр зурж, зургийг нь авна" },
];

export function StampPanel({
  tenantId,
  issuerId,
  name,
  info,
  isOwner,
  isPro,
}: {
  tenantId: string;
  issuerId: string;
  name: string;
  info: StampInfo;
  isOwner: boolean;
  isPro: boolean;
}) {
  const [notice, setNotice] = useState<StampState>({});
  const [pending, start] = useTransition();
  const [stampMode, setStampMode] = useState(info.stampMode);
  const [sigMode, setSigMode] = useState(info.sigMode);
  const pinRef = useRef<HTMLInputElement>(null);
  const newPinRef = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<StampState>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setNotice(r);
      if (!r.error) after?.();
    });

  const needsUnlock = info.hasPin && !info.unlocked;

  return (
    <Card className="space-y-5 p-5">
      <div>
        <h2 className="font-bold">Лого, тамга, гарын үсэг</h2>
        <p className="text-sm text-slate-500">{name}</p>
      </div>

      {notice.error && <Notice tone="error">{notice.error}</Notice>}
      {notice.message && <Notice tone="success">{notice.message}</Notice>}

      {info.hasPin && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-semibold">{info.unlocked ? "🔓 Нээлттэй" : "🔒 Түгжээтэй"}</span>
          {info.lockedUntil && !info.unlocked && <span className="text-xs text-red-600">Хэт олон буруу оролдлоо — түр түгжигдсэн</span>}
          {info.unlocked ? (
            <button type="button" disabled={pending} onClick={() => run(() => lockStamp(issuerId))} className={buttonClass("light", "ml-auto px-3 py-1.5")}>
              Түгжих
            </button>
          ) : (
            <form
              className="ml-auto flex gap-2"
              onSubmit={e => {
                e.preventDefault();
                run(() => unlockStamp(issuerId, pinRef.current?.value ?? ""), () => pinRef.current && (pinRef.current.value = ""));
              }}
            >
              <Input ref={pinRef} type="password" inputMode="numeric" maxLength={6} placeholder="PIN" className="w-28" required />
              <button disabled={pending} className={buttonClass("dark", "px-3 py-1.5")}>Нээх</button>
            </form>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {KINDS.map(({ kind, label, hint }) => {
          const url = info.urls[kind];
          const has = info.has[kind];
          return (
            <div key={kind} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold">{label}</p>
              <div className="my-2 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xs text-slate-400">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
                ) : has ? (
                  "🔒 Нуугдсан"
                ) : (
                  "Оруулаагүй"
                )}
              </div>
              <p className="mb-2 text-[11px] text-slate-400">{hint}</p>
              <label className={buttonClass("light", "w-full cursor-pointer justify-center py-1.5 text-xs")}>
                {has ? "Солих" : "Оруулах"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={pending || (kind !== "logo" && needsUnlock)}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const fd = new FormData();
                    fd.set("file", f);
                    run(() => uploadAsset(tenantId, issuerId, kind, fd));
                  }}
                />
              </label>
              {has && (
                <button
                  type="button"
                  disabled={pending || (kind !== "logo" && needsUnlock)}
                  onClick={() => confirm(`${label}-г устгах уу?`) && run(() => removeAsset(tenantId, issuerId, kind))}
                  className="mt-1 w-full text-center text-xs text-red-600 hover:underline disabled:opacity-40"
                >
                  Устгах
                </button>
              )}
            </div>
          );
        })}
      </div>
      {needsUnlock && <p className="text-xs text-slate-500">Тамга, гарын үсгийг солихын тулд эхлээд дээрээс PIN-ээр нээнэ үү.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Тамга">
          <Select value={stampMode} onChange={e => setStampMode(e.target.value as StampInfo["stampMode"])}>
            {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Гарын үсэг">
          <Select value={sigMode} onChange={e => setSigMode(e.target.value as StampInfo["sigMode"])}>
            {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
      </div>
      {(stampMode === "pin" || sigMode === "pin") && !info.hasPin && (
        <p className="text-xs text-amber-700">PIN горим ажиллахын тулд доор PIN тохируулна уу.</p>
      )}
      <button
        type="button"
        disabled={pending || needsUnlock || (stampMode === info.stampMode && sigMode === info.sigMode)}
        onClick={() => run(() => saveModes(tenantId, issuerId, stampMode, sigMode))}
        className={buttonClass("primary", "py-2")}
      >
        Горим хадгалах
      </button>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-2 text-sm font-semibold">Тамганы PIN</p>
        {isPro ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={e => {
              e.preventDefault();
              run(() => setPin(issuerId, newPinRef.current?.value ?? ""), () => newPinRef.current && (newPinRef.current.value = ""));
            }}
          >
            <Field label={info.hasPin ? "Шинэ PIN (4–6 орон)" : "PIN (4–6 орон)"}>
              <Input ref={newPinRef} type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} required className="w-40" />
            </Field>
            <button disabled={pending || needsUnlock} className={buttonClass("dark", "py-2")}>{info.hasPin ? "PIN солих" : "PIN тохируулах"}</button>
            {info.hasPin && isOwner && (
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm("PIN-ийг устгаж шинээр тохируулах уу?") && run(() => resetPin(issuerId))}
                className="text-xs text-slate-500 underline"
              >
                PIN мартсан
              </button>
            )}
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            PIN хамгаалалт төлбөртэй багцад багтана.{" "}
            <Link href="/billing" className="font-semibold text-indigo-600 underline">Багц →</Link>
          </p>
        )}
      </div>
    </Card>
  );
}
