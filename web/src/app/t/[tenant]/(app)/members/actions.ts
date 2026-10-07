"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { tenantUrl } from "@/lib/hosts";
import { sendMail } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";

export type InviteState = {
  error?: string;
  message?: string;
  /** Түр нууц үгтэй урилга: эзэмшигч ажилтанд өгөх мэдээлэл */
  credentials?: { email: string; password: string; url: string; companyName: string; emailed: boolean };
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
  const tempPassword = String(fd.get("password") ?? "");
  if (tempPassword && tempPassword.length < 8) return { error: "Түр нууц үг дор хаяж 8 тэмдэгт байна." };

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
  const url = t ? tenantUrl(t.slug, "/login") : "";
  const lower = email.toLowerCase();

  // Түр нууц үгтэй бол хэрэглэгчийг шууд үүсгэнэ; анх нэвтрэхэд өөрөө шинэ нууц үг тохируулна
  if (tempPassword) {
    const admin = createAdminClient();
    if (!admin) {
      return { message: `${email} урилга бүртгэгдлээ, гэхдээ түр нууц үг үүсгэж чадсангүй: SUPABASE_SERVICE_ROLE_KEY тохируулаагүй байна. Ажилтан өөрөө бүртгүүлж нэгдэнэ.` };
    }
    const { error: createErr } = await admin.auth.admin.createUser({
      email: lower,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });
    if (createErr) {
      const exists = createErr.code === "email_exists" || createErr.message.toLowerCase().includes("already");
      return {
        message: exists
          ? `${email} аль хэдийн бүртгэлтэй тул урилга бүртгэгдлээ. Тэр өөрийн нууц үгээрээ нэвтэрмэгц гишүүн болно.`
          : `${email} урилга бүртгэгдсэн ч хэрэглэгч үүсгэж чадсангүй: ${createErr.message}`,
      };
    }
    const emailed = await sendMail(
      lower,
      `${t?.name ?? "hhk.mn"} — таныг урилаа`,
      `<p>Таныг <b>${esc(t?.name ?? "")}</b> компанид урилаа.</p><p>Нэвтрэх: <a href="${url}">${url}</a><br>Имэйл: ${esc(lower)}<br>Түр нууц үг: <b>${esc(tempPassword)}</b></p><p>Анх нэвтрэхэд өөрийн шинэ нууц үгээ тохируулна.</p>`,
    );
    return {
      message: `${email} хэрэглэгч үүсч, компанид нэмэгдлээ. Доорх мэдээллийг ажилтанд өгнө үү — анх нэвтрэхдээ шинэ нууц үгээ өөрөө тохируулна.`,
      credentials: { email: lower, password: tempPassword, url, companyName: t?.name ?? "", emailed },
    };
  }

  // Нууц үггүй: ажилтан өөрөө бүртгүүлнэ. Холбоосыг имэйлээр явуулна (RESEND_API_KEY тохируулсан бол).
  const signup = t ? tenantUrl(t.slug, "/signup") : "";
  await sendMail(
    lower,
    `${t?.name ?? "hhk.mn"} — таныг урилаа`,
    `<p>Таныг <b>${esc(t?.name ?? "")}</b> компанид урилаа.</p><p>Энэ имэйлээрээ (${esc(lower)}) бүртгүүлнэ үү: <a href="${signup}">${signup}</a></p>`,
  );
  return { message: `${email} урилга бүртгэгдлээ. Тэр энэ имэйлээр ${signup} дээр бүртгүүлж нэвтэрмэгц гишүүн болно.` };
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
