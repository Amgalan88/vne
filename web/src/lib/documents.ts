import type { DocStatus, DocType } from "./types";

export type Issuer = {
  id: string;
  name: string;
  address: string;
  rd: string;
  phone: string;
  email: string;
  bank: string;
  account: string;
  director: string;
};

export type Row = { name: string; unit: string; qty: number; price: number };

/** documents.data баганад хадгалагдах бүх талбар — төрөл бүр өөрт хэрэгтэйгээ ашиглана */
export type DocFields = {
  rows: Row[];
  note: string;
  // Харилцагч (ТМ-1, БМ-3)
  custRD: string;
  custAddress: string;
  custPhone: string;
  custEmail: string;
  // ТМ-1
  contractNo: string;
  payDue: string;
  vatMode: "none" | "incl";
  director: string;
  receiver: string;
  accountant: string;
  // БМ-3
  carrier: string;
  issuerName: string;
  receiverName: string;
  accountantName: string;
  // Албан бичиг
  letterOrg: string;
  subject: string;
  body: string;
  position: string;
  signName: string;
};

export type DocState = DocFields & {
  id: string | null;
  docType: DocType;
  issuerId: string;
  number: string;
  docDate: string;
  customerName: string;
  status: DocStatus;
};

export const emptyRow = (): Row => ({ name: "", unit: "ш", qty: 1, price: 0 });

export function emptyFields(director = ""): DocFields {
  return {
    rows: [emptyRow()],
    note: "",
    custRD: "", custAddress: "", custPhone: "", custEmail: "",
    contractNo: "", payDue: "", vatMode: "none", director, receiver: "", accountant: "",
    carrier: "", issuerName: director, receiverName: "", accountantName: "",
    letterOrg: "", subject: "", body: "", position: "Захирал", signName: director,
  };
}

export const rowAmount = (r: Row) => (Number(r.qty) || 0) * (Number(r.price) || 0);
export const filledRows = (rows: Row[]) => rows.filter(r => r.name.trim() || rowAmount(r));
export const docTotal = (rows: Row[]) => filledRows(rows).reduce((s, r) => s + rowAmount(r), 0);

/** Автомат дугаарын хэлбэр: үнийн санал "INV-0001", албан маягт "001" (хуучин апп-тай ижил) */
export function formatDocNumber(type: DocType, n: number): string {
  return type === "quote" ? "INV-" + String(n).padStart(4, "0") : String(n).padStart(3, "0");
}
