import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/env";

export const metadata: Metadata = { title: "Системийн шалгалт", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; fix: string; optional?: boolean };

/** Функц өгөгдлийн санд байгаа эсэх (PGRST202 = олдсонгүй). Нууц зүйл харуулахгүй, зөвхөн ✓/✗ */
async function hasFn(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  return error?.code !== "PGRST202";
}

export default async function SetupPage() {
  const checks: Check[] = [
    {
      name: "Үндсэн домэйн (NEXT_PUBLIC_ROOT_DOMAIN)",
      ok: ROOT_DOMAIN !== "localhost:3000",
      fix: "Vercel → Settings → Environment Variables → NEXT_PUBLIC_ROOT_DOMAIN = hhk.mn, дараа нь Redeploy.",
    },
    {
      name: "Өгөгдлийн сан: schema.sql, 002, 003",
      ok: await hasFn("slug_available", { p_slug: "setup-check" }),
      fix: "Supabase → SQL Editor дээр supabase/schema.sql, 002_billing.sql, 003_sites.sql-ийг дарааллаар Run.",
    },
    {
      name: "Төлбөрийн хүсэлт: 004_payments.sql",
      ok: await hasFn("plan_price", { p_months: 1 }),
      fix: "Supabase → SQL Editor дээр supabase/004_payments.sql-ийг Run.",
    },
    {
      name: "Админ хяналт: 005_admin_overview.sql",
      ok: await hasFn("admin_tenants", {}),
      fix: "Supabase → SQL Editor дээр supabase/005_admin_overview.sql-ийг Run.",
    },
    {
      name: "Push мэдэгдлийн хүснэгт: 006_push.sql",
      ok: await hasFn("save_push_subscription", { p_endpoint: "", p_p256dh: "", p_auth: "" }),
      fix: "Supabase → SQL Editor дээр supabase/006_push.sql-ийг Run.",
      optional: true,
    },
    {
      name: "Push мэдэгдлийн түлхүүр (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)",
      ok: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY,
      fix: "SETUP.md-ийн «Push мэдэгдэл» хэсгийн хоёр түлхүүрийг Vercel-д нэмээд Redeploy.",
      optional: true,
    },
    {
      name: "Ажилтанд түр нууц үг өгөх (SUPABASE_SERVICE_ROLE_KEY)",
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      fix: "Supabase → Project Settings → API Keys → Secret key-г хуулж Vercel-д SUPABASE_SERVICE_ROLE_KEY нэрээр нэмээд Redeploy.",
      optional: true,
    },
    {
      name: "Имэйл мэдэгдэл (RESEND_API_KEY)",
      ok: !!process.env.RESEND_API_KEY,
      fix: "resend.com дээр түлхүүр авч Vercel-д RESEND_API_KEY, MAIL_FROM нэмээд Redeploy. Заавал биш.",
      optional: true,
    },
  ];
  const bad = checks.filter(c => !c.ok && !c.optional).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Системийн шалгалт</h1>
      <p className="mt-2 text-slate-500">
        {bad === 0 ? "Үндсэн тохиргоо бүрэн байна ✓" : `${bad} зүйл дутуу байна. Доорх ✗ тэмдэгтэй мөрийн заавраар засаад энэ хуудсыг дахин нээнэ үү.`}
      </p>
      <ul className="mt-6 space-y-3">
        {checks.map(c => (
          <li key={c.name} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">
              <span className={c.ok ? "text-emerald-600" : c.optional ? "text-amber-600" : "text-red-600"}>{c.ok ? "✓" : c.optional ? "○" : "✗"}</span>{" "}
              {c.name}
              {c.optional && !c.ok && <span className="ml-2 text-xs font-normal text-slate-400">(заавал биш)</span>}
            </p>
            {!c.ok && <p className="mt-1 text-sm text-slate-500">{c.fix}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
