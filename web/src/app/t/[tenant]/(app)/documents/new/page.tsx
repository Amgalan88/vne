import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { canEdit, canManage, type DocType } from "@/lib/types";
import { emptyFields, type DocState } from "@/lib/documents";
import { DocumentEditor } from "../editor";
import { loadEditorData } from "../load";

export const metadata: Metadata = { title: "Шинэ баримт" };

const TYPES: DocType[] = ["quote", "invoice", "dispatch", "letter"];

export default async function NewDocumentPage({ params, searchParams }: PageProps<"/t/[tenant]/documents/new">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  if (!canEdit(role)) redirect("/documents");

  const { issuers, customers, assets } = await loadEditorData(tenant.id);
  const type = (await searchParams).type;
  const first = issuers[0];
  const initial: DocState = {
    ...emptyFields(first?.director ?? ""),
    id: null,
    docType: TYPES.includes(type as DocType) ? (type as DocType) : "invoice",
    issuerId: first?.id ?? "",
    number: "",
    docDate: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" }),
    customerName: "",
    status: "draft",
  };

  return (
    <DocumentEditor
      tenantId={tenant.id}
      issuers={issuers}
      customers={customers}
      assets={assets}
      initial={initial}
      canEdit
      canDelete={canManage(role)}
    />
  );
}
