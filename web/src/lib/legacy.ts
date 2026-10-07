import { docTotal, filledRows, type DocFields, type Row } from "./documents";
import type { DocType } from "./types";

/* Хуучин апп (/umgm/, нэг файлтай index.html)-ын экспорт файлыг шинэ баримтын бүтэц рүү хөрвүүлнэ */

const TYPE: Record<string, DocType> = {
  "ҮНИЙН САНАЛ": "quote",
  "НЭХЭМЖЛЭХ": "invoice",
  "ЗАРЛАГЫН БАРИМТ": "dispatch",
  "АЛБАН БИЧИГ": "letter",
};

type LegacyState = Record<string, unknown> & { rows?: { name?: string; unit?: string; price?: number | string; qty?: number | string }[] };
type LegacyHistory = { inv?: string; date?: string; customer?: string; docType?: string; state?: LegacyState };
export type LegacyExport = { app?: string; history?: LegacyHistory[]; customers?: string[] };
export type ImportDoc = { doc_type: DocType; number: string; doc_date: string; customer_name: string; total: number; data: Partial<DocFields> };

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const isoDate = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : "");

export function parseLegacyExport(json: unknown): { docs: ImportDoc[]; customers: string[] } {
  const ex = (json ?? {}) as LegacyExport;
  if (!Array.isArray(ex.history) && !Array.isArray(ex.customers)) throw new Error("Энэ файл хуучин апп-ын экспорт биш байна.");

  const docs: ImportDoc[] = [];
  for (const h of ex.history ?? []) {
    const s = (h.state ?? {}) as LegacyState;
    const type = TYPE[str(s.docType ?? h.docType).trim()];
    if (!type) continue;
    const rows: Row[] = (s.rows ?? []).map(r => ({
      name: str(r.name),
      unit: str(r.unit) || "ш",
      qty: Number(r.qty) || 0,
      price: Number(r.price) || 0,
    }));
    const isLetter = type === "letter";
    const data: Partial<DocFields> = {
      rows: filledRows(rows),
      note: str(s.note),
      custRD: str(s.custRD) || str(s.buyerRD),
      custAddress: str(s.custAddress),
      custPhone: str(s.custPhone),
      custEmail: str(s.custEmail),
      contractNo: str(s.contractNo),
      payDue: str(s.payDue),
      vatMode: str(s.vatMode) === "incl" ? "incl" : "none",
      director: str(s.invDirector),
      receiver: str(s.invReceiver),
      accountant: str(s.invAccountant),
      carrier: str(s.carrierInfo),
      issuerName: str(s.issuerName),
      receiverName: str(s.receiverName),
      accountantName: str(s.accountantName),
      letterOrg: str(s.letterOrg),
      subject: str(s.letterSubject),
      body: str(s.letterBody),
      position: str(s.letterPosition),
      signName: str(s.letterSignName),
    };
    docs.push({
      doc_type: type,
      number: (isLetter ? str(s.letterNum) || str(s.inv ?? h.inv) : str(s.inv ?? h.inv)).trim().slice(0, 40),
      doc_date: isoDate(s.date ?? h.date) || new Date().toISOString().slice(0, 10),
      customer_name: (isLetter ? str(s.letterTo) : str(s.customer ?? h.customer)).trim().slice(0, 300),
      total: isLetter ? 0 : docTotal(rows),
      data,
    });
  }
  const customers = [...new Set((ex.customers ?? []).map(c => str(c).trim()).filter(Boolean))];
  return { docs, customers };
}
