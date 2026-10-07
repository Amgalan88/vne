import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/ui";
import { ResetForm } from "../forms";

export const metadata: Metadata = { title: "Шинэ нууц үг" };

export default async function ResetPasswordPage() {
  // Имэйлийн холбоосоор /auth/confirm-оор орж ирэхэд түр session үүссэн байх ёстой
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Шинэ нууц үг тохируулах</h1>
      {data?.claims ? (
        <ResetForm />
      ) : (
        <>
          <Notice tone="error">Холбоосын хугацаа дууссан эсвэл буруу байна.</Notice>
          <p className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="font-semibold underline">
              Дахин холбоос авах
            </Link>
          </p>
        </>
      )}
    </>
  );
}
