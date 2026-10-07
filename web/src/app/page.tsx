import { createClient } from "@/lib/supabase/server";
import { getBanner } from "@/lib/platform";
import { Landing } from "./landing";

/** hhk.mn — танилцуулга. Нэвтэрсэн ч гэсэн энд үргэлж танилцуулга харагдана; админ нь app.hhk.mn дээр. */
export default async function Home() {
  const supabase = await createClient();
  const [{ data }, banner] = await Promise.all([supabase.auth.getClaims(), getBanner()]);
  return <Landing signedIn={!!data?.claims} banner={banner} />;
}
