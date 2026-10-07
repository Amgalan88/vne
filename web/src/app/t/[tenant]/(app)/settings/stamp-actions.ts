"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StampState = { error?: string; message?: string };

export type AssetKind = "logo" | "stamp" | "signature";
const COLUMN = { logo: "logo_path", stamp: "stamp_path", signature: "signature_path" } as const;
const BUCKET = { logo: "assets", stamp: "stamps", signature: "stamps" } as const;
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_BYTES = 2 * 1024 * 1024;

const refresh = () => {
  revalidatePath("/t/[tenant]/settings", "page");
  revalidatePath("/t/[tenant]/documents", "layout");
};

// Эрх, PIN шалгалтыг Postgres (RLS, trigger, функцүүд) хийнэ — энд зөвхөн дамжуулж, алдааг ойлгомжтой болгоно
function explain(e: { code?: string; message: string }): string {
  if (e.message.includes("PIN") || e.code === "42501") return "Эхлээд тамганы PIN-ээ оруулж нээнэ үү (эсвэл эрх хүрэлцэхгүй байна).";
  if (e.code === "HK402") return e.message;
  return e.message;
}

export async function uploadAsset(tenantId: string, issuerId: string, kind: AssetKind, fd: FormData): Promise<StampState> {
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Зургаа сонгоно уу." };
  const ext = EXT[file.type];
  if (!ext) return { error: "PNG, JPG эсвэл WEBP зураг оруулна уу." };
  if (file.size > MAX_BYTES) return { error: "Зураг 2MB-аас бага байх ёстой." };

  const supabase = await createClient();
  const col = COLUMN[kind];
  const { data: before } = await supabase
    .from("issuers")
    .select("id, " + col)
    .eq("id", issuerId)
    .eq("tenant_id", tenantId)
    .maybeSingle<Record<string, string | null>>();
  if (!before) return { error: "Байгууллага олдсонгүй." };

  const path = `${tenantId}/${issuerId}/${kind}-${Date.now()}.${ext}`;
  const up = await supabase.storage.from(BUCKET[kind]).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { error: explain(up.error) };

  const upd = await supabase.from("issuers").update({ [col]: path }).eq("id", issuerId).eq("tenant_id", tenantId).select("id").single();
  if (upd.error) {
    await supabase.storage.from(BUCKET[kind]).remove([path]);
    return { error: explain(upd.error) };
  }
  const old = before[col];
  if (old) await supabase.storage.from(BUCKET[kind]).remove([old]);
  refresh();
  return { message: "✓ Хадгалагдлаа" };
}

export async function removeAsset(tenantId: string, issuerId: string, kind: AssetKind): Promise<StampState> {
  const supabase = await createClient();
  const col = COLUMN[kind];
  const { data: before } = await supabase
    .from("issuers")
    .select("id, " + col)
    .eq("id", issuerId)
    .eq("tenant_id", tenantId)
    .maybeSingle<Record<string, string | null>>();
  if (!before) return { error: "Байгууллага олдсонгүй." };
  const upd = await supabase.from("issuers").update({ [col]: null }).eq("id", issuerId).eq("tenant_id", tenantId).select("id").single();
  if (upd.error) return { error: explain(upd.error) };
  if (before[col]) await supabase.storage.from(BUCKET[kind]).remove([before[col]!]);
  refresh();
  return { message: "✓ Устгагдлаа" };
}

const MODES = ["on", "pin", "off"];

export async function saveModes(tenantId: string, issuerId: string, stampMode: string, sigMode: string): Promise<StampState> {
  if (!MODES.includes(stampMode) || !MODES.includes(sigMode)) return { error: "Буруу горим." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("issuers")
    .update({ stamp_mode: stampMode, sig_mode: sigMode })
    .eq("id", issuerId)
    .eq("tenant_id", tenantId)
    .select("id")
    .single();
  if (error) return { error: explain(error) };
  refresh();
  return { message: "✓ Хадгалагдлаа" };
}

/** PIN-ээр нээнэ — 15 минут. 5 удаа буруу бол 15 минут түгжинэ (verify_stamp_pin) */
export async function unlockStamp(issuerId: string, pin: string): Promise<StampState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_stamp_pin", { p_issuer: issuerId, p_pin: pin });
  if (error) return { error: error.code === "42501" ? "Эрх хүрэлцэхгүй байна." : error.message };
  if (!data?.ok) {
    return {
      error:
        data?.error === "locked"
          ? "Хэт олон буруу оролдлоо. 15 минутын дараа дахин оролдоно уу."
          : `PIN буруу байна. Үлдсэн оролдлого: ${data?.left ?? 0}`,
    };
  }
  refresh();
  return { message: "🔓 15 минут нээгдлээ" };
}

export async function lockStamp(issuerId: string): Promise<StampState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("lock_stamp", { p_issuer: issuerId });
  if (error) return { error: error.message };
  refresh();
  return { message: "🔒 Түгжигдлээ" };
}

export async function setPin(issuerId: string, pin: string): Promise<StampState> {
  if (!/^[0-9]{4,6}$/.test(pin)) return { error: "PIN нь 4–6 оронтой тоо байна." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_stamp_pin", { p_issuer: issuerId, p_new_pin: pin });
  if (error) return { error: error.code === "HK402" ? error.message : explain(error) };
  refresh();
  return { message: "✓ PIN тохирууллаа" };
}

export async function resetPin(issuerId: string): Promise<StampState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_stamp_pin", { p_issuer: issuerId });
  if (error) return { error: error.message };
  refresh();
  return { message: "✓ PIN устгагдлаа. Шинээр тохируулна уу." };
}
