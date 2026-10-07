import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl, tenantUrl } from "./hosts";

/**
 * Бүртгүүлэхдээ сонгосон компанийг (user_metadata.company_slug) анх нэвтрэх үед үүсгэнэ.
 * Имэйл баталгаажуулалт, нэвтрэлт, нүүр хуудас гурвын аль нь түрүүлж дуудсан ч нэг л удаа үүснэ.
 * Буцаах: компанийн хаяг, хаяг авагдсан бол /new, хийх зүйлгүй бол null.
 */
export async function finishOnboarding(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const slug = user?.user_metadata?.company_slug;
  if (!user || typeof slug !== "string" || !slug) return null;

  const { count } = await supabase
    .from("memberships")
    .select("tenant_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count) return null;

  const name = String(user.user_metadata.company_name || slug);
  const { error } = await supabase.rpc("create_tenant", { p_slug: slug, p_name: name });
  // Баталгаажуулах хооронд өөр хүн авчихсан бол шинээр сонгуулна
  if (error) return appUrl(`/new?${new URLSearchParams({ slug, name, taken: "1" })}`);
  return tenantUrl(slug);
}
