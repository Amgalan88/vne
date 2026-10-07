import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { rootUrl } from "@/lib/hosts";
import { canManage, ROLE_LABEL } from "@/lib/types";
import { isPro } from "@/lib/billing";
import { Card } from "@/components/ui";
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
            <a href={rootUrl()} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">
              Миний компаниуд
            </a>
            <SignOutButton />
          </div>
        </Card>
      </main>
    );
  }

  const { tenant, role, email } = ctx;
  const links = [
    { href: "/", label: "Баримтууд" },
    { href: "/members", label: "Гишүүд" },
    ...(canManage(role) ? [{ href: "/audit", label: "Аудит лог" }] : []),
    { href: "/billing", label: "Багц" },
  ];
  const pro = isPro(tenant);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-bold">
              <span className="truncate">{tenant.name}</span>
              <Link
                href="/billing"
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${pro ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
              >
                {pro ? "Төлбөртэй" : "Үнэгүй"}
              </Link>
            </p>
            <a href={rootUrl()} className="text-xs text-slate-400 hover:underline">
              hhk.mn
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-slate-600 dark:text-slate-300">{email}</p>
              <p className="text-slate-400">{ROLE_LABEL[role]}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
        <TenantNav links={links} slug={slug} />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
