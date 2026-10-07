import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Banner = { path: string; url: string; link: string; alt: string; enabled: boolean };

/** Нүүр хуудасны баннер. 007_platform.sql ажиллаагүй эсвэл тохируулаагүй бол null */
export async function getBanner(): Promise<Banner | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("platform_settings").select("value").eq("key", "banner").maybeSingle();
    const v = data?.value as Partial<Banner> | undefined;
    if (!v?.path) return null;
    const url = supabase.storage.from("platform").getPublicUrl(v.path).data.publicUrl;
    return { path: v.path, url, link: v.link ?? "", alt: v.alt ?? "", enabled: v.enabled !== false };
  } catch {
    return null;
  }
}
