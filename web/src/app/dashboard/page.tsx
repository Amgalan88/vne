import Link from "next/link";
import { redirect } from "next/navigation";
import { mustChangePassword } from "@/lib/password";
import { finishOnboarding } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { rootUrl, tenantHost, tenantUrl } from "@/lib/hosts";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { buttonClass, Card } from "@/components/ui";
import { PushToggle } from "@/components/push-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/logo";
import { initials } from "@/lib/site";

type MyTenant = { role: Role; tenants: { slug: string; name: string } };

/**
 * app.hhk.mn — админ (hhk.mn/ нь зөвхөн танилцуулга). Нэвтрээгүй бол нэвтрэх хуудас руу.
 * Нэвтэрсэн, ганц компанитай бол шууд тэр компанийн ажлын хэсэг рүү; олон бол сонгуулна.
 * ?companies — жагсаалтыг үргэлж харуулна (компанийн толгой хэсгийн "Миний компаниуд" холбоос).
 */
export default async function Home({ searchParams }: PageProps<"/dashboard">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) redirect("/login");
  if (mustChangePassword(claims)) redirect("/change-password");

  const { data: rows } = await supabase
    .from("memberships")
    .select("role, tenants(slug, name)")
    .eq("user_id", claims.sub)
    .order("created_at")
    .returns<MyTenant[]>();

  // Өөр төхөөрөмж дээр имэйлээ баталгаажуулаад энд нэвтэрсэн бол компанийг нь одоо үүсгэнэ
  if (!rows?.length) {
    // Урилгатай бол энд нэгдээд жагсаалтаа дахин ачаална
    const { data: joined } = await supabase.rpc("accept_invitations");
    if (joined) redirect("/");
    const dest = await finishOnboarding(supabase);
    if (dest) redirect(dest);
  }
  if (rows?.length === 1 && !("companies" in (await searchParams))) redirect(tenantUrl(rows[0].tenants.slug));

  const name = String((claims.user_metadata as { full_name?: string } | undefined)?.full_name ?? "");

  return (
    <div className="flex-1">
    <section className="bg-brand-dark text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-10">
        <header className="mb-10 flex items-center justify-between">
          <Logo light />
          <div className="flex items-center gap-3 text-sm text-white/70">
            <span className="hidden sm:inline">{String(claims.email ?? "")}</span>
            <a href={rootUrl("/guide")} className="hover:text-white">Гарын авлага</a>
            <SignOutButton onDark />
          </div>
        </header>
        <h1 className="text-3xl font-black tracking-tight">Сайн байна уу{name ? `, ${name}` : ""}!</h1>
        <p className="mt-2 text-white/70">Аль компанийнхаа ажлын хэсэг рүү орох вэ?</p>
      </div>
    </section>
    <main className="mx-auto -mt-6 w-full max-w-2xl px-4 pb-10">
      {rows?.length ? (
        <>
          <div className="space-y-3">
            {rows.map(r => (
              <a key={r.tenants.slug} href={tenantUrl(r.tenants.slug)} className="group block">
                <Card className="flex items-center justify-between gap-4 p-5 transition group-hover:border-indigo-300 group-hover:shadow-md">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-black text-white">{initials(r.tenants.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold">{r.tenants.name}</p>
                    <p className="text-sm text-slate-500">
                      {tenantHost(r.tenants.slug)} · {ROLE_LABEL[r.role]}
                    </p>
                  </div>
                  <span className={buttonClass("primary", "shrink-0")}>Орох →</span>
                </Card>
              </a>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Өөр компани нэмж нээх үү?{" "}
            <Link href="/new" className="font-semibold text-indigo-600 hover:underline">
              Шинэ компани нээх
            </Link>
          </p>
        </>
      ) : (
        <Card className="p-6 text-center">
          <p className="font-semibold">Танд одоогоор компани алга</p>
          <p className="mt-2 text-sm text-slate-500">
            Өөрийн компанийг нээх эсвэл ажлынхаа эзэмшигчээс энэ имэйл рүү урилга явуулахыг хүсээрэй.
          </p>
          <Link href="/new" className={buttonClass("primary", "mt-5")}>
            ＋ Компани нээх
          </Link>
        </Card>
      )}
      <div className="mt-8">
        <PushToggle />
      </div>
    </main>
    </div>
  );
}
