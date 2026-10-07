import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Платформын админ. Эрхийг Postgres-ийн is_platform_admin() мөн шалгадаг (supabase/004_payments.sql) */
export const ADMIN_EMAIL = "erdenebilegamgalan@gmail.com";

export async function getAdminClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = String(data?.claims?.email ?? "").toLowerCase();
  return email === ADMIN_EMAIL ? supabase : null;
}
