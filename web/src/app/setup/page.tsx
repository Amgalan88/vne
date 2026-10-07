import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/env";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";

export const metadata: Metadata = { title: "Системийн шалгалт", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; fix: string; optional?: boolean; unknown?: boolean };

/** Функц өгөгдлийн санд байгаа эсэх (PGRST202 = олдсонгүй). Нууц зүйл харуулахгүй, зөвхөн ✓/✗ */
async function hasFn(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  return error?.code !== "PGRST202";
}

/** Нэвтэрсэн хэрэглэгчид л нээлттэй функцүүд (anon-д хаалттай тул нэвтрээгүй үед шалгаж болохгүй) */
async function hasAuthFn(loggedIn: boolean, fn: string, args: Record<string, unknown>): Promise<boolean | undefined> {
  return loggedIn ? hasFn(fn, args) : undefined;
}

export default async function SetupPage() {
  // Тохиргооны байдлыг зөвхөн платформын админ харна
  if (!(await getAdminClient())) redirect("/admin/login");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const loggedIn = !!auth?.claims;
  const adminFn = await hasAuthFn(loggedIn, "admin_tenants", {});
  const pushFn = await hasAuthFn(loggedIn, "save_push_subscription", { p_endpoint: "", p_p256dh: "", p_auth: "" });
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
      ok: adminFn === true,
      unknown: adminFn === undefined,
      fix: "Supabase → SQL Editor дээр supabase/005_admin_overview.sql-ийг Run. (Энэ мөрийг шалгахын тулд эхлээд нэвтэрсэн байх ёстой.)",
    },
    {
      name: "Push мэдэгдлийн хүснэгт: 006_push.sql",
      ok: pushFn === true,
      unknown: pushFn === undefined,
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
      name: "Алдааны бүртгэл, хуваалцах холбоос, импорт: 010_v2.sql",
      ok: await hasFn("public_document", { p_token: "00000000-0000-0000-0000-000000000000" }),
      fix: "Supabase → SQL Editor дээр supabase/010_v2.sql-ийг Run.",
    },
    {
      name: "Нүүр хуудасны баннер: 007_platform.sql",
      ok: !(await (await createClient()).from("platform_settings").select("key").limit(1)).error,
      fix: "Supabase → SQL Editor дээр supabase/007_platform.sql-ийг Run.",
      optional: true,
    },
    {
      name: "Ажилтанд түр нууц үг өгөх (SUPABASE_SERVICE_ROLE_KEY)",
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      fix: "Supabase → Project Settings → API Keys → Secret key-г хуулж Vercel-д SUPABASE_SERVICE_ROLE_KEY нэрээр нэмээд Redeploy.",
      optional: true,
    },
    {
      name: "Өдөр бүрийн автомат ажил (CRON_SECRET)",
      ok: !!process.env.CRON_SECRET,
      fix: "Vercel → Environment Variables → CRON_SECRET (санамсаргүй урт текст) нэмээд Redeploy. Багц дуусах сануулга, зураг цэвэрлэлт ажиллана.",
      optional: true,
    },
    {
      name: "Имэйл мэдэгдэл (RESEND_API_KEY)",
      ok: !!process.env.RESEND_API_KEY,
      fix: "resend.com дээр түлхүүр авч Vercel-д RESEND_API_KEY, MAIL_FROM нэмээд Redeploy. Заавал биш.",
      optional: true,
    },
  ];
  const bad = checks.filter(c => !c.ok && !c.optional && !c.unknown).length;

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
              <span className={c.ok ? "text-emerald-600" : c.optional || c.unknown ? "text-amber-600" : "text-red-600"}>{c.ok ? "✓" : c.optional || c.unknown ? "○" : "✗"}</span>{" "}
              {c.name}
              {c.optional && !c.ok && <span className="ml-2 text-xs font-normal text-slate-400">(заавал биш)</span>}
            </p>
            {c.unknown && <p className="mt-1 text-sm text-slate-500">Нэвтэрсний дараа шалгагдана — <a href="/login?next=/setup" className="font-semibold underline">нэвтрэх</a> (админ бол <a href="/admin/login" className="font-semibold underline">энд</a>), дараа нь энэ хуудсыг дахин нээнэ үү.</p>}
            {!c.ok && !c.unknown && <p className="mt-1 text-sm text-slate-500">{c.fix}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
