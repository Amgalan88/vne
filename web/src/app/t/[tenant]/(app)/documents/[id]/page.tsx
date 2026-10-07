import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Гаргахдаа тамга дарсан баримт (012) — PIN одоо хаалттай байсан ч тамга, гарын үсгийг харуулна
  const { data: st } = await supabase.from("documents").select("stamped_at").eq("id", id).maybeSingle<{ stamped_at: string | null }>();
  const a = assets[doc.issuer_id];
  if (st?.stamped_at && doc.status !== "draft" && a?.locked) {
    const admin = createAdminClient();
    const { data: iss } = await supabase
      .from("issuers")
      .select("stamp_path, signature_path, stamp_mode, sig_mode")
      .eq("id", doc.issuer_id)
      .maybeSingle<{ stamp_path: string | null; signature_path: string | null; stamp_mode: string; sig_mode: string }>();
    const sign = async (path: string | null, mode?: string) => {
      if (!admin || !path || mode === "off") return null;
      const { data } = await admin.storage.from("stamps").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    };
    if (iss) {
      const [stamp, signature] = await Promise.all([sign(iss.stamp_path, iss.stamp_mode), sign(iss.signature_path, iss.sig_mode)]);
      assets[doc.issuer_id] = { ...a, stamp: a.stamp ?? stamp, signature: a.signature ?? signature };
    }
  }
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
