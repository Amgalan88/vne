"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_COLORS, SITE_TEMPLATES, type Service, type SiteColor, type SiteTemplate } from "@/lib/site";

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
  const template = String(fd.get("template")) as SiteTemplate;

  const supabase = await createClient();
  const row = {
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
  };
  let { error } = await supabase
    .from("tenant_sites")
    .upsert({ ...row, template: SITE_TEMPLATES.some(x => x.key === template) ? template : "modern" });
  // 008_site_templates.sql ажиллаагүй бол загваргүйгээр хадгална
  let noTemplates = false;
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    ({ error } = await supabase.from("tenant_sites").upsert(row));
    noTemplates = true;
  }
  if (error) return { error: error.code === "42501" ? "Засах эрх хүрэлцэхгүй байна." : error.message };
  revalidatePath("/t/[tenant]", "page");
  revalidatePath("/t/[tenant]/site", "page");
  const msg = fd.get("published") === "on" ? "✓ Хадгалагдаж, нийтлэгдлээ" : "✓ Хадгалагдлаа (нийтлээгүй)";
  return { message: noTemplates ? `${msg}. Загвар сонголт ажиллахын тулд 008_site_templates.sql-ийг Run хийнэ үү.` : msg };
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Нүүр зураг — нийтийн "sites" bucket-д. Эрхийг storage policy (owner/admin) шалгана. */
export async function uploadCover(tenantId: string, fd: FormData): Promise<SiteState> {
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Зургаа сонгоно уу." };
  const ext = EXT[file.type];
  if (!ext) return { error: "PNG, JPG эсвэл WEBP зураг оруулна уу." };
  if (file.size > 5 * 1024 * 1024) return { error: "Зураг 5MB-аас бага байх ёстой." };

  const supabase = await createClient();
  const { data: cur, error: readErr } = await supabase.from("tenant_sites").select("cover_path").eq("tenant_id", tenantId).maybeSingle();
  if (readErr) return { error: "Нүүр зураг оруулахын тулд эхлээд 008_site_templates.sql-ийг Run хийнэ үү." };
  const path = `${tenantId}/cover-${Date.now()}.${ext}`;
  const up = await supabase.storage.from("sites").upload(path, file, { contentType: file.type });
  if (up.error) return { error: `Зураг хадгалж чадсангүй: ${up.error.message}` };
  const { error } = await supabase.from("tenant_sites").upsert({ tenant_id: tenantId, cover_path: path });
  if (error) {
    await supabase.storage.from("sites").remove([path]);
    return { error: error.message };
  }
  if (cur?.cover_path) await supabase.storage.from("sites").remove([cur.cover_path]);
  revalidatePath("/t/[tenant]", "page");
  revalidatePath("/t/[tenant]/site", "page");
  return { message: "✓ Нүүр зураг хадгалагдлаа" };
}

export async function removeCover(tenantId: string): Promise<SiteState> {
  const supabase = await createClient();
  const { data: cur } = await supabase.from("tenant_sites").select("cover_path").eq("tenant_id", tenantId).maybeSingle();
  await supabase.from("tenant_sites").update({ cover_path: null }).eq("tenant_id", tenantId);
  if (cur?.cover_path) await supabase.storage.from("sites").remove([cur.cover_path]);
  revalidatePath("/t/[tenant]", "page");
  revalidatePath("/t/[tenant]/site", "page");
  return { message: "✓ Устгагдлаа" };
}
