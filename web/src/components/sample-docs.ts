import { emptyFields, type DocState, type Issuer } from "@/lib/documents";
import type { AssetUrls } from "@/lib/asset-types";
import type { DocType } from "@/lib/types";

/* Нүүр хуудас, гарын авлагад харуулах ЖИШЭЭ баримтууд — жинхэнэ загвараар, зохиомол мэдээлэлтэй */

export const SAMPLE_ISSUER: Issuer = {
  id: "sample",
  name: "ЖИШЭЭ ТРЕЙД ХХК",
  address: "Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө 12",
  rd: "6622755",
  phone: "7700-1234",
  email: "info@jishee.mn",
  bank: "Хаан банк",
  account: "5000 1234 5678",
  director: "Б.Болд",
};

const svg = (s: string) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

const STAMP = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><path id="r" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs><g fill="none" stroke="#3b4fc4" opacity=".85"><circle cx="60" cy="60" r="56" stroke-width="3"/><circle cx="60" cy="60" r="33" stroke-width="1.5"/></g><text fill="#3b4fc4" opacity=".85" font-family="Arial" font-size="8.6" font-weight="700" letter-spacing="0.8"><textPath href="#r">ЖИШЭЭ ТРЕЙД ХХК • УЛААНБААТАР ХОТ •</textPath></text><text x="60" y="57" text-anchor="middle" fill="#3b4fc4" font-family="Arial" font-size="9" font-weight="700">РД</text><text x="60" y="70" text-anchor="middle" fill="#3b4fc4" font-family="Arial" font-size="10" font-weight="800">6622755</text></svg>`);

const SIGNATURE = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50"><path d="M5 35c10-25 18-25 14 0s12-30 20-10 6 18 16-2 10 8 18 4 14-14 22-6 10 10 20 2" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/></svg>`);

export const SAMPLE_ASSETS: AssetUrls = { logo: null, stamp: STAMP, signature: SIGNATURE, locked: false };

const rows = [
  { name: "Хэвлэлийн цаас A4, 80гр", unit: "хайрцаг", qty: 20, price: 55000 },
  { name: "Хар бэх HP 85A", unit: "ш", qty: 4, price: 160000 },
  { name: "Хүргэлт, суурилуулалт", unit: "удаа", qty: 1, price: 60000 },
];

const base = (docType: DocType, number: string): DocState => ({
  ...emptyFields("Б.Болд"),
  rows,
  id: null,
  docType,
  issuerId: "sample",
  number,
  docDate: "2026-10-07",
  customerName: "ЭРДЭНЭС ТӨМӨР ХХК",
  status: "issued",
  custRD: "5123456",
  custAddress: "Улаанбаатар, Баянзүрх дүүрэг",
  custPhone: "8811-2233",
  accountant: "Д.Сараа",
  receiver: "Г.Тэмүүлэн",
  receiverName: "Г.Тэмүүлэн",
  accountantName: "Д.Сараа",
  payDue: "14 хоног",
  contractNo: "ГЭ-2026/14",
});

export const SAMPLE_DOCS: Record<DocType, DocState> = {
  quote: { ...base("quote", "INV-0043"), note: "Үнийн санал 14 хоног хүчинтэй. Хүргэлт 2 хоногт." },
  invoice: base("invoice", "043"),
  dispatch: { ...base("dispatch", "021"), carrier: "Жолооч Н.Ганаа, 12-34 УНА" },
  letter: {
    ...base("letter", "01/128"),
    customerName: "ЭРДЭНЭС ТӨМӨР ХХК-ийн захирал Д.Баатарт",
    letterOrg: "ЭРДЭНЭС ТӨМӨР ХХК",
    subject: "Хамтран ажиллах тухай",
    body:
      "Манай компани оффисын хангамжийн чиглэлээр 10 гаруй жил үйл ажиллагаа явуулж байна. Танай байгууллагатай урт хугацааны хамтын ажиллагаа тогтоох хүсэлтэй байгаагаа илэрхийлье.\n\nХамтран ажиллах нөхцөлийн саналыг хавсралтаар хүргүүлж байна.",
    position: "Гүйцэтгэх захирал",
    signName: "Б.Болд",
  },
};
