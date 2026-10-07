import type { Tenant } from "./types";

// Төлбөр дансаар шилжүүлж, гараар баталгаажуулна (supabase/002_billing.sql → activate_pro)
export const PRO_PRICE = 49900;
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
