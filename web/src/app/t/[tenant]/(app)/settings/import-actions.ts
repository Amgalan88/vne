"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ImportDoc } from "@/lib/legacy";

export type ImportResult = { error?: string; message?: string };

export async function importLegacy(tenantId: string, issuerId: string, docs: ImportDoc[], customers: string[]): Promise<ImportResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_legacy", { p_tenant: tenantId, p_issuer: issuerId, p_docs: docs, p_customers: customers });
  if (error) {
    if (error.code === "PGRST202") return { error: "Импорт хийхийн тулд эхлээд supabase/010_v2.sql-ийг Run хийнэ үү." };
    return { error: error.code === "42501" ? "Зөвхөн эзэмшигч, админ импортлоно." : error.message };
  }
  revalidatePath("/t/[tenant]/documents", "layout");
  revalidatePath("/t/[tenant]/customers", "page");
  const r = data as { documents: number; customers: number };
  const skipped = docs.length - r.documents;
  return {
    message: `✓ ${r.documents} баримт, ${r.customers} харилцагч орлоо.${skipped > 0 ? ` ${skipped} баримт аль хэдийн байсан тул алгаслаа.` : ""}`,
  };
}
