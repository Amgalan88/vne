import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/hosts";
import { Notice } from "@/components/ui";
import { LoginForm } from "../forms";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return (
    <>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Нэвтрэх</h1>
      {sp.error === "link" && (
        <div className="mb-4">
          <Notice tone="error">Холбоосын хугацаа дууссан эсвэл буруу байна. Дахин оролдоно уу.</Notice>
        </div>
      )}
      <LoginForm next={next} />
      <p className="mt-5 text-center text-sm text-slate-500">
        Бүртгэлгүй юу?{" "}
        <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-slate-900 underline dark:text-slate-100">
          Бүртгүүлэх
        </Link>
      </p>
    </>
  );
}
