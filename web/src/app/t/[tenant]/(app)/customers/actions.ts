"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CustomerState = { error?: string; message?: string };

const FIELDS = ["name", "rd", "address", "phone", "email", "note"] as const;
const refresh = () => {
  revalidatePath("/t/[tenant]/customers", "page");
  revalidatePath("/t/[tenant]/documents", "layout");
};

// Эрхийг RLS шалгана: нэмэх/засах — owner, admin, staff; устгах — owner, admin
export async function saveCustomer(tenantId: string, id: string | null, _: CustomerState, fd: FormData): Promise<CustomerState> {
  const values = Object.fromEntries(FIELDS.map(f => [f, String(fd.get(f) ?? "").trim().slice(0, 500)]));
  if (!values.name) return { error: "Харилцагчийн нэрийг оруулна уу." };
  const supabase = await createClient();
  const res = id
    ? await supabase.from("customers").update(values).eq("id", id).eq("tenant_id", tenantId).select("id").single()
    : await supabase.from("customers").insert({ tenant_id: tenantId, ...values }).select("id").single();
  if (res.error) return { error: res.error.code === "42501" || res.error.code === "PGRST116" ? "Эрх хүрэлцэхгүй байна." : res.error.message };
  refresh();
  return { message: id ? "✓ Хадгалагдлаа" : "✓ Нэмэгдлээ" };
}

export async function deleteCustomer(tenantId: string, id: string) {
  const supabase = await createClient();
  // Баримтууд харилцагчийг заадаг тул бүр мөсөн биш, нуух (deleted_at)
  await supabase.from("customers").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("tenant_id", tenantId);
  refresh();
}
