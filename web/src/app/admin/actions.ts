"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL, getAdminClient } from "@/lib/admin";
import { sendMail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { tenantUrl } from "@/lib/hosts";
import { createClient } from "@/lib/supabase/server";

export type CodeState = { step?: "code"; email?: string; error?: string };

/**
 * 1-р алхам: имэйлд нэг удаагийн код илгээнэ (админы имэйл бүртгэлгүй бол кодоор баталгаажихад өөрөө үүснэ). Админы имэйл биш бол код илгээхгүй ч
 * хариу ижил байна — хэн админ болохыг задруулахгүй.
 * 2-р алхам: кодыг шалгаж нэвтрүүлнэ.
 */
export async function adminLogin(_: CodeState, fd: FormData): Promise<CodeState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const token = String(fd.get("token") ?? "").replace(/\s/g, "");
  const supabase = await createClient();

  if (!token) {
    if (email === ADMIN_EMAIL) {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      // Админы имэйл дээр л бодит алдааг харуулна (өөр имэйлд хариу ижил хэвээр)
      if (error) {
        if (error.code?.startsWith("over_")) return { error: "Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу." };
        if (error.code === "otp_disabled" || error.message.toLowerCase().includes("signups not allowed"))
          return { error: "Supabase дээр шинэ бүртгэл хаалттай байна. Authentication → Sign In / Providers дээр \"Allow new users to sign up\"-ийг түр асаагаад дахин оролдоно уу." };
        return { error: `Код илгээж чадсангүй: ${error.message}. Supabase-ийн SMTP тохиргоог шалгана уу.` };
      }
    }
    return { step: "code", email };
  }

  if (email !== ADMIN_EMAIL) return { step: "code", email, error: "Код буруу эсвэл хугацаа дууссан байна." };
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "Код буруу эсвэл хугацаа дууссан байна." };
  redirect("/admin/dashboard");
}

export async function decidePayment(id: string, approve: boolean) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/admin/login");
  const { data: list } = await supabase.rpc("admin_payments");
  const row = (list as { id: string; requester_email: string | null; tenant_name: string; tenant_slug: string }[] | null)?.find(r => r.id === id);
  const { error } = await supabase.rpc("admin_decide_payment", { p_id: id, p_approve: approve });
  revalidatePath("/admin/dashboard");
  if (error || !row?.requester_email) return;
  await sendPush(row.requester_email, {
    title: approve ? "Төлбөр баталгаажлаа ✓" : "Төлбөрийн хүсэлт татгалзагдлаа",
    body: approve ? `${row.tenant_name} — төлбөртэй багц идэвхжлээ` : `${row.tenant_name} — гүйлгээг шалгаад дахин илгээнэ үү`,
    url: tenantUrl(row.tenant_slug, "/billing"),
  });
  await sendMail(
    row.requester_email,
    approve ? "hhk.mn — төлбөр баталгаажлаа" : "hhk.mn — төлбөрийн хүсэлт татгалзагдлаа",
    approve
      ? `<p>${row.tenant_name} (${row.tenant_slug}.hhk.mn) компанийн төлбөртэй багц идэвхжлээ. Баярлалаа!</p>`
      : `<p>${row.tenant_name} компанийн төлбөрийн хүсэлтийг баталгаажуулж чадсангүй — гүйлгээ олдоогүй байж болзошгүй. Гүйлгээний утгыг (${row.tenant_slug}.hhk.mn) шалгаад дахин хүсэлт илгээнэ үү.</p>`,
  );
}

export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ── Нүүр хуудасны баннер ──
const BANNER_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export type BannerState = { error?: string; message?: string };

export async function saveBanner(_: BannerState, fd: FormData): Promise<BannerState> {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/admin/login");

  const { data: cur } = await supabase.from("platform_settings").select("value").eq("key", "banner").maybeSingle();
  const prev = (cur?.value ?? {}) as { path?: string };
  let path = prev.path ?? "";

  const file = fd.get("file");
  if (file instanceof File && file.size) {
    const ext = BANNER_EXT[file.type];
    if (!ext) return { error: "PNG, JPG эсвэл WEBP зураг оруулна уу." };
    if (file.size > 5 * 1024 * 1024) return { error: "Зураг 5MB-аас бага байх ёстой." };
    const next = `banner/banner-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("platform").upload(next, file, { contentType: file.type });
    if (up.error) return { error: `Зураг хадгалж чадсангүй: ${up.error.message}. 007_platform.sql ажилласан эсэхийг шалгана уу.` };
    if (path) await supabase.storage.from("platform").remove([path]);
    path = next;
  }
  if (!path) return { error: "Баннерын зургаа сонгоно уу." };

  const link = String(fd.get("link") ?? "").trim();
  if (link && !/^(https?:\/\/|\/)/.test(link)) return { error: "Холбоос https:// эсвэл / -ээр эхэлнэ." };
  const value = { path, link, alt: String(fd.get("alt") ?? "").trim().slice(0, 200), enabled: fd.get("enabled") === "on" };
  const { error } = await supabase.from("platform_settings").upsert({ key: "banner", value, updated_at: new Date().toISOString() });
  if (error) return { error: `Хадгалж чадсангүй: ${error.message}` };
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  return { message: "✓ Хадгалагдлаа. Нүүр хуудсанд шууд харагдана." };
}

export async function removeBanner() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/admin/login");
  const { data: cur } = await supabase.from("platform_settings").select("value").eq("key", "banner").maybeSingle();
  const path = (cur?.value as { path?: string } | undefined)?.path;
  if (path) await supabase.storage.from("platform").remove([path]);
  await supabase.from("platform_settings").delete().eq("key", "banner");
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
}
