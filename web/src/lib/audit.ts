import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, ROLE_LABEL, type DocStatus, type DocType, type Role } from "./types";
import { fmtMoney } from "./format";

export type AuditEntry = {
  id: number;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  at: string;
};

const FIELD_LABEL: Record<string, string> = {
  name: "нэр", number: "дугаар", doc_date: "огноо", customer_name: "харилцагч", total: "дүн", status: "төлөв",
  data: "агуулга", role: "эрх", address: "хаяг", rd: "регистр", phone: "утас", email: "имэйл", bank: "банк",
  account: "данс", director: "захирал", logo_path: "лого", stamp_path: "тамга", signature_path: "гарын үсэг",
  stamp_mode: "тамганы горим", sig_mode: "гарын үсгийн горим", note: "тэмдэглэл", plan: "багц",
  paid_until: "төлбөрийн хугацаа",
};
const SKIP = new Set(["updated_at", "updated_by", "created_at", "created_by", "id", "tenant_id"]);
const MODE: Record<string, string> = { on: "үргэлж", pin: "PIN-ээр", off: "унтраасан" };

function show(key: string, v: unknown): string {
  if (v == null || v === "") return "—";
  if (key === "total") return fmtMoney(v as number) + "₮";
  if (key === "status") return DOC_STATUS_LABEL[v as DocStatus] ?? String(v);
  if (key === "role") return ROLE_LABEL[v as Role] ?? String(v);
  if (key.endsWith("_mode")) return MODE[String(v)] ?? String(v);
  if (key.endsWith("_path")) return "файл";
  if (typeof v === "object") return "…";
  const s = String(v);
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

export type AuditLine = { text: string; changes: string[] };

/** Аудит логийн мөрийг "Баримт НХ-0043-ийн дүн 1,200,000₮ → 1,350,000₮" гэх мэт уншигдахуйц болгоно */
export function describe(e: AuditEntry): AuditLine {
  const row = (e.after ?? e.before ?? {}) as Record<string, unknown>;
  const changes: string[] = [];
  if (e.action === "update" && e.before && e.after) {
    for (const k of Object.keys(e.after)) {
      if (SKIP.has(k) || JSON.stringify(e.before[k]) === JSON.stringify(e.after[k])) continue;
      if (k === "deleted_at") continue;
      changes.push(k === "data" ? "агуулга өөрчлөгдсөн" : `${FIELD_LABEL[k] ?? k}: ${show(k, e.before[k])} → ${show(k, e.after[k])}`);
    }
  }
  const deleted = e.action === "update" && !e.before?.deleted_at && !!e.after?.deleted_at;
  const verb = deleted ? "устгасан" : ({ insert: "үүсгэсэн", update: "зассан", delete: "бүр мөсөн устгасан" } as Record<string, string>)[e.action];

  switch (e.entity) {
    case "documents": {
      const label = `${DOC_TYPE_LABEL[row.doc_type as DocType] ?? "Баримт"} ${row.number || ""}`.trim();
      return { text: `${label} ${verb}`, changes };
    }
    case "customers":
      return { text: `Харилцагч «${row.name}» ${verb}`, changes };
    case "templates":
      return { text: `Загвар «${row.name}» ${verb}`, changes };
    case "tenants":
      if (e.action === "plan_activated")
        return { text: `💳 Төлбөртэй багц идэвхжсэн (+${e.after?.months} сар, ${String(e.after?.paid_until ?? "").slice(0, 10)} хүртэл)`, changes: [] };
      return { text: e.action === "insert" ? `Компани «${row.name}» нээсэн` : `Компанийн мэдээлэл ${verb}`, changes };
    case "memberships":
      return {
        text:
          e.action === "insert" ? `Гишүүн нэмэгдсэн (${show("role", row.role)})`
          : e.action === "delete" ? "Гишүүн хасагдсан"
          : "Гишүүний эрх өөрчлөгдсөн",
        changes,
      };
    case "invitations":
      return {
        text:
          e.action === "insert" ? `${row.email}-г ${show("role", row.role)} эрхтэй урьсан`
          : e.action === "delete" ? `${row.email}-ийн урилгыг цуцалсан`
          : `${row.email} урилга ${e.after?.accepted_at ? "хүлээн авсан" : "шинэчилсэн"}`,
        changes: [],
      };
    case "issuers":
      if (e.action === "stamp_unlock") return { text: "🔓 Тамга, гарын үсгийг PIN-ээр нээсэн", changes };
      if (e.action === "stamp_unlock_failed") return { text: "⚠️ Тамганы PIN буруу оруулсан", changes };
      if (e.action === "pin_set") return { text: "🔒 Тамганы PIN тохируулсан", changes };
      if (e.action === "pin_reset") return { text: "🔒 Тамганы PIN-ийг шинэчилсэн (мартсан)", changes };
      return { text: `Байгууллага «${row.name}» ${verb}`, changes };
    default:
      return { text: `${e.entity} ${e.action}`, changes };
  }
}
