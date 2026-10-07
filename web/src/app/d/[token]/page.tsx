import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyFields, type DocFields, type DocState, type Issuer } from "@/lib/documents";
import { DOC_TYPE_LABEL, type DocStatus, type DocType } from "@/lib/types";
import type { AssetUrls } from "@/lib/asset-types";
import { fmtMoney } from "@/lib/format";
import { DocumentSheet } from "@/components/sheets";
import { PdfButton } from "@/components/pdf-button";
import { PrintButton } from "./print-button";
import { LogoMark } from "@/components/logo";
import { rootUrl } from "@/lib/hosts";

/* hhk.mn/d/{token} — харилцагчид илгээсэн баримт. Нэвтрэлгүй харж, PDF татна. */

type Shared = {
  doc: { id: string; doc_type: DocType; number: string; doc_date: string; customer_name: string; status: DocStatus; data: Partial<DocFields>; total: number };
  issuer: Issuer;
  assets: { logo_path: string | null; stamp_path: string | null; signature_path: string | null };
  tenant: { name: string; slug: string };
};

export const metadata: Metadata = { title: "Баримт", robots: { index: false, follow: false } };

async function load(token: string): Promise<Shared | null> {
  if (!/^[0-9a-f-]{36}$/.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_document", { p_token: token });
  return (data as Shared | null) ?? null;
}

/** Хаалттай bucket-ийн зургийг service-role-оор түр (1 цаг) нээнэ. Түлхүүргүй бол зураггүй харуулна. */
async function signAssets(a: Shared["assets"]): Promise<AssetUrls> {
  const admin = createAdminClient();
  const sign = async (bucket: string, path: string | null) => {
    if (!admin || !path) return null;
    const { data } = await admin.storage.from(bucket).createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };
  const [logo, stamp, signature] = await Promise.all([sign("assets", a.logo_path), sign("stamps", a.stamp_path), sign("stamps", a.signature_path)]);
  return { logo, stamp, signature, locked: false };
}

export default async function SharedDocumentPage({ params }: PageProps<"/d/[token]">) {
  const { token } = await params;
  const shared = await load(token);
  if (!shared) notFound();
  const { doc, issuer, tenant } = shared;
  const assets = await signAssets(shared.assets);

  const s: DocState = {
    ...emptyFields(),
    ...doc.data,
    id: doc.id,
    docType: doc.doc_type,
    issuerId: issuer.id,
    number: doc.number,
    docDate: doc.doc_date,
    customerName: doc.customer_name,
    status: doc.status,
  };
  if (!s.rows?.length) s.rows = emptyFields().rows;
  const title = `${DOC_TYPE_LABEL[doc.doc_type]} ${doc.number}`;

  return (
    <div className="flex-1 bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-bold">{title}</p>
            <p className="text-xs text-slate-500">
              {issuer.name}
              {doc.doc_type !== "letter" && <> · <b className="text-slate-700">{fmtMoney(doc.total)} ₮</b></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PdfButton targetId="shared-sheet" filename={title} />
            <PrintButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl overflow-x-auto px-4 py-6 print:p-0">
        <div id="shared-sheet" className="[zoom:0.45] sm:[zoom:0.8] lg:[zoom:1]">
          <DocumentSheet s={s} issuer={issuer} assets={assets} />
        </div>
      </main>
      <footer className="pb-8 text-center text-xs text-slate-400 print:hidden">
        <a href={rootUrl()} className="inline-flex items-center gap-1.5 hover:text-slate-600">
          <LogoMark className="h-4 w-4" /> {tenant.name} · HHK.MN-ээр үүсгэсэн баримт
        </a>
      </footer>
    </div>
  );
}
