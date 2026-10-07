"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/slug";

/** Дэд домэйн сул эсэх — нэвтрээгүй хэрэглэгч ч шалгана */
export async function checkSlug(slug: string): Promise<boolean> {
  if (!isValidSlug(slug)) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("slug_available", { p_slug: slug });
  return data === true;
}
