import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { fmtDate } from "@/lib/format";
import { appUrl, rootUrl } from "@/lib/hosts";
import { canManage, ROLE_LABEL } from "@/lib/types";
import { initials } from "@/lib/site";
import { daysLeft as daysUntil, isPro } from "@/lib/billing";
import { Card } from "@/components/ui";
import { PushToggle } from "@/components/push-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { TenantNav } from "./nav";

export default async function TenantLayout({ children, params }: LayoutProps<"/t/[tenant]">) {
  const { tenant: slug } = await params;
  const ctx = await getTenantContext(slug);
  if (ctx.status === "anon") redirect("/login");
  if (ctx.status === "missing") notFound();

  if (ctx.status === "forbidden") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <Card className="max-w-sm p-6 text-center">
          <p className="text-lg font-bold">Хандах эрхгүй байна</p>
          <p className="mt-2 text-sm text-slate-500">
            <b>{ctx.email}</b> энэ компанийн гишүүн биш байна. Компанийн эзэмшигчээс энэ имэйл рүү урилга явуулахыг хүсээрэй.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <a href={appUrl()} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">
              Миний компаниуд
            </a>
            <SignOutButton />
          </div>
        </Card>
      </main>
    );
  }

  if (ctx.mustChangePassword) redirect("/change-password");
  const { tenant, role, email } = ctx;
  const links = [
    { href: "/documents", label: "Баримтууд" },
    { href: "/customers", label: "Харилцагчид" },
    { href: "/reports", label: "Тайлан" },
    { href: "/members", label: "Гишүүд" },
    ...(canManage(role)
      ? [
          { href: "/settings", label: "Тохиргоо" },
          { href: "/site", label: "Нийтийн хуудас" },
          { href: "/audit", label: "Аудит лог" },
        ]
      : []),
    { href: "/billing", label: "Багц" },
  ];
  const pro = isPro(tenant);
  const daysLeft = daysUntil(tenant.paid_until);
  const expiry =
    tenant.plan === "pro" && daysLeft !== null && daysLeft <= 7 ? { expired: !pro, days: Math.max(daysLeft, 0) } : null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-brand-dark text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black shadow-lg ring-2 ring-white/20">
              {initials(tenant.name)}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-bold">
                <span className="truncate">{tenant.name}</span>
                <Link
                  href="/billing"
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${pro ? "bg-teal-400/20 text-teal-200 ring-1 ring-teal-300/40" : "bg-white/10 text-white/70"}`}
                >
                  {pro ? "Төлбөртэй" : "Үнэгүй"}
                </Link>
              </p>
              <span className="flex gap-3 text-xs text-white/60">
                <a href={appUrl("/?companies")} className="hover:text-white">Миний компаниуд</a>
                <a href={rootUrl("/guide")} className="hover:text-white">Гарын авлага</a>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-white/90">{email}</p>
              <p className="text-white/50">{ROLE_LABEL[role]}</p>
            </div>
            <SignOutButton onDark />
          </div>
        </div>
        <TenantNav links={links} slug={slug} />
      </header>
      {expiry && (
        <div className={`print:hidden ${expiry.expired ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
          <p className="mx-auto max-w-6xl px-4 py-2 text-sm">
            {expiry.expired
              ? `Төлбөртэй багцын хугацаа ${fmtDate(tenant.paid_until!)}-нд дууссан тул үнэгүй багц руу шилжлээ. `
              : `Төлбөртэй багцын хугацаа ${expiry.days} хоногийн дараа (${fmtDate(tenant.paid_until!)}) дуусна. `}
            <Link href="/billing" className="font-semibold underline">Сунгах →</Link>
          </p>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 print:max-w-none print:p-0">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 print:hidden">
        <PushToggle />
      </footer>
    </div>
  );
}
