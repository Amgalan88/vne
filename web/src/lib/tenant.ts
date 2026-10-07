import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role, Tenant } from "@/lib/types";
import { mustChangePassword } from "@/lib/password";

export type TenantContext =
  | { status: "ok"; tenant: Tenant; role: Role; userId: string; email: string; mustChangePassword: boolean }
  | { status: "forbidden"; slug: string; email: string }
  | { status: "missing" }
  | { status: "anon" };

/** Нэг хүсэлтийн дотор layout, page хоёр дуудахад нэг л удаа ажиллана */
export const getTenantContext = cache(async (slug: string): Promise<TenantContext> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { status: "anon" };
  const email = String(claims.email ?? "");

  const load = () => supabase.from("tenants").select("id, slug, name, plan, paid_until").eq("slug", slug).maybeSingle<Tenant>();
  let { data: tenant } = await load();
  if (!tenant) {
    // Урилгатай бол энд нэгдэнэ
    const { data: accepted } = await supabase.rpc("accept_invitations");
    if (accepted) ({ data: tenant } = await load());
  }
  if (!tenant) {
    const { data: found } = await supabase.rpc("tenant_by_slug", { p_slug: slug });
    return found?.length ? { status: "forbidden", slug, email } : { status: "missing" };
  }

  const { data: m } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", claims.sub)
    .single<{ role: Role }>();
  if (!m) return { status: "forbidden", slug, email };
  return { status: "ok", tenant, role: m.role, userId: claims.sub, email, mustChangePassword: mustChangePassword(claims) };
});

/** Компанийн хуудсанд: нэвтрээгүй бол login, компани байхгүй/гишүүн биш бол 404 */
export async function requireTenant(slug: string) {
  const ctx = await getTenantContext(slug);
  if (ctx.status === "anon") redirect("/login");
  if (ctx.status !== "ok") notFound();
  return ctx;
}
