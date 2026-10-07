"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Хүлээгдэж буй зүйл байхад хуудсыг өөрөө шинэчилнэ — админ баталгаажуулмагц шууд харагдана */
export function AutoRefresh({ active, seconds = 10 }: { active: boolean; seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active, seconds, router]);
  return null;
}
