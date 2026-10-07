import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { tenantFromHost } from "@/lib/hosts";
import { Logo } from "@/components/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Дэд домэйн дээр нэвтэрч байгаа бол компанийн нэрийг харуулна
  const slug = tenantFromHost((await headers()).get("host"));
  let tenantName: string | null = null;
  if (slug) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("tenant_by_slug", { p_slug: slug });
    tenantName = data?.[0]?.name ?? null;
  }

  return (
    <div className="grid flex-1 bg-white text-slate-900 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <Logo light />
        <div className="relative">
          <p className="text-3xl font-extrabold leading-tight tracking-tight">
            Нэхэмжлэх, албан баримтаа
            <br />
            тамгатай нь 1 минутад.
          </p>
          <ul className="mt-8 space-y-3 text-slate-300">
            <li>🏢 Компанийн өөрийн хаяг</li>
            <li>🔒 Тамга, гарын үсэг PIN-ээр хамгаалагдана</li>
            <li>📜 Хэн юу хийсэн бүгд бүртгэгдэнэ</li>
          </ul>
        </div>
        <p className="relative text-sm text-slate-500">© hhk.mn</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {tenantName && (
            <p className="mb-4 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{tenantName}</p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
