import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/env";
import { normalizeSlug } from "@/lib/slug";
import { Logo } from "@/components/logo";
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
    <main className="flex flex-1 items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Компани нээх</h1>
        <p className="mb-6 text-sm text-slate-500">Компани бүр өөрийн хаягтай. Ажилтнуудаа дараа нь урьж нэмнэ.</p>
        <NewTenantForm rootDomain={ROOT_DOMAIN} defaults={defaults} />
        <p className="mt-5 text-center text-sm">
          <Link href="/" className="text-slate-500 underline">
            ← Миний компаниуд
          </Link>
        </p>
      </div>
    </main>
  );
}
