import { createClient } from "@/lib/supabase/server";
import { Landing } from "./landing";

/** hhk.mn — танилцуулга. Нэвтэрсэн ч гэсэн энд үргэлж танилцуулга харагдана; админ нь app.hhk.mn дээр. */
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <Landing signedIn={!!data?.claims} />;
}
