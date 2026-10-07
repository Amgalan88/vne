export type Role = "owner" | "admin" | "staff" | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Эзэмшигч",
  admin: "Админ",
  staff: "Ажилтан",
  viewer: "Харагч",
};

export const canManage = (role: Role) => role === "owner" || role === "admin";
export const canEdit = (role: Role) => role !== "viewer";

export type Tenant = { id: string; slug: string; name: string; plan: "free" | "pro"; paid_until: string | null };

export type DocType = "quote" | "invoice" | "dispatch" | "letter";

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  quote: "Үнийн санал",
  invoice: "Нэхэмжлэх",
  dispatch: "Зарлагын баримт",
  letter: "Албан бичиг",
};

export type DocStatus = "draft" | "issued" | "paid" | "cancelled";

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  draft: "Ноорог",
  issued: "Гаргасан",
  paid: "Төлөгдсөн",
  cancelled: "Цуцалсан",
};
