"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { tenantUrl } from "@/lib/hosts";
import { sendMail } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";

export type InviteState = {
  error?: string;
  message?: string;
  /** Ажилтанд явуулах холбоос (урилга эсвэл нэвтрэх хаяг) */
  credentials?: { email: string; url: string; companyName: string; emailed: boolean; isLink: boolean };
};

const esc = (v: string) => v.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const ERR: Record<string, string> = {
  "42501": "Эрх хүрэлцэхгүй байна.",
  "23505": "Энэ хүн аль хэдийн гишүүн байна.",
  "22023": "Мэдээлэл буруу байна.",
  P0002: "Гишүүн олдсонгүй.",
  HK402: "Ажилтан урих нь төлбөртэй багцад багтана.",
};
const message = (e: { code?: string; message: string }) => ERR[e.code ?? ""] ?? e.message;
const refresh = () => revalidatePath("/t/[tenant]/members", "page");

// Эрхийг Postgres-ийн функцууд шалгана (schema.sql) — энд зөвхөн дамжуулна

export async function inviteMember(tenantId: string, _: InviteState, fd: FormData): Promise<InviteState> {
  const email = String(fd.get("email") ?? "").trim();
  const supabase = await createClient();
  // Эрх (owner/admin), төлбөртэй багц, давхардлыг Postgres шалгана — доорх үйлдлүүд зөвхөн амжилттай бол ажиллана
  const { error } = await supabase.rpc("invite_member", {
    p_tenant: tenantId,
    p_email: email,
    p_role: String(fd.get("role") ?? "staff"),
  });
  if (error) return { error: message(error) };
  refresh();

  const { data: t } = await supabase.from("tenants").select("name, slug").eq("id", tenantId).maybeSingle();
  const companyName = t?.name ?? "";
  const lower = email.toLowerCase();

  // Шинэ хүнд нэг удаагийн урилгын холбоос: дармагц имэйл нь баталгаажиж, өөрөө нууц үгээ тохируулна.
  // Эзэмшигч нууц үгийг хэзээ ч мэдэхгүй, бусдын имэйлээр аккаунт үүсгэх боломжгүй.
  const admin = createAdminClient();
  let link = "";
  if (admin && t) {
    const { data, error: linkErr } = await admin.auth.admin.generateLink({
      type: "invite",
      email: lower,
      options: { data: { must_change_password: true } },
    });
    const hashed = data?.properties?.hashed_token;
    if (!linkErr && hashed) {
      link = tenantUrl(t.slug, `/auth/confirm?token_hash=${hashed}&type=invite&next=/change-password`);
    } else if (linkErr && !(linkErr.code === "email_exists" || linkErr.message.toLowerCase().includes("already"))) {
      return { message: `${email} урилга бүртгэгдсэн ч холбоос үүсгэж чадсангүй: ${linkErr.message}` };
    }
  }

  // Бүртгэлтэй хүн эсвэл service key байхгүй үед — нэвтрэх / бүртгүүлэх хаяг
  const url = link || (t ? tenantUrl(t.slug, "/signup") : "");
  const emailed = await sendMail(
    lower,
    `${companyName || "HHK.MN"} — таныг урилаа`,
    link
      ? `<p>Таныг <b>${esc(companyName)}</b> компанид урилаа.</p><p><a href="${link}">Урилгыг хүлээн авч нууц үгээ тохируулах</a></p><p>Холбоос 24 цагийн дотор хүчинтэй.</p>`
      : `<p>Таныг <b>${esc(companyName)}</b> компанид урилаа.</p><p>Энэ имэйлээрээ (${esc(lower)}) нэвтэрч эсвэл бүртгүүлж орно уу: <a href="${url}">${url}</a></p>`,
  );
  return {
    message: link
      ? `${email} урилга бэлэн. Доорх холбоосыг ажилтанд явуулна уу — дармагц имэйл нь баталгаажиж, өөрийн нууц үгээ тохируулна.`
      : `${email} урилга бүртгэгдлээ. Тэр энэ имэйлээрээ нэвтэрмэгц (бүртгэлгүй бол бүртгүүлмэгц) гишүүн болно.`,
    credentials: { email: lower, url, companyName, emailed, isLink: !!link },
  };
}

export async function changeRole(tenantId: string, userId: string, fd: FormData) {
  const supabase = await createClient();
  await supabase.rpc("set_member_role", { p_tenant: tenantId, p_user: userId, p_role: String(fd.get("role")) });
  refresh();
}

export async function removeMember(tenantId: string, userId: string) {
  const supabase = await createClient();
  await supabase.rpc("remove_member", { p_tenant: tenantId, p_user: userId });
  refresh();
}

export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", invitationId);
  refresh();
}
