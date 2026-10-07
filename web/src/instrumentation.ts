import type { Instrumentation } from "next";

/**
 * Серверийн алдаа бүрийг Supabase-ийн error_logs хүснэгтэд бичнэ (010_v2.sql → log_client_error).
 * Админ hhk.mn/admin/dashboard → «Алдаа» табаас харна. Бичиж чадаагүй ч апп-д нөлөөлөхгүй.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : null;
  try {
    await fetch(`${url}/rest/v1/rpc/log_client_error`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_message: `[server] ${message}`,
        p_digest: digest,
        p_url: `${request.method} ${request.headers.host ?? ""}${request.path}`,
        p_ua: String(request.headers["user-agent"] ?? ""),
      }),
    });
  } catch {
    // алдааг бүртгэж чадаагүй — үл тооно
  }
};
