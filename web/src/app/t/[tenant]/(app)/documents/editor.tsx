"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { DocumentSheet } from "@/components/sheets";
import { buttonClass, Card, Field, Input, Notice, Select } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import { toWordsMn } from "@/lib/money";
import { docTotal, emptyRow, rowAmount, type DocState, type Issuer, type Row } from "@/lib/documents";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, type DocStatus, type DocType } from "@/lib/types";
import type { AssetUrls } from "@/lib/asset-types";
import { deleteDocument, loadDocForImport, saveDocument, type SaveResult } from "./actions";
import { StampUnlock } from "./stamp-unlock";
import { ShareLink } from "./share-link";
import { PdfButton } from "@/components/pdf-button";

export type CustomerOption = { name: string; rd: string; address: string; phone: string; email: string };
export type RecentDoc = { id: string; doc_type: DocType; number: string; customer_name: string; doc_date: string; total: number };

const TYPES: DocType[] = ["quote", "invoice", "dispatch", "letter"];

const textarea =
  "w-full rounded-lg border-[1.5px] border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500";

export function DocumentEditor({
  tenantId,
  issuers,
  customers,
  assets,
  recentDocs = [],
  initial,
  canEdit,
  canDelete,
  shareUrl = null,
}: {
  tenantId: string;
  issuers: Issuer[];
  customers: CustomerOption[];
  assets: Record<string, AssetUrls>;
  recentDocs?: RecentDoc[];
  initial: DocState;
  canEdit: boolean;
  canDelete: boolean;
  shareUrl?: string | null;
}) {
  const router = useRouter();
  const [s, setS] = useState<DocState>(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, startTransition] = useTransition();
  // Утсан дээр засах, харах хоёрыг шилжүүлж харуулна (том дэлгэц дээр зэрэг харагдана)
  const [view, setView] = useState<"edit" | "preview">("edit");

  const issuer = issuers.find(i => i.id === s.issuerId) ?? issuers[0];
  const issuerAssets = issuer ? assets[issuer.id] : undefined;
  const total = docTotal(s.rows);
  const isLetter = s.docType === "letter";

  const set = <K extends keyof DocState>(key: K, value: DocState[K]) => {
    setS(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setResult(null);
  };
  const setRow = (i: number, patch: Partial<Row>) =>
    set("rows", s.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // Өмнөх харилцагчийг сонгоход хоосон талбаруудыг бөглөнө
  const pickCustomer = (name: string) => {
    const c = customers.find(x => x.name === name);
    setS(prev => ({
      ...prev,
      customerName: name,
      ...(c && {
        custRD: prev.custRD || c.rd,
        custAddress: prev.custAddress || c.address,
        custPhone: prev.custPhone || c.phone,
        custEmail: prev.custEmail || c.email,
      }),
    }));
    setDirty(true);
    setResult(null);
  };

  // Өмнөх баримтаас бараа, харилцагчийг татна — хоосон талбаруудыг бөглөж, барааны жагсаалтыг солино
  const [importing, startImport] = useTransition();
  const importFrom = (id: string) =>
    startImport(async () => {
      const src = await loadDocForImport(tenantId, id);
      if (!src) return;
      const d = src.data;
      const rows = (d.rows ?? []).filter(r => r.name || r.price);
      setS(prev => {
        const keepRows = prev.rows.some(r => r.name.trim() || r.price);
        return {
          ...prev,
          rows: rows.length ? (keepRows ? [...prev.rows.filter(r => r.name.trim() || r.price), ...rows] : rows) : prev.rows,
          customerName: prev.customerName || src.customerName,
          custRD: prev.custRD || d.custRD || "",
          custAddress: prev.custAddress || d.custAddress || "",
          custPhone: prev.custPhone || d.custPhone || "",
          custEmail: prev.custEmail || d.custEmail || "",
          contractNo: prev.contractNo || d.contractNo || "",
          payDue: prev.payDue || d.payDue || "",
          note: prev.note || d.note || "",
        };
      });
      setDirty(true);
      setResult(null);
    });

  const save = () =>
    startTransition(async () => {
      const r = await saveDocument(tenantId, s);
      setResult(r);
      if (r.id) {
        setS(prev => ({ ...prev, id: r.id!, number: r.number ?? prev.number }));
        setDirty(false);
        // Хуудсыг дахин ачаалалгүйгээр хаягийг шинэчилнэ
        if (!s.id) window.history.replaceState(null, "", `/documents/${r.id}`);
      }
    });

  // Ctrl/⌘+S хадгална; хадгалаагүй өөрчлөлттэй хуудас хаахад анхааруулна
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && canEdit) {
        e.preventDefault();
        saveRef.current();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty && canEdit) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, canEdit]);

  const remove = () => {
    if (!s.id || !confirm(`${s.number} баримтыг устгах уу?`)) return;
    startTransition(async () => {
      const r = await deleteDocument(tenantId, s.id!);
      if (r.error) setResult(r);
      else router.push("/documents");
    });
  };

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* ── Засварлах хэсэг ── */}
      <div className="sticky top-0 z-20 -mx-4 flex gap-1 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur print:hidden lg:hidden">
        {(["edit", "preview"] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${view === v ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {v === "edit" ? "✎ Засах" : "👁 Урьдчилж харах"}
          </button>
        ))}
      </div>

      <div className={`w-full space-y-4 print:hidden lg:block lg:w-[400px] lg:shrink-0 ${view === "preview" ? "hidden" : ""}`}>
        <div className="flex items-center justify-between">
          <Link href="/documents" className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            ← Баримтууд
          </Link>
          {dirty && canEdit && <span className="text-xs font-semibold text-amber-600">● Хадгалаагүй</span>}
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1 sm:grid-cols-4 lg:grid-cols-2">
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              disabled={!canEdit || (!!s.id && t !== s.docType)}
              onClick={() => set("docType", t)}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                s.docType === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 enabled:hover:text-slate-800 disabled:opacity-40"
              }`}
            >
              {DOC_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        {issuer && issuerAssets?.locked && <StampUnlock issuerId={issuer.id} />}

        {issuer && !isLetter && !(issuer.rd && (issuer.bank || issuer.account)) && (
          <Notice tone="info">
            Баримтад РД, банк, дансны мэдээлэл гарахгүй байна.{" "}
            <Link href="/settings" className="font-semibold underline">Тохиргоонд бөглөх →</Link>
          </Notice>
        )}

        {canEdit && !isLetter && !s.id && recentDocs.length > 0 && (
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">📥 Өмнөх баримтаас бараа татах</p>
            <Select
              value=""
              disabled={importing}
              onChange={e => e.target.value && importFrom(e.target.value)}
              aria-label="Өмнөх баримт сонгох"
            >
              <option value="">{importing ? "Татаж байна…" : "Баримт сонгох — бараа, харилцагч хуулагдана"}</option>
              {recentDocs.map(d => (
                <option key={d.id} value={d.id}>
                  {DOC_TYPE_LABEL[d.doc_type]} №{d.number} · {d.customer_name || "—"} · {fmtMoney(d.total)}₮
                </option>
              ))}
            </Select>
          </Card>
        )}

        {canEdit && !isLetter && s.id && (
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Энэ баримтаас үүсгэх</p>
            <div className="flex flex-wrap gap-2">
              {(["quote", "invoice", "dispatch"] as DocType[])
                .filter(t => t !== s.docType)
                .map(t => (
                  <button
                    key={t}
                    type="button"
                    disabled={dirty}
                    onClick={() => router.push(`/documents/new?from=${s.id}&type=${t}`)}
                    className={buttonClass("light", "px-3 py-1.5 text-sm")}
                  >
                    → {DOC_TYPE_LABEL[t]}
                  </button>
                ))}
            </div>
            <p className="text-xs text-slate-500">
              {dirty ? "Эхлээд хадгална уу." : "Бараа, харилцагч, үнэ бүгд хуулагдана — дахин шивэх шаардлагагүй."}
            </p>
          </Card>
        )}

        {result?.error && (
          <Notice tone="error">
            {result.error}{" "}
            {result.upgrade && (
              <Link href="/billing" className="font-semibold underline">
                Төлбөртэй багц →
              </Link>
            )}
          </Notice>
        )}
        {result?.id && !dirty && <Notice tone="success">✓ Хадгалагдлаа · {s.number}</Notice>}

        <fieldset disabled={!canEdit} className="space-y-4">
          <Card className="space-y-3 p-4">
            {issuers.length > 1 && (
              <Field label="Баримт гаргагч">
                <Select value={s.issuerId} onChange={e => set("issuerId", e.target.value)}>
                  {issuers.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Дугаар">
                <Input value={s.number} onChange={e => set("number", e.target.value)} placeholder="Автомат" />
              </Field>
              <Field label="Огноо">
                <Input type="date" value={s.docDate} onChange={e => set("docDate", e.target.value)} />
              </Field>
            </div>
            <Field label="Төлөв">
              <Select value={s.status} onChange={e => set("status", e.target.value as DocStatus)}>
                {(Object.keys(DOC_STATUS_LABEL) as DocStatus[]).map(k => (
                  <option key={k} value={k}>{DOC_STATUS_LABEL[k]}</option>
                ))}
              </Select>
            </Field>
          </Card>

          {isLetter ? (
            <Card className="space-y-3 p-4">
              <Field label="Хэнд (албан тушаал, нэр)">
                <Input value={s.customerName} onChange={e => set("customerName", e.target.value)} placeholder="Захирал Б.Болд-д" />
              </Field>
              <Field label="Байгууллага">
                <Input value={s.letterOrg} onChange={e => set("letterOrg", e.target.value)} placeholder="ЖИШЭЭ ХХК" />
              </Field>
              <Field label="Гарчиг">
                <Input value={s.subject} onChange={e => set("subject", e.target.value)} placeholder="Хамтран ажиллах тухай" />
              </Field>
              <Field label="Агуулга">
                <textarea className={`${textarea} min-h-48`} value={s.body} onChange={e => set("body", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Албан тушаал">
                  <Input value={s.position} onChange={e => set("position", e.target.value)} />
                </Field>
                <Field label="Гарын үсэг зурагч">
                  <Input value={s.signName} onChange={e => set("signName", e.target.value)} />
                </Field>
              </div>
            </Card>
          ) : (
            <>
              <Card className="space-y-3 p-4">
                <Field label="Харилцагч">
                  <Input
                    value={s.customerName}
                    onChange={e => pickCustomer(e.target.value)}
                    list="customer-list"
                    placeholder="Компанийн нэр"
                    autoComplete="off"
                  />
                  <datalist id="customer-list">
                    {customers.map(c => <option key={c.name} value={c.name} />)}
                  </datalist>
                </Field>
                {s.docType !== "quote" && (
                  <Field label="Харилцагчийн РД">
                    <Input value={s.custRD} onChange={e => set("custRD", e.target.value)} />
                  </Field>
                )}
                {s.docType === "invoice" && (
                  <>
                    <Field label="Хаяг">
                      <Input value={s.custAddress} onChange={e => set("custAddress", e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Утас">
                        <Input value={s.custPhone} onChange={e => set("custPhone", e.target.value)} />
                      </Field>
                      <Field label="Имэйл">
                        <Input value={s.custEmail} onChange={e => set("custEmail", e.target.value)} />
                      </Field>
                      <Field label="Гэрээний №">
                        <Input value={s.contractNo} onChange={e => set("contractNo", e.target.value)} />
                      </Field>
                      <Field label="Төлөх хугацаа">
                        <Input value={s.payDue} onChange={e => set("payDue", e.target.value)} placeholder="14 хоног" />
                      </Field>
                    </div>
                    <Field label="НӨАТ">
                      <Select value={s.vatMode} onChange={e => set("vatMode", e.target.value as DocState["vatMode"])}>
                        <option value="none">Задлахгүй</option>
                        <option value="incl">Үнэд багтсан 10%-ийг задлах</option>
                      </Select>
                    </Field>
                  </>
                )}
                {s.docType === "dispatch" && (
                  <Field label="Тээвэрлэгч">
                    <Input value={s.carrier} onChange={e => set("carrier", e.target.value)} placeholder="Хаяг, албан тушаал, нэр" />
                  </Field>
                )}
              </Card>

              <Card className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Бараа, үйлчилгээ</p>
                <div className="space-y-2">
                  {s.rows.map((r, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-2">
                      <div className="flex gap-2">
                        <Input value={r.name} onChange={e => setRow(i, { name: e.target.value })} placeholder={`${i + 1}. Нэр`} />
                        <button
                          type="button"
                          onClick={() => set("rows", s.rows.length > 1 ? s.rows.filter((_, j) => j !== i) : [emptyRow()])}
                          className="shrink-0 px-2 text-slate-400 hover:text-red-600"
                          aria-label="Мөр устгах"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                        <Input value={r.unit} onChange={e => setRow(i, { unit: e.target.value })} placeholder="Нэгж" />
                        <Input type="number" min={0} step="any" value={r.qty || ""} onChange={e => setRow(i, { qty: Number(e.target.value) })} placeholder="Тоо" />
                        <Input type="number" min={0} step="any" value={r.price || ""} onChange={e => setRow(i, { price: Number(e.target.value) })} placeholder="Үнэ" />
                      </div>
                      <p className="mt-1 text-right text-xs text-slate-500">{fmtMoney(rowAmount(r))} ₮</p>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => set("rows", [...s.rows, emptyRow()])} className={buttonClass("light", "mt-2 w-full")}>
                  ＋ Мөр нэмэх
                </button>
                <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-500">Нийт</span>
                  <span className="text-lg font-extrabold">{fmtMoney(total)} ₮</span>
                </div>
                {total > 0 && <p className="mt-1 text-right text-xs italic text-slate-400">{toWordsMn(total)}</p>}
              </Card>

              {s.docType === "quote" && (
                <Card className="p-4">
                  <Field label="Тэмдэглэл / Нөхцөл">
                    <textarea className={`${textarea} min-h-20`} value={s.note} onChange={e => set("note", e.target.value)} />
                  </Field>
                </Card>
              )}
              {s.docType === "invoice" && (
                <Card className="grid gap-3 p-4">
                  <Field label="Дарга"><Input value={s.director} onChange={e => set("director", e.target.value)} /></Field>
                  <Field label="Хүлээн авсан"><Input value={s.receiver} onChange={e => set("receiver", e.target.value)} /></Field>
                  <Field label="Нягтлан бодогч"><Input value={s.accountant} onChange={e => set("accountant", e.target.value)} /></Field>
                </Card>
              )}
              {s.docType === "dispatch" && (
                <Card className="grid gap-3 p-4">
                  <Field label="Хүлээлгэн өгсөн эд хариуцагч"><Input value={s.issuerName} onChange={e => set("issuerName", e.target.value)} /></Field>
                  <Field label="Хүлээн авагч"><Input value={s.receiverName} onChange={e => set("receiverName", e.target.value)} /></Field>
                  <Field label="Шалгасан нягтлан бодогч"><Input value={s.accountantName} onChange={e => set("accountantName", e.target.value)} /></Field>
                </Card>
              )}
            </>
          )}
        </fieldset>

        <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          {canEdit && (
            <button type="button" onClick={save} disabled={pending} className={buttonClass("primary", "flex-1 py-2.5")}>
              {pending ? "Хадгалж байна…" : s.id ? "Хадгалах" : "Хадгалах"}
            </button>
          )}
          <PdfButton targetId="doc-sheet" filename={`${DOC_TYPE_LABEL[s.docType]} ${s.number || "ноорог"}`} variant="dark" className="flex-1 py-2.5" />
          <button type="button" onClick={() => window.print()} className={buttonClass("light", "px-3")} title="Хэвлэх" aria-label="Хэвлэх">
            🖨
          </button>
          {canEdit && s.id && (
            <button type="button" onClick={() => router.push(`/documents/new?from=${s.id}`)} className={buttonClass("light", "px-3")} title="Хуулбарлаж шинэ баримт үүсгэх">
              ⧉ Хуулах
            </button>
          )}
          {canDelete && s.id && (
            <button type="button" onClick={remove} disabled={pending} className={buttonClass("light", "px-3 text-red-600")} aria-label="Устгах">
              🗑
            </button>
          )}
        </div>
        {s.id && canEdit && <ShareLink tenantId={tenantId} docId={s.id} initialUrl={shareUrl} />}
        <p className="text-xs text-slate-500">
          «Хадгалах» дармагц баримт «Баримтууд» жагсаалтад хадгалагдана. «⬇ PDF татах» дарахад PDF файл төхөөрөмжийн «Татаж авсан»
          (Downloads) хавтсанд шууд орно.
        </p>
      </div>

      {/* ── Урьдчилан харах (хэвлэхэд зөвхөн энэ гарна) ── */}
      <div className={`min-w-0 flex-1 overflow-x-auto print:block print:overflow-visible lg:block ${view === "edit" ? "hidden" : ""}`}>
        <div id="doc-sheet" className="doc-zoom [zoom:0.46] sm:[zoom:0.8] lg:[zoom:0.62] xl:[zoom:0.78]">
          <DocumentSheet s={s} issuer={issuer} assets={issuerAssets} />
        </div>
      </div>
    </div>
  );
}
