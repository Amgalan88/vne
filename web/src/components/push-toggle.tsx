"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/lib/push-actions";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

/** "Мэдэгдэл асаах" ба "Апп болгон суулгах" — төхөөрөмж бүр дээр нэг удаа */
export function PushToggle() {
  const [state, setState] = useState<"loading" | "unsupported" | "denied" | "off" | "on">("loading");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos] = useState(() => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent));

  useEffect(() => {
    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstall(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    (async () => {
      if (!VAPID || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js").catch(() => undefined);
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    })();
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const enable = async () => {
    setBusy(true);
    setErr("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID!) }));
      const json = sub.toJSON();
      const r = await savePushSubscription({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" });
      if (r.error) throw new Error(r.error);
      setState("on");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Мэдэгдэл асаах үед алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  const btn = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {state === "off" && <button type="button" disabled={busy} onClick={enable} className={btn}>🔔 Мэдэгдэл асаах</button>}
      {state === "on" && <button type="button" disabled={busy} onClick={disable} className={btn}>🔔 Мэдэгдэл асаалттай · унтраах</button>}
      {state === "denied" && <span className="text-amber-700">Мэдэгдэл хөтчийн тохиргоогоор хаагдсан байна.</span>}
      {install && <button type="button" onClick={() => install.prompt()} className={btn}>📲 Апп болгон суулгах</button>}
      {isIos && !install && <span className="text-slate-500">iPhone: Хуваалцах → «Нүүр дэлгэцэнд нэмэх» дарж суулгаад, апп-аас мэдэгдэл асаана.</span>}
      {err && <span className="text-red-600">{err}</span>}
    </div>
  );
}
