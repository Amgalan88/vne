"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL, getAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type CodeState = { step?: "code"; email?: string; error?: string };

/**
 * 1-р алхам: имэйлд нэг удаагийн код илгээнэ. Админы имэйл биш бол код илгээхгүй ч
 * хариу ижил байна — хэн админ болохыг задруулахгүй.
 * 2-р алхам: кодыг шалгаж нэвтрүүлнэ.
 */
export async function adminLogin(_: CodeState, fd: FormData): Promise<CodeState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const token = String(fd.get("token") ?? "").replace(/\s/g, "");
  const supabase = await createClient();

  if (!token) {
    if (email === ADMIN_EMAIL) {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error?.code?.startsWith("over_")) return { error: "Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу." };
    }
    return { step: "code", email };
  }

  if (email !== ADMIN_EMAIL) return { step: "code", email, error: "Код буруу эсвэл хугацаа дууссан байна." };
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "Код буруу эсвэл хугацаа дууссан байна." };
  redirect("/admin/dashboard");
}

export async function decidePayment(id: string, approve: boolean) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/admin/login");
  await supabase.rpc("admin_decide_payment", { p_id: id, p_approve: approve });
  revalidatePath("/admin/dashboard");
}

export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
