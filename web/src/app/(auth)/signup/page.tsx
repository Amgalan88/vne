import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { safeNext, tenantFromHost } from "@/lib/hosts";
import { ROOT_DOMAIN } from "@/lib/env";
import { normalizeSlug } from "@/lib/slug";
import { SignupForm } from "../forms";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  // Компанийн дэд домэйн дээр бол урилгаар нэгдэж байна — шинэ компани үүсгэхгүй
  const onTenant = !!tenantFromHost((await headers()).get("host"));
  const slug = typeof sp.slug === "string" ? normalizeSlug(sp.slug) : "";

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">{onTenant ? "Бүртгүүлэх" : "Үнэгүй эхлэх"}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {onTenant
          ? "Урилга ирсэн имэйлээрээ бүртгүүлнэ үү."
          : "Компанийн хаягаа сонгоод бүртгүүл. Имэйлээ баталгаажуулмагц шууд ажиллаж эхэлнэ."}
      </p>
      <SignupForm next={next} company={onTenant ? null : { slug, rootDomain: ROOT_DOMAIN }} />
      <p className="mt-5 text-center text-sm text-slate-500">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="font-semibold text-slate-900 underline">
          Нэвтрэх
        </Link>
      </p>
      {!onTenant && (
        <p className="mt-3 text-center text-xs text-slate-400">
          Ажлаасаа урилга авсан бол компанийнхаа хаягаар (жишээ нь tumen.{ROOT_DOMAIN}/signup) бүртгүүлнэ.
        </p>
      )}
    </>
  );
}
