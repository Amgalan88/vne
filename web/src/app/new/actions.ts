"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tenantUrl } from "@/lib/hosts";
import { normalizeSlug } from "@/lib/slug";

export type NewTenantState = { error?: string; name?: string; slug?: string };

export async function createTenant(_: NewTenantState, fd: FormData): Promise<NewTenantState> {
  const name = String(fd.get("name") ?? "").trim();
  const slug = normalizeSlug(String(fd.get("slug") ?? "").trim());
  if (!name) return { error: "Компанийн нэрээ оруулна уу.", name, slug };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_tenant", { p_slug: slug, p_name: name });
  if (error) {
    const msg =
      error.code === "23505"
        ? "Энэ хаяг боломжгүй эсвэл аль хэдийн авагдсан байна. Өөр хаяг сонгоно уу."
        : error.code === "54000"
          ? "Нэг хэрэглэгч 5-аас олон компани нээх боломжгүй."
          : error.code === "42501"
            ? "Эхлээд нэвтэрнэ үү."
            : "Алдаа гарлаа: " + error.message;
    return { error: msg, name, slug };
  }
  redirect(tenantUrl(slug));
}
