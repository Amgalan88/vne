"use server";

import { createClient } from "@/lib/supabase/server";

/** Хөтчид гарсан алдааг бүртгэнэ (error.tsx) */
export async function logClientError(message: string, digest: string | undefined, url: string, ua: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_client_error", { p_message: `[client] ${message}`.slice(0, 2000), p_digest: digest ?? null, p_url: url.slice(0, 500), p_ua: ua.slice(0, 300) });
  } catch {
    // үл тооно
  }
}
