import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Issuer } from "@/lib/documents";
import type { CustomerOption } from "./editor";

/** Засварлагчид хэрэгтэй байгууллага, харилцагчдын жагсаалт */
export async function loadEditorData(tenantId: string) {
  const supabase = await createClient();
  const [{ data: issuers }, { data: customers }] = await Promise.all([
    supabase
      .from("issuers")
      .select("id, name, address, rd, phone, email, bank, account, director")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at")
      .returns<Issuer[]>(),
    supabase
      .from("customers")
      .select("name, rd, address, phone, email")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name")
      .limit(500)
      .returns<CustomerOption[]>(),
  ]);
  return { issuers: issuers ?? [], customers: customers ?? [] };
}
