import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";
import { COOKIE_DOMAIN, tenantFromHost } from "@/lib/hosts";

// Дэд домэйн дээр ч компанийн хуудас руу дахин чиглүүлэхгүй, бүх компанид нийтлэг замууд
const SHARED_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth"];

/**
 * 1) umgm.hhk.mn/xyz → дотооддоо /t/umgm/xyz руу rewrite (хөтчийн хаяг өөрчлөгдөхгүй)
 * 2) Supabase session-ийн хугацаа дуусахаас өмнө шинэчилж cookie-д бичнэ
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const tenant = tenantFromHost(request.headers.get("host"));

  // Үндсэн домэйноос /t/... руу шууд хандахыг хаана — компанийн хуудас зөвхөн дэд домэйноор
  if (!tenant && pathname.startsWith("/t/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isShared = SHARED_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
  const rewriteTo = tenant && !isShared ? new URL(`/t/${tenant}${pathname === "/" ? "" : pathname}${search}`, request.url) : null;

  const makeResponse = () =>
    rewriteTo
      ? NextResponse.rewrite(rewriteTo, { request: { headers: request.headers } })
      : NextResponse.next({ request: { headers: request.headers } });

  let response = makeResponse();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: { domain: COOKIE_DOMAIN },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Шинэчилсэн token-ийг цаашдын render-т (request) болон хөтөчид (response) хоёуланд нь өгнө
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = makeResponse();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() нь token-ийг шалгаж, хугацаа дууссан бол шинэчилнэ. Энэ хоёрын хооронд өөр код бүү нэм.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
