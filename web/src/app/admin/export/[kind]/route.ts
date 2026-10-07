import { getAdminClient } from "@/lib/admin";

/** Админы экспорт: Excel-д нээгдэх CSV (UTF-8 BOM-той — кирилл зөв харагдана) */
const csv = (rows: (string | number | null | undefined)[][]) =>
  "﻿" + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const supabase = await getAdminClient();
  if (!supabase) return new Response("Эрх хүрэлцэхгүй", { status: 403 });
  const { kind } = await params;
  const date = new Date().toISOString().slice(0, 10);
  let body = "";

  if (kind === "companies") {
    const { data } = await supabase.rpc("admin_tenants");
    type T = { slug: string; name: string; plan: string; paid_until: string | null; created_at: string; members: number; documents: number; owner_email: string | null };
    body = csv([
      ["Нэр", "Хаяг", "Эзэмшигч", "Багц", "Дуусах", "Гишүүд", "Баримт", "Нээсэн"],
      ...((data ?? []) as T[]).map(t => [t.name, `${t.slug}.hhk.mn`, t.owner_email, t.plan, t.paid_until?.slice(0, 10), t.members, t.documents, t.created_at.slice(0, 10)]),
    ]);
  } else if (kind === "payments") {
    const { data } = await supabase.rpc("admin_payments");
    type P = { created_at: string; decided_at: string | null; status: string; months: number; amount: number; tenant_slug: string; tenant_name: string; requester_email: string | null };
    body = csv([
      ["Огноо", "Компани", "Хаяг", "Имэйл", "Хугацаа (сар)", "Дүн", "Төлөв", "Шийдвэрлэсэн"],
      ...((data ?? []) as P[]).map(p => [p.created_at.slice(0, 16).replace("T", " "), p.tenant_name, `${p.tenant_slug}.hhk.mn`, p.requester_email, p.months, p.amount, p.status, p.decided_at?.slice(0, 16).replace("T", " ")]),
    ]);
  } else {
    return new Response("Олдсонгүй", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hhk-${kind}-${date}.csv"`,
    },
  });
}
