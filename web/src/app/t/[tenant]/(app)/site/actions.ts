"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_COLORS, SITE_TEMPLATES, siteImageUrl, type Service, type SiteColor, type SiteTemplate } from "@/lib/site";

export type SiteState = { error?: string; message?: string };
export type ImageKind = "cover" | "logo" | "about";

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const COLUMN: Record<ImageKind, string> = { cover: "cover_path", logo: "logo_path", about: "about_image_path" };
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const SQL_HINT: Record<ImageKind, string> = {
  cover: "008_site_templates.sql",
  logo: "009_site_media.sql",
  about: "009_site_media.sql",
};

const refresh = () => {
  revalidatePath("/t/[tenant]", "page");
  revalidatePath("/t/[tenant]/site", "page");
};

function checkImage(file: FormDataEntryValue | null): { file?: File; ext?: string; error?: string } {
  if (!(file instanceof File) || !file.size) return { error: "Зургаа сонгоно уу." };
  const ext = EXT[file.type];
  if (!ext) return { error: "PNG, JPG эсвэл WEBP зураг оруулна уу." };
  if (file.size > 5 * 1024 * 1024) return { error: "Зураг 5MB-аас бага байх ёстой." };
  return { file, ext };
}

export async function saveSite(tenantId: string, _: SiteState, fd: FormData): Promise<SiteState> {
  let services: Service[] = [];
  try {
    const raw = JSON.parse(String(fd.get("services") ?? "[]"));
    if (Array.isArray(raw))
      services = raw
        .map(s => {
          const image = typeof s?.image === "string" && s.image.startsWith(`${tenantId}/`) ? s.image : null;
          return {
            title: String(s?.title ?? "").trim().slice(0, 100),
            text: String(s?.text ?? "").trim().slice(0, 600),
            price: String(s?.price ?? "").trim().slice(0, 60),
            image,
          };
        })
        .filter(s => s.title)
        .slice(0, 12);
  } catch {
    return { error: "Үйлчилгээний жагсаалт буруу байна." };
  }
  const color = String(fd.get("color")) as SiteColor;
  const template = String(fd.get("template")) as SiteTemplate;

  const supabase = await createClient();
  const { data: before } = await supabase.from("tenant_sites").select("services").eq("tenant_id", tenantId).maybeSingle();

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

  // Хассан, сольсон үйлчилгээний зургийг storage-оос цэвэрлэнэ
  const kept = new Set(services.map(s => s.image).filter(Boolean));
  const stale = ((before?.services ?? []) as Service[]).map(s => s.image).filter((p): p is string => !!p && !kept.has(p));
  if (stale.length) await supabase.storage.from("sites").remove(stale);

  refresh();
  const msg = fd.get("published") === "on" ? "✓ Хадгалагдаж, нийтлэгдлээ" : "✓ Хадгалагдлаа (нийтлээгүй)";
  return { message: noTemplates ? `${msg}. Загвар сонголт ажиллахын тулд 008_site_templates.sql-ийг Run хийнэ үү.` : msg };
}

/** Нүүр зураг, лого, «Бидний тухай» зураг — нийтийн "sites" bucket-д. Эрхийг storage policy (owner/admin) шалгана. */
export async function uploadSiteImage(tenantId: string, kind: ImageKind, fd: FormData): Promise<SiteState> {
  const { file, ext, error: bad } = checkImage(fd.get("file"));
  if (bad) return { error: bad };
  const col = COLUMN[kind];

  const supabase = await createClient();
  const { data: cur, error: readErr } = await supabase.from("tenant_sites").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (readErr || (cur && !(col in cur))) return { error: `Энэ зургийг оруулахын тулд эхлээд ${SQL_HINT[kind]}-ийг Run хийнэ үү.` };

  const path = `${tenantId}/${kind}-${Date.now()}.${ext}`;
  const up = await supabase.storage.from("sites").upload(path, file!, { contentType: file!.type });
  if (up.error) return { error: `Зураг хадгалж чадсангүй: ${up.error.message}` };
  const { error } = await supabase.from("tenant_sites").upsert({ tenant_id: tenantId, [col]: path });
  if (error) {
    await supabase.storage.from("sites").remove([path]);
    return { error: error.code === "PGRST204" ? `Эхлээд ${SQL_HINT[kind]}-ийг Run хийнэ үү.` : error.message };
  }
  const old = (cur as Record<string, string | null> | null)?.[col];
  if (old) await supabase.storage.from("sites").remove([old]);
  refresh();
  return { message: "✓ Зураг хадгалагдлаа" };
}

export async function removeSiteImage(tenantId: string, kind: ImageKind): Promise<SiteState> {
  const col = COLUMN[kind];
  const supabase = await createClient();
  const { data: cur } = await supabase.from("tenant_sites").select("*").eq("tenant_id", tenantId).maybeSingle();
  await supabase.from("tenant_sites").update({ [col]: null }).eq("tenant_id", tenantId);
  const old = (cur as Record<string, string | null> | null)?.[col];
  if (old) await supabase.storage.from("sites").remove([old]);
  refresh();
  return { message: "✓ Устгагдлаа" };
}

/** Үйлчилгээний зураг — замыг буцаана, «Хадгалах» дарахад services-д орно */
export async function uploadServiceImage(tenantId: string, fd: FormData): Promise<{ path?: string; url?: string; error?: string }> {
  const { file, ext, error: bad } = checkImage(fd.get("file"));
  if (bad) return { error: bad };
  const supabase = await createClient();
  const path = `${tenantId}/svc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const up = await supabase.storage.from("sites").upload(path, file!, { contentType: file!.type });
  if (up.error) return { error: `Зураг хадгалж чадсангүй: ${up.error.message}. 008_site_templates.sql ажилласан эсэхийг шалгана уу.` };
  return { path, url: siteImageUrl(path)! };
}
