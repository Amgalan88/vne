"use server";

import { createClient } from "@/lib/supabase/server";

type Sub = { endpoint: string; p256dh: string; auth: string };

export async function savePushSubscription(sub: Sub): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", { p_endpoint: sub.endpoint, p_p256dh: sub.p256dh, p_auth: sub.auth });
  return error ? { error: error.message } : {};
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("delete_push_subscription", { p_endpoint: endpoint });
}
