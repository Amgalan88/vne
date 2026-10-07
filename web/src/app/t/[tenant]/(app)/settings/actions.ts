"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type IssuerState = { error?: string; message?: string; upgrade?: boolean };

const FIELDS = ["name", "address", "rd", "phone", "email", "bank", "account", "director"] as const;

/** Баримт гаргагч байгууллагын мэдээлэл — owner/admin (RLS шалгана). issuerId хоосон бол шинээр нэмнэ. */
export async function saveIssuer(tenantId: string, issuerId: string | null, _: IssuerState, fd: FormData): Promise<IssuerState> {
  const values = Object.fromEntries(FIELDS.map(f => [f, String(fd.get(f) ?? "").trim().slice(0, 500)]));
  if (!values.name) return { error: "Байгууллагын нэрээ оруулна уу." };

  const supabase = await createClient();
  const res = issuerId
    ? await supabase.from("issuers").update(values).eq("id", issuerId).eq("tenant_id", tenantId).select("id").single()
    : await supabase.from("issuers").insert({ tenant_id: tenantId, ...values }).select("id").single();
  if (res.error) {
    if (res.error.code === "HK402") return { error: res.error.message, upgrade: true };
    return { error: res.error.code === "PGRST116" || res.error.code === "42501" ? "Засах эрх хүрэлцэхгүй байна." : res.error.message };
  }
  revalidatePath("/t/[tenant]/settings", "page");
  return { message: issuerId ? "✓ Хадгалагдлаа" : "✓ Шинэ байгууллага нэмэгдлээ" };
}
