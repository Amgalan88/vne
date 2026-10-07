import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Issuer } from "@/lib/documents";
import { loadIssuerAssets } from "@/lib/assets";
import type { CustomerOption, RecentDoc } from "./editor";

/** Засварлагчид хэрэгтэй байгууллага, харилцагчдын жагсаалт */
export async function loadEditorData(tenantId: string) {
  const supabase = await createClient();
  const [{ data: issuers }, { data: customers }, assets, { data: recent }] = await Promise.all([
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
    loadIssuerAssets(supabase, tenantId),
    // «Өмнөх баримтаас татах»-д: сүүлийн 50 баримт (албан бичгээс бусад)
    supabase
      .from("documents")
      .select("id, doc_type, number, customer_name, doc_date, total")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("doc_type", "letter")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<RecentDoc[]>(),
  ]);
  return { issuers: issuers ?? [], customers: customers ?? [], assets, recentDocs: recent ?? [] };
}
