"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { tenantUrl } from "@/lib/hosts";

export type InquiryState = { ok?: boolean; error?: string };

/** Нийтийн хуудасны «Захиалга / асуулт» маягт — нэвтрэлгүй. Эзэмшигч, админд имэйл + push. */
export async function submitInquiry(slug: string, _: InquiryState, fd: FormData): Promise<InquiryState> {
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const message = String(fd.get("message") ?? "").trim();
  if (fd.get("website")) return { ok: true }; // робот (нуусан талбар бөглөсөн)
  if (!name || phone.replace(/\D/g, "").length < 6) return { error: "Нэр, утасны дугаараа оруулна уу." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_inquiry", { p_slug: slug, p_name: name, p_phone: phone, p_message: message });
  if (error) return { error: error.code === "54000" ? error.message : "Илгээж чадсангүй. Утсаар холбогдоно уу." };

  // Мэдэгдэл — service key байхгүй бол алгасна (хүсэлт хадгалагдсан хэвээр)
  const admin = createAdminClient();
  if (admin) {
    const { data: t } = await admin.from("tenants").select("id, name").eq("slug", slug).maybeSingle();
    if (t) {
      const { data: m } = await admin.from("memberships").select("user_id").eq("tenant_id", t.id).in("role", ["owner", "admin"]);
      const { data: profiles } = await admin.from("profiles").select("email").in("id", (m ?? []).map(x => x.user_id));
      const url = tenantUrl(slug, "/site");
      for (const p of profiles ?? []) {
        if (!p.email) continue;
        await sendPush(p.email, { title: `Шинэ хүсэлт — ${name}`, body: message.slice(0, 120) || phone, url });
        await sendMail(p.email, `${t.name} — нийтийн хуудаснаас шинэ хүсэлт`, `<p><b>${name}</b> (${phone})</p><p>${message.replace(/</g, "&lt;")}</p><p><a href="${url}">Хүсэлтүүдийг харах</a></p>`);
      }
    }
  }
  return { ok: true };
}
