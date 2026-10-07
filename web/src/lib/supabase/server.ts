import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";
import { COOKIE_DOMAIN } from "@/lib/hosts";

/** Server Component, Server Action, Route Handler-т хүсэлт бүрд шинээр үүсгэнэ — хэзээ ч хуваалцахгүй */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: { domain: COOKIE_DOMAIN },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component-оос cookie бичих боломжгүй — session-ийг proxy шинэчилнэ
        }
      },
    },
  });
}
