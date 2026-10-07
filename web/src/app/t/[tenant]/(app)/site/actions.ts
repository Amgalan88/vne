"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_COLORS, type Service, type SiteColor } from "@/lib/site";

export type SiteState = { error?: string; message?: string };

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveSite(tenantId: string, _: SiteState, fd: FormData): Promise<SiteState> {
  let services: Service[] = [];
  try {
    const raw = JSON.parse(String(fd.get("services") ?? "[]"));
    if (Array.isArray(raw))
      services = raw
        .map(s => ({ title: String(s?.title ?? "").trim().slice(0, 100), text: String(s?.text ?? "").trim().slice(0, 500) }))
        .filter(s => s.title)
        .slice(0, 9);
  } catch {
    return { error: "Үйлчилгээний жагсаалт буруу байна." };
  }
  const color = String(fd.get("color")) as SiteColor;

  const supabase = await createClient();
  const { error } = await supabase.from("tenant_sites").upsert({
    tenant_id: tenantId,
    published: fd.get("published") === "on",
    headline: text(fd, "headline", 200),
    about: text(fd, "about", 3000),
    services,
    phone: text(fd, "phone", 50),
    email: text(fd, "email", 200),
    address: text(fd, "address", 300),
    facebook: text(fd, "facebook", 300),
    color: SITE_COLORS.includes(color) ? color : "indigo",
  });
  if (error) return { error: error.code === "42501" ? "Засах эрх хүрэлцэхгүй байна." : error.message };
  revalidatePath("/t/[tenant]", "page");
  revalidatePath("/t/[tenant]/site", "page");
  return { message: fd.get("published") === "on" ? "✓ Хадгалагдаж, нийтлэгдлээ" : "✓ Хадгалагдлаа (нийтлээгүй)" };
}
