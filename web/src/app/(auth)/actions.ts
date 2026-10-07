"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeFor, safeNext } from "@/lib/hosts";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import { finishOnboarding } from "@/lib/onboarding";

export type FormState = {
  error?: string;
  message?: string;
  email?: string;
  fullName?: string;
  companyName?: string;
  slug?: string;
};

/** Имэйлийн холбоос хэрэглэгчийн одоо байгаа хаяг руу (дэд домэйн ч бай) буцаж ирнэ */
async function currentHome() {
  const h = await headers();
  return homeFor(h.get("x-forwarded-host") ?? h.get("host"));
}

async function currentOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const local = host.startsWith("localhost") || host.split(":")[0].endsWith(".localhost");
  return `${h.get("x-forwarded-proto") ?? (local ? "http" : "https")}://${host}`;
}

function authError(e: { code?: string; message: string }): string {
  switch (e.code) {
    case "invalid_credentials":
      return "Имэйл эсвэл нууц үг буруу байна.";
    case "email_not_confirmed":
      return "Имэйлээ баталгаажуулаагүй байна. Ирсэн захидлын холбоос дээр дарна уу.";
    case "user_already_exists":
    case "email_exists":
      return "Энэ имэйлээр бүртгэл аль хэдийн үүссэн байна. Нэвтэрнэ үү.";
    case "weak_password":
      return "Нууц үг хэт сул байна. Дор хаяж 8 тэмдэгт, үсэг тоо холино уу.";
    case "same_password":
      return "Шинэ нууц үг хуучнаасаа өөр байх ёстой.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу.";
    case "validation_failed":
    case "email_address_invalid":
      return "Имэйл хаяг буруу байна.";
    default:
      return "Алдаа гарлаа: " + e.message;
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(fd.get("password") ?? "") });
  if (error) return { error: authError(error), email };
  redirect(safeNext(fd.get("next"), await currentHome()));
}

/**
 * Үндсэн домэйн дээр компани (нэр + дэд домэйн)-тойгоо бүртгүүлнэ — компани нь имэйл баталгаажмагц үүснэ.
 * Компанийн дэд домэйн дээр (урилгаар нэгдэх) зөвхөн хувь хүний мэдээлэл.
 */
export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const fullName = str(fd, "full_name");
  const withCompany = fd.has("slug");
  const companyName = str(fd, "company_name");
  const slug = normalizeSlug(str(fd, "slug"));
  const keep = { email, fullName, companyName, slug };

  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Нууц үг дор хаяж 8 тэмдэгт байна.", ...keep };

  const supabase = await createClient();
  if (withCompany) {
    if (!companyName) return { error: "Компанийн нэрээ оруулна уу.", ...keep };
    if (!isValidSlug(slug)) return { error: "Компанийн хаяг буруу байна. Латин жижиг үсэг, тоо, зураас.", ...keep };
    const { data: free } = await supabase.rpc("slug_available", { p_slug: slug });
    if (!free) return { error: `${slug} хаяг авагдсан байна. Өөр хаяг сонгоно уу.`, ...keep };
  }

  const next = safeNext(fd.get("next"), await currentHome());
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: withCompany ? { full_name: fullName, company_name: companyName, company_slug: slug } : { full_name: fullName },
      emailRedirectTo: `${await currentOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: authError(error), ...keep };
  if (data.session) redirect((await finishOnboarding(supabase)) ?? next); // Имэйл баталгаажуулалт унтраалттай үед

  return {
    message: withCompany
      ? `Баталгаажуулах холбоосыг ${email} хаяг руу илгээлээ. Холбоос дээр дармагц ${slug} хаяг тань бэлэн болно.`
      : `Баталгаажуулах холбоосыг ${email} хаяг руу илгээлээ. Имэйлээ шалгаад холбоос дээр дарна уу.`,
    email,
  };
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await currentOrigin()}/auth/confirm?next=/reset-password`,
  });
  // Бүртгэлтэй эсэхийг задруулахгүйн тулд ихэнх алдаанд ч амжилттай гэж хариулна
  if (error && error.code?.startsWith("over_")) return { error: authError(error), email };
  return { message: `Хэрэв ${email} бүртгэлтэй бол нууц үг сэргээх холбоос илгээгдлээ. Имэйлээ шалгана уу.`, email };
}

export async function updatePassword(_: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Нууц үг дор хаяж 8 тэмдэгт байна." };
  if (password !== fd.get("confirm")) return { error: "Хоёр нууц үг таарахгүй байна." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Холбоосын хугацаа дууссан байна. Нууц үг сэргээх хүсэлтээ дахин илгээнэ үү." };
  const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
  if (error) return { error: authError(error) };
  // Токен дотор хуучин "must_change_password" үлддэг тул шинэчилж авна — үгүй бол дараагийн хуудас дахин нууц үг солих руу буцаана
  await supabase.auth.refreshSession();
  redirect(await currentHome());
}
