import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { canEdit, canManage, type DocType } from "@/lib/types";
import { emptyFields, type DocFields, type DocState } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import { DocumentEditor } from "../editor";
import { loadEditorData } from "../load";

export const metadata: Metadata = { title: "Шинэ баримт" };

const TYPES: DocType[] = ["quote", "invoice", "dispatch", "letter"];

export default async function NewDocumentPage({ params, searchParams }: PageProps<"/t/[tenant]/documents/new">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!canEdit(role)) redirect("/documents");

  const { issuers, customers, assets, recentDocs } = await loadEditorData(tenant.id);
  const sp = await searchParams;
  const type = sp.type;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });

  // ?from=<id> — өмнөх баримтыг хуулж шинэ ноорог үүсгэнэ (дугаар, огноо шинэчлэгдэнэ)
  let copy: DocState | null = null;
  if (typeof sp.from === "string" && /^[0-9a-f-]{36}$/.test(sp.from)) {
    const supabase = await createClient();
    const { data: src } = await supabase
      .from("documents")
      .select("doc_type, issuer_id, customer_name, data")
      .eq("id", sp.from)
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .maybeSingle<{ doc_type: DocType; issuer_id: string; customer_name: string; data: Partial<DocFields> }>();
    if (src) {
      copy = {
        ...emptyFields(),
        ...src.data,
        rows: src.data.rows?.length ? src.data.rows : emptyFields().rows,
        id: null,
        // ?type=... — үнийн саналаас нэхэмжлэх, зарлагын баримт гэх мэт өөр төрөл болгон хөрвүүлнэ
        docType:
          TYPES.includes(type as DocType) && type !== "letter" && src.doc_type !== "letter" ? (type as DocType) : src.doc_type,
        issuerId: src.issuer_id,
        number: "",
        docDate: today,
        customerName: src.customer_name,
        status: "draft",
      };
    }
  }
  const first = issuers[0];
  // Өмнөх ижил төрлийн баримтаас давтагддаг талбаруудыг (гарын үсэг зурагч нар, НӨАТ, төлөх хугацаа…) санаж бөглөнө
  const docType = TYPES.includes(type as DocType) ? (type as DocType) : "invoice";
  let remembered: Partial<DocFields> = {};
  if (!copy) {
    const supabase = await createClient();
    const { data: last } = await supabase
      .from("documents")
      .select("data")
      .eq("tenant_id", tenant.id)
      .eq("doc_type", docType)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ data: Partial<DocFields> }>();
    const d = last?.data ?? {};
    const keep = ["director", "receiver", "accountant", "carrier", "issuerName", "receiverName", "accountantName", "position", "signName", "vatMode", "payDue", "note"] as const;
    remembered = Object.fromEntries(keep.filter(k => d[k]).map(k => [k, d[k]]));
  }

  const initial: DocState = copy ?? {
    ...emptyFields(first?.director ?? ""),
    ...remembered,
    id: null,
    docType,
    issuerId: first?.id ?? "",
    number: "",
    docDate: today,
    customerName: "",
    status: "draft",
  };

  return (
    <DocumentEditor
      tenantId={tenant.id}
      issuers={issuers}
      customers={customers}
      assets={assets}
      recentDocs={recentDocs}
      initial={initial}
      canEdit
      canDelete={canManage(role)}
    />
  );
}
