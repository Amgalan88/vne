import Link from "next/link";
import { redirect } from "next/navigation";
import { mustChangePassword } from "@/lib/password";
import { finishOnboarding } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { tenantHost, tenantUrl } from "@/lib/hosts";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { buttonClass, Card } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/logo";

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
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-10 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden sm:inline">{String(claims.email ?? "")}</span>
          <SignOutButton />
        </div>
      </header>

      <h1 className="text-2xl font-extrabold tracking-tight">Сайн байна уу{name ? `, ${name}` : ""}!</h1>

      {rows?.length ? (
        <>
          <p className="mt-2 text-slate-500">Аль компанийнхаа ажлын хэсэг рүү орох вэ? Компани дээр дарж баримтаа гаргана.</p>
          <div className="mt-6 space-y-3">
            {rows.map(r => (
              <a key={r.tenants.slug} href={tenantUrl(r.tenants.slug)} className="group block">
                <Card className="flex items-center justify-between gap-4 p-5 transition group-hover:border-indigo-300 group-hover:shadow-md">
                  <div className="min-w-0">
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
        <Card className="mt-6 p-6 text-center">
          <p className="font-semibold">Танд одоогоор компани алга</p>
          <p className="mt-2 text-sm text-slate-500">
            Өөрийн компанийг нээх эсвэл ажлынхаа эзэмшигчээс энэ имэйл рүү урилга явуулахыг хүсээрэй.
          </p>
          <Link href="/new" className={buttonClass("primary", "mt-5")}>
            ＋ Компани нээх
          </Link>
        </Card>
      )}
    </main>
  );
}
