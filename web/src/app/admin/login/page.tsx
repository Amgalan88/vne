import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { AdminLoginForm } from "./form";

export default async function AdminLoginPage() {
  if (await getAdminClient()) redirect("/admin/dashboard");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Админ нэвтрэх</h1>
      <p className="mb-6 text-sm text-slate-500">Имэйлд ирэх нэг удаагийн кодоор нэвтэрнэ.</p>
      <AdminLoginForm />
    </div>
  );
}
