"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rootUrl } from "@/lib/hosts";
import { docTotal, filledRows, formatDocNumber, type DocState } from "@/lib/documents";
import type { DocStatus, DocType } from "@/lib/types";

export type SaveResult = { id?: string; number?: string; error?: string; upgrade?: boolean };

const TYPES: DocType[] = ["quote", "invoice", "dispatch", "letter"];
const STATUSES: DocStatus[] = ["draft", "issued", "paid", "cancelled"];
const clip = (v: unknown, max = 2000) => String(v ?? "").slice(0, max);

/**
 * Баримт хадгалах. Эрх, үнэгүй багцын хязгаар, өөр компанийн байгууллагыг заах зэргийг Postgres шалгана.
 * Дугааргүй бол байгууллага × төрөл × оноор автоматаар олгоно.
 */
export async function saveDocument(tenantId: string, s: DocState): Promise<SaveResult> {
  if (!TYPES.includes(s.docType) || !STATUSES.includes(s.status)) return { error: "Мэдээлэл буруу байна." };
  if (!s.issuerId) return { error: "Баримт гаргагч байгууллагаа сонгоно уу." };
  if (s.rows.length > 300) return { error: "Нэг баримтад 300-аас олон мөр байж болохгүй." };

  const supabase = await createClient();
  let number = clip(s.number, 40).trim();
  if (!number) {
    const { data, error } = await supabase.rpc("next_doc_number", { p_issuer: s.issuerId, p_doc_type: s.docType });
    if (error) return { error: "Дугаар олгож чадсангүй: " + error.message };
    number = formatDocNumber(s.docType, data as number);
  }

  const rows = filledRows(s.rows).map(r => ({
    name: clip(r.name, 500),
    unit: clip(r.unit, 30),
    qty: Number(r.qty) || 0,
    price: Number(r.price) || 0,
  }));
  const { id: _id, docType, issuerId, number: _n, docDate, customerName, status, rows: _r, ...fields } = s;
  void _id; void _n; void _r;
  const data = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, typeof v === "string" ? clip(v, 10000) : v]));

  const record = {
    tenant_id: tenantId,
    issuer_id: issuerId,
    doc_type: docType,
    number,
    doc_date: docDate || new Date().toISOString().slice(0, 10),
    customer_name: clip(customerName, 300),
    total: docTotal(rows),
    status,
    data: { ...data, rows },
  };

  const res = s.id
    ? await supabase.from("documents").update(record).eq("id", s.id).eq("tenant_id", tenantId).select("id").single()
    : await supabase.from("documents").insert(record).select("id").single();

  if (res.error) {
    if (res.error.code === "HK402") return { error: res.error.message, upgrade: true };
    if (res.error.code === "HK423") return { error: res.error.message };
    if (res.error.code === "23505") return { error: `${number} дугаартай баримт аль хэдийн байна. Өөр дугаар оруулна уу.` };
    if (res.error.code === "42501" || res.error.code === "PGRST116") return { error: "Баримт засах эрх хүрэлцэхгүй байна." };
    return { error: "Хадгалж чадсангүй: " + res.error.message };
  }

  // Шинэ харилцагчийг жагсаалтад нэмнэ — дараагийн удаа автоматаар бөглөгдөнө
  if (record.customer_name && docType !== "letter") {
    const { data: existing } = await supabase
      .from("customers").select("id").eq("tenant_id", tenantId).eq("name", record.customer_name).is("deleted_at", null).maybeSingle();
    const info = { rd: clip(s.custRD, 50), address: clip(s.custAddress, 500), phone: clip(s.custPhone, 50), email: clip(s.custEmail, 200) };
    if (existing) {
      const filled = Object.fromEntries(Object.entries(info).filter(([, v]) => v));
      if (Object.keys(filled).length) await supabase.from("customers").update(filled).eq("id", existing.id);
    } else {
      await supabase.from("customers").insert({ tenant_id: tenantId, name: record.customer_name, ...info });
    }
  }

  revalidatePath("/t/[tenant]/documents", "page");
  return { id: res.data.id, number };
}

export async function deleteDocument(tenantId: string, id: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) return { error: error.code === "42501" ? "Устгах эрх хүрэлцэхгүй байна." : error.message };
  revalidatePath("/t/[tenant]/documents", "page");
  return {};
}

/** Баримтыг холбоосоор хуваалцах / холбоосыг хаах. Холбоостой хэн ч нэвтрэлгүй харж, PDF татна. */
export async function shareDocument(tenantId: string, id: string, enable: boolean): Promise<{ url?: string | null; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("share_document", { p_id: id, p_enable: enable });
  if (error) return { error: error.code === "PGRST202" ? "Эхлээд supabase/010_v2.sql-ийг Run хийнэ үү." : error.code === "42501" ? "Эрх хүрэлцэхгүй байна." : error.message };
  revalidatePath("/t/[tenant]/documents/[id]", "page");
  void tenantId;
  return { url: data ? rootUrl(`/d/${data}`) : null };
}

/** «Өмнөх баримтаас татах» — бараа, харилцагчийн мэдээллийг авна (эрхийг RLS шалгана) */
export async function loadDocForImport(tenantId: string, id: string): Promise<{ customerName: string; data: Partial<DocState> } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("customer_name, data")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle<{ customer_name: string; data: Partial<DocState> }>();
  return data ? { customerName: data.customer_name, data: data.data } : null;
}

/** Гаргасан (түгжээтэй) баримтын зөвхөн төлвийг солино: гаргасан → төлөгдсөн / цуцалсан */
export async function setDocStatus(tenantId: string, id: string, status: DocStatus): Promise<SaveResult> {
  if (!["issued", "paid", "cancelled"].includes(status)) return { error: "Буруу төлөв." };
  const supabase = await createClient();
  const { error } = await supabase.from("documents").update({ status }).eq("id", id).eq("tenant_id", tenantId);
  if (error) return { error: error.code === "42501" ? "Эрх хүрэлцэхгүй байна." : error.message };
  revalidatePath("/t/[tenant]/documents", "layout");
  return { id };
}

/** Эзэмшигч/админ: гаргасан баримтыг шалтгаантайгаар засахаар нээнэ (ноорог болж, тамга түр алга болно) */
export async function unlockDocument(tenantId: string, id: string, reason: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unlock_document", { p_id: id, p_reason: reason });
  if (error) {
    if (error.code === "PGRST202") return { error: "Эхлээд supabase/011_document_lock.sql-ийг Run хийнэ үү." };
    return { error: error.message };
  }
  revalidatePath("/t/[tenant]/documents", "layout");
  void tenantId;
  return { id };
}
