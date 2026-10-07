import Link from "next/link";
import { redirect } from "next/navigation";
import { finishOnboarding } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { tenantHost, tenantUrl } from "@/lib/hosts";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { buttonClass, Card, EmptyState } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/logo";
import { Landing } from "./landing";

type MyTenant = { role: Role; tenants: { slug: string; name: string } };

// hhk.mn — нэвтрээгүй бол танилцуулга, нэвтэрсэн бол өөрийн компаниуд
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) return <Landing />;

  const { data: rows } = await supabase
    .from("memberships")
    .select("role, tenants(slug, name)")
    .eq("user_id", claims.sub)
    .order("created_at")
    .returns<MyTenant[]>();

  // Өөр төхөөрөмж дээр имэйлээ баталгаажуулаад энд нэвтэрсэн бол компанийг нь одоо үүсгэнэ
  if (!rows?.length) {
    const dest = await finishOnboarding(supabase);
    if (dest) redirect(dest);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden sm:inline">{String(claims.email ?? "")}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Миний компаниуд</h1>
        <Link href="/new" className={buttonClass("dark")}>
          ＋ Компани нээх
        </Link>
      </div>

      {rows?.length ? (
        <div className="space-y-2">
          {rows.map(r => (
            <a key={r.tenants.slug} href={tenantUrl(r.tenants.slug)} className="block">
              <Card className="flex items-center justify-between p-4 transition hover:border-slate-400">
                <div>
                  <p className="font-semibold">{r.tenants.name}</p>
                  <p className="text-sm text-slate-500">{tenantHost(r.tenants.slug)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {ROLE_LABEL[r.role]}
                </span>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState title="Танд одоогоор компани алга">
          Шинэ компани нээх эсвэл компанийнхаа эзэмшигчээс урилга авна уу.
        </EmptyState>
      )}
    </main>
  );
}

