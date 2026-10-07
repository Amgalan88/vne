import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/env";
import { normalizeSlug } from "@/lib/slug";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { NewTenantForm } from "./new-tenant-form";

export const metadata: Metadata = { title: "Компани нээх" };

export default async function NewTenantPage({ searchParams }: PageProps<"/new">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const sp = await searchParams;
  const defaults = {
    slug: typeof sp.slug === "string" ? normalizeSlug(sp.slug) : "",
    name: typeof sp.name === "string" ? sp.name : "",
    taken: sp.taken === "1",
  };

  return (
    <AppShell email={String(data.claims.email ?? "")} title="Шинэ компани нээх" subtitle="Компани бүр өөрийн хаяг, баримт, ажилтан, нийтийн хуудастай.">
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <Card className="p-6">
          <NewTenantForm rootDomain={ROOT_DOMAIN} defaults={defaults} />
        </Card>
        <Card className="space-y-3 p-5 text-sm">
          <p className="font-bold">Юу авах вэ</p>
          <ul className="space-y-2 text-slate-600">
            {["Өөрийн хаяг: нэр.hhk.mn", "Нэхэмжлэх, ТМ-1, БМ-3, албан бичиг", "Тамга, гарын үсэг PIN-ээр", "Үнэгүй нийтийн вэб хуудас", "Ажилтан урих (төлбөртэй багц)"].map(t => (
              <li key={t} className="flex gap-2">
                <span className="text-teal-600">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">Хаягийг дараа солих боломжгүй тул сайн бодож сонгоорой.</p>
        </Card>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/?companies" className="font-semibold text-slate-500 hover:text-slate-800">
          ← Миний компаниуд
        </Link>
      </p>
    </AppShell>
  );
}
