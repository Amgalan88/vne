import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = { title: string; body: string; url: string };

/**
 * Имэйлийн эзний бүх төхөөрөмж рүү push илгээнэ. VAPID түлхүүр эсвэл SUPABASE_SERVICE_ROLE_KEY
 * тохируулаагүй бол чимээгүй алгасна — үндсэн үйлдэл хэзээ ч зогсохгүй.
 */
export async function sendPush(email: string, payload: PushPayload): Promise<void> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const admin = createAdminClient();
  if (!pub || !priv || !admin || !email) return;

  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:erdenebilegamgalan@gmail.com", pub, priv);
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("email", email.toLowerCase());
    await Promise.all(
      (subs ?? []).map(async s => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          // Төхөөрөмж мэдэгдлийг цуцалсан/устсан бол хаягийг устгана
          if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }),
    );
  } catch {
    // Мэдэгдэл илгээж чадаагүй нь үндсэн үйлдлийг зогсоохгүй
  }
}
