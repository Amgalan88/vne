"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Тайлангаас нэхэмжлэхийг «Төлөгдсөн» болгоно (эрхийг RLS шалгана) */
export async function markPaid(tenantId: string, id: string) {
  const supabase = await createClient();
  await supabase.from("documents").update({ status: "paid" }).eq("id", id).eq("tenant_id", tenantId);
  revalidatePath("/t/[tenant]/reports", "page");
  revalidatePath("/t/[tenant]/documents", "page");
}
