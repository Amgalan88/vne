/* Нэхэмжлэхийн төлөх хугацаа: "14 хоног", "30 өдөр", "1 сар", "2026-11-01" гэх мэт чөлөөт бичвэрээс тооцно */

export function dueDate(docDate: string, payDue: string | null | undefined): Date | null {
  const t = (payDue ?? "").trim().toLowerCase();
  if (!t || !/^\d{4}-\d{2}-\d{2}/.test(docDate)) return null;
  const exact = t.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (exact) return new Date(Date.UTC(+exact[1], +exact[2] - 1, +exact[3]));
  const n = Number(t.match(/\d+/)?.[0]);
  if (!n) return null;
  const d = new Date(`${docDate.slice(0, 10)}T00:00:00Z`);
  if (/сар/.test(t)) d.setUTCMonth(d.getUTCMonth() + n);
  else if (/долоо|7 хоног|week/.test(t) && !/\d+\s*хоног/.test(t)) d.setUTCDate(d.getUTCDate() + n * 7);
  else d.setUTCDate(d.getUTCDate() + n); // хоног, өдөр, эсвэл зөвхөн тоо
  return d;
}

/** Гаргасан (төлөгдөөгүй) нэхэмжлэхийн хугацаа хэтэрсэн хоног; хэтрээгүй бол 0 */
export function overdueDays(doc: { doc_type: string; status: string; doc_date: string; pay_due?: string | null }, today = new Date()): number {
  if (doc.doc_type !== "invoice" || doc.status !== "issued") return 0;
  const due = dueDate(doc.doc_date, doc.pay_due);
  if (!due) return 0;
  const diff = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
  return diff > 0 ? diff : 0;
}
