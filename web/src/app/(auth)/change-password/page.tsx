import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "../forms";

export const metadata: Metadata = { title: "Нууц үг солих" };

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Шинэ нууц үгээ тохируулна уу</h1>
      <p className="mb-6 text-sm text-slate-500">Танд түр нууц үг өгсөн байна. Үргэлжлүүлэхийн өмнө өөрийн нууц үгээ сонгоно уу.</p>
      <ResetForm />
    </>
  );
}
