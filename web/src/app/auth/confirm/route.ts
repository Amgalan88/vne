import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/hosts";
import { finishOnboarding } from "@/lib/onboarding";

/**
 * Имэйлийн холбоос (бүртгэл баталгаажуулах, нууц үг сэргээх) энд ирнэ.
 * - token_hash: Supabase-ийн имэйл загварт "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=..." гэж тохируулсан үед.
 *   Өөр төхөөрөмж дээр нээсэн ч ажиллана.
 * - code: Supabase-ийн анхны загвар (PKCE) — зөвхөн бүртгүүлсэн хөтөч дээрээ нээвэл ажиллана.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const tokenHash = sp.get("token_hash");
  const type = sp.get("type") as EmailOtpType | null;
  const code = sp.get("code");
  const next = safeNext(sp.get("next"));

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  if (!ok) return NextResponse.redirect(new URL("/login?error=link", request.url));
  if (type === "recovery") return NextResponse.redirect(new URL("/reset-password", request.url));
  // Бүртгүүлэхдээ сонгосон компанийг үүсгээд шууд тэр хаяг руу оруулна
  const onboarded = await finishOnboarding(supabase);
  return NextResponse.redirect(new URL(onboarded ?? next, request.url));
}
