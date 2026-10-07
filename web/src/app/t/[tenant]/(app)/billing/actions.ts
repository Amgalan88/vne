"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_EMAIL } from "@/lib/admin";
import { fmtMoney } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { rootUrl } from "@/lib/hosts";
import { createClient } from "@/lib/supabase/server";

const esc = (v: string) => v.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type PayState = { error?: string; sent?: boolean };

// Эрхийг Postgres-ийн request_payment() шалгана (supabase/004_payments.sql)
export async function requestPayment(tenantId: string, _: PayState, fd: FormData): Promise<PayState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_payment", { p_tenant: tenantId, p_months: Number(fd.get("months")) });
  if (error) return { error: error.code === "42501" ? "Зөвхөн компанийн эзэмшигч, админ хүсэлт илгээнэ." : error.message };
  revalidatePath("/t/[tenant]/billing", "page");
  const { data: t } = await supabase.from("tenants").select("name, slug").eq("id", tenantId).maybeSingle();
  await sendMail(
    ADMIN_EMAIL,
    `Төлбөрийн шинэ хүсэлт — ${t?.name ?? ""}`,
    `<p><b>${esc(t?.name ?? "")}</b> (${esc(t?.slug ?? "")}.hhk.mn) ${Number(fd.get("months")) === 12 ? "1 жил" : "1 сар"}-ийн төлбөр шилжүүллээ гэж мэдэгдлээ.</p>
     <p>Дүн: ${fmtMoney(Number(fd.get("months")) === 12 ? 400000 : 49900)}₮</p>
     <p><a href="${rootUrl("/admin/dashboard")}">Админ хуудас руу орж баталгаажуулах</a></p>`,
  );
  await sendPush(ADMIN_EMAIL, {
    title: "Төлбөрийн шинэ хүсэлт",
    body: `${t?.name ?? ""} — ${fmtMoney(Number(fd.get("months")) === 12 ? 400000 : 49900)}₮`,
    url: rootUrl("/admin/dashboard"),
  });
  return { sent: true };
}
