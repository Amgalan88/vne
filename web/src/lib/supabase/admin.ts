import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Service-role client — RLS-ийг тойрдог тул зөвхөн сервер талд, эрхийг өөр газар шалгасны дараа ашиглана.
 * SUPABASE_SERVICE_ROLE_KEY тохируулаагүй бол null (NEXT_PUBLIC_ угтваргүй — хөтөчид хэзээ ч очихгүй).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
