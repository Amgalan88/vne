"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InviteState = { error?: string; message?: string };

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
  const { error } = await supabase.rpc("invite_member", {
    p_tenant: tenantId,
    p_email: email,
    p_role: String(fd.get("role") ?? "staff"),
  });
  if (error) return { error: message(error) };
  refresh();
  return { message: `${email} урилга бүртгэгдлээ. Тэр энэ имэйлээр бүртгүүлж нэвтэрмэгц гишүүн болно.` };
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
