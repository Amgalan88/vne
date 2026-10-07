import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { canEdit, canManage, type DocStatus, type DocType } from "@/lib/types";
import { emptyFields, type DocFields, type DocState } from "@/lib/documents";
import { DocumentEditor } from "../editor";
import { rootUrl } from "@/lib/hosts";
import { loadEditorData } from "../load";

export const metadata: Metadata = { title: "Баримт" };

type DocRow = {
  id: string;
  doc_type: DocType;
  issuer_id: string;
  number: string;
  doc_date: string;
  customer_name: string;
  status: DocStatus;
  data: Partial<DocFields>;
};

export default async function DocumentPage({ params }: PageProps<"/t/[tenant]/documents/[id]">) {
  const { tenant: slug, id } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, doc_type, issuer_id, number, doc_date, customer_name, status, data")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .maybeSingle<DocRow>();
  if (!doc) notFound();

  const { issuers, customers, assets, recentDocs } = await loadEditorData(tenant.id);
  // 010_v2.sql ажиллаагүй бол багана байхгүй — алдааг үл тоож холбоосгүй гэж үзнэ
  const { data: share } = await supabase.from("documents").select("share_token").eq("id", id).maybeSingle<{ share_token: string | null }>();
  const shareUrl = share?.share_token ? rootUrl(`/d/${share.share_token}`) : null;
  const initial: DocState = {
    ...emptyFields(),
    ...doc.data,
    id: doc.id,
    docType: doc.doc_type,
    issuerId: doc.issuer_id,
    number: doc.number,
    docDate: doc.doc_date,
    customerName: doc.customer_name,
    status: doc.status,
  };
  if (!initial.rows?.length) initial.rows = emptyFields().rows;

  return (
    <DocumentEditor
      tenantId={tenant.id}
      issuers={issuers}
      customers={customers}
      assets={assets}
      recentDocs={recentDocs}
      initial={initial}
      canEdit={canEdit(role)}
      canDelete={canManage(role)}
      shareUrl={shareUrl}
    />
  );
}
