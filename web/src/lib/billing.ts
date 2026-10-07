import type { Tenant } from "./types";

// Төлбөр дансаар шилжүүлж, хүсэлт илгээнэ → hhk.mn/admin/dashboard дээр админ баталгаажуулна (supabase/004_payments.sql)
// Үнэ supabase/004_payments.sql-ийн plan_price()-тэй таарах ёстой
export const PRO_PRICE = 49900;
export const PLANS = [
  { months: 1, price: PRO_PRICE, label: "1 сар" },
  { months: 12, price: 400000, label: "1 жил" },
] as const;
export const PAYMENT = {
  bank: "Хаан банк",
  account: "5119007473",
  holder: "Энх-Амгалан",
};

export const FREE_FEATURES = ["Өдөрт 1 баримт", "Бүх маягт (ТМ-1, БМ-3, албан бичиг)", "Тамга, гарын үсэг", "PDF болон хэвлэх"];
export const PRO_FEATURES = [
  "Хязгааргүй баримт",
  "Ажилтан урих, эрх тохируулах",
  "Тамганы PIN хамгаалалт",
  "Аудит лог — хэн юу хийсэн",
  "Олон ХХК-ийн нэрээр баримт гаргах",
];

export function isPro(t: Pick<Tenant, "plan" | "paid_until">): boolean {
  return t.plan === "pro" && !!t.paid_until && new Date(t.paid_until) > new Date();
}

/** Хугацаа дуусахад үлдсэн өдөр (дууссан бол ≤ 0). paid_until байхгүй бол null */
export function daysLeft(paidUntil: string | null): number | null {
  return paidUntil ? Math.ceil((new Date(paidUntil).getTime() - Date.now()) / 86_400_000) : null;
}
