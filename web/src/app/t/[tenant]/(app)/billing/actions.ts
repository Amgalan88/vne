"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PayState = { error?: string; sent?: boolean };

// Эрхийг Postgres-ийн request_payment() шалгана (supabase/004_payments.sql)
export async function requestPayment(tenantId: string, _: PayState, fd: FormData): Promise<PayState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_payment", { p_tenant: tenantId, p_months: Number(fd.get("months")) });
  if (error) return { error: error.code === "42501" ? "Зөвхөн компанийн эзэмшигч, админ хүсэлт илгээнэ." : error.message };
  revalidatePath("/t/[tenant]/billing", "page");
  return { sent: true };
}
