import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { daysLeft } from "@/lib/billing";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import { rootUrl } from "@/lib/hosts";
import { getBanner } from "@/lib/platform";
import { PushToggle } from "@/components/push-toggle";
import { AutoRefresh } from "@/components/auto-refresh";
import { Card, EmptyState } from "@/components/ui";
import { adminExtend, adminLogout, decidePayment, removeBanner } from "../actions";
import { BannerForm } from "./banner-form";

type Row = {
  id: string;
  created_at: string;
  decided_at: string | null;
  status: "pending" | "confirmed" | "rejected";
  months: number;
  amount: number;
  tenant_slug: string;
  tenant_name: string;
  paid_until: string | null;
  requester_email: string | null;
};

type TenantRow = {
  slug: string; name: string; plan: string; paid_until: string | null; created_at: string;
  members: number; documents: number; owner_email: string | null;
};

const TABS = [
  { key: "overview", label: "Тойм" },
  { key: "payments", label: "Төлбөр" },
  { key: "companies", label: "Компаниуд" },
  { key: "landing", label: "Нүүр хуудас" },
  { key: "errors", label: "Алдаа" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const periodLabel = (m: number) => (m === 12 ? "1 жил" : `${m} сар`);
const STATUS = {
  pending: ["Хүлээгдэж байна", "bg-amber-100 text-amber-800"],
  confirmed: ["Баталгаажсан", "bg-emerald-100 text-emerald-800"],
  rejected: ["Татгалзсан", "bg-slate-200 text-slate-600"],
} as const;

export default async function AdminDashboard({ searchParams }: PageProps<"/admin/dashboard">) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/admin/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const tab: Tab = TABS.some(t => t.key === sp.tab) ? (sp.tab as Tab) : "overview";

  const [{ data }, { data: tdata }, banner, { data: edata }] = await Promise.all([
    supabase.rpc("admin_payments"),
    supabase.rpc("admin_tenants"),
    getBanner(),
    tab === "errors" || tab === "overview" ? supabase.rpc("admin_errors") : Promise.resolve({ data: [] }),
  ]);
  const errors = (edata ?? []) as { id: number; created_at: string; message: string; digest: string | null; url: string | null; user_agent: string | null }[];
  const dayAgo = Date.parse(new Date().toISOString()) - 86_400_000;
  const errors24h = errors.filter(e => Date.parse(e.created_at) > dayAgo).length;
  const rows = (data ?? []) as Row[];
  const tenants = (tdata ?? []) as TenantRow[]; // 005_admin_overview.sql ажиллаагүй бол хоосон
  const pending = rows.filter(r => r.status === "pending");
  const done = rows.filter(r => r.status !== "pending");
  const proTenants = tenants.filter(t => t.plan === "pro" && (daysLeft(t.paid_until) ?? 0) > 0);
  const expiring = proTenants.filter(t => (daysLeft(t.paid_until) ?? 99) <= 7);
  const monthStart = new Date().toISOString().slice(0, 7);
  const monthIncome = rows
    .filter(r => r.status === "confirmed" && (r.decided_at ?? "").slice(0, 7) === monthStart)
    .reduce((s, r) => s + r.amount, 0);

  const stats = [
    { label: "Хүлээгдэж буй төлбөр", value: String(pending.length), href: "?tab=payments", alert: pending.length > 0 },
    { label: "Энэ сарын орлого", value: `${fmtMoney(monthIncome)}₮`, href: "?tab=payments" },
    { label: "Төлбөртэй компани", value: `${proTenants.length} / ${tenants.length}`, href: "?tab=companies" },
    { label: "7 хоногт дуусах", value: String(expiring.length), href: "?tab=companies", alert: expiring.length > 0 },
    { label: "24 цагийн алдаа", value: String(errors24h), href: "?tab=errors", alert: errors24h > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Нүүр хуудасны таб дээр маягт бөглөж байхад шинэчлэхгүй */}
      <AutoRefresh active={tab === "overview" || tab === "payments"} seconds={30} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Платформын удирдлага</h1>
          <p className="mt-1 text-sm text-slate-500">Төлбөр баталгаажуулах, компаниудыг хянах, нүүр хуудсаа тохируулах.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={rootUrl("/guide")} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">Гарын авлага</a>
          <form action={adminLogout}>
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">Гарах</button>
          </form>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-semibold ${tab === t.key ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            {t.label}
            {t.key === "payments" && pending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-xs text-white">{pending.length}</span>
            )}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {stats.map(s => (
              <Link key={s.label} href={s.href} className={`rounded-xl border bg-white p-4 hover:shadow-sm ${s.alert ? "border-amber-300" : "border-slate-200"}`}>
                <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">{s.value}</p>
              </Link>
            ))}
          </div>
          <Card className="space-y-3 p-5">
            <h2 className="font-bold">Мэдэгдэл</h2>
            <p className="text-sm text-slate-500">Төлбөрийн шинэ хүсэлт ирэхэд энэ төхөөрөмж рүү мэдэгдэл ирнэ.</p>
            <PushToggle />
          </Card>
          <Card className="p-5 text-sm">
            <h2 className="font-bold">Өдөр тутмын ажил</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600">
              <li><b>Төлбөр</b> табаас шинэ хүсэлтийг банкны хуулгатай (гүйлгээний утга, дүн) тулгаад «Баталгаажуулах».</li>
              <li><b>Компаниуд</b> табаас хугацаа дуусах гэж буй компаниудыг харна.</li>
              <li><b>Нүүр хуудас</b> табаас урамшууллын баннер солино.</li>
            </ol>
          </Card>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-bold">Хүлээгдэж буй ({pending.length})</h2>
            <p className="text-sm text-slate-500">Банкны хуулгаас гүйлгээний утга (компани.hhk.mn) болон дүнг тулгаж баталгаажуулна. Баталгаажмагц багц шууд идэвхжинэ.</p>
            {pending.length === 0 && <EmptyState title="Шинэ хүсэлт алга" />}
            {pending.map(r => (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-bold">{r.tenant_name}</p>
                    <p className="font-mono text-sm text-slate-500">{r.tenant_slug}.hhk.mn</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {r.requester_email} · {fmtDateTime(r.created_at)}
                      {r.paid_until && ` · одоогийн хугацаа ${fmtDate(r.paid_until)} хүртэл`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold">{fmtMoney(r.amount)}₮</p>
                    <p className="text-sm text-slate-500">{periodLabel(r.months)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <form action={decidePayment.bind(null, r.id, true)}>
                    <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">✓ Баталгаажуулах</button>
                  </form>
                  <form action={decidePayment.bind(null, r.id, false)}>
                    <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100">Татгалзах</button>
                  </form>
                </div>
              </Card>
            ))}
          </section>

          {done.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Түүх</h2>
                <a download href="/admin/export/payments" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">⬇ Excel (CSV)</a>
              </div>
              <Card className="divide-y divide-slate-100">
                {done.map(r => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{r.tenant_name} <span className="font-mono font-normal text-slate-400">{r.tenant_slug}</span></p>
                      <p className="text-slate-500">{fmtMoney(r.amount)}₮ · {periodLabel(r.months)} · {fmtDateTime(r.decided_at ?? r.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
                  </div>
                ))}
              </Card>
            </section>
          )}
        </div>
      )}

      {tab === "companies" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Компаниуд ({tenants.length}) · төлбөртэй {proTenants.length}</h2>
            <a download href="/admin/export/companies" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">⬇ Excel (CSV)</a>
          </div>
          <form className="flex gap-2">
            <input type="hidden" name="tab" value="companies" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Нэр, хаяг, имэйлээр хайх"
              className="w-full rounded-lg border-[1.5px] border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <button className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">Хайх</button>
          </form>
          {tenants.length === 0 ? (
            <EmptyState title="Компани алга">005_admin_overview.sql ажиллаагүй бол энэ жагсаалт хоосон байна.</EmptyState>
          ) : (
            <Card className="divide-y divide-slate-100">
              {tenants
                .filter(t => !q || [t.name, t.slug, t.owner_email ?? ""].some(v => v.toLowerCase().includes(q)))
                .map(t => {
                  const days = daysLeft(t.paid_until);
                  const active = t.plan === "pro" && days !== null && days > 0;
                  return (
                    <div key={t.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {t.name} <a href={`https://${t.slug}.hhk.mn`} target="_blank" className="font-mono font-normal text-slate-400 hover:underline">{t.slug}.hhk.mn</a>
                        </p>
                        <p className="text-slate-500">{t.owner_email} · {t.members} гишүүн · {t.documents} баримт · {fmtDate(t.created_at)}-нд нээсэн</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? (days! <= 7 ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-700") : "bg-slate-100 text-slate-500"}`}>
                          {active ? `Төлбөртэй · ${days} хоног (${fmtDate(t.paid_until!)})` : t.plan === "pro" ? "Хугацаа дууссан" : "Үнэгүй"}
                        </span>
                        <form action={adminExtend.bind(null, t.slug)} className="flex items-center gap-1">
                          <select name="months" defaultValue="1" className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs">
                            <option value="1">+1 сар</option>
                            <option value="3">+3 сар</option>
                            <option value="6">+6 сар</option>
                            <option value="12">+1 жил</option>
                          </select>
                          <button className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white" title="Төлбөргүйгээр гараар сунгах">Сунгах</button>
                        </form>
                      </div>
                    </div>
                  );
                })}
            </Card>
          )}
        </section>
      )}

      {tab === "errors" && (
        <section className="space-y-3">
          <div>
            <h2 className="font-bold">Апп-ын алдаанууд</h2>
            <p className="text-sm text-slate-500">Хэрэглэгчдэд гарсан алдаа энд автоматаар бүртгэгдэнэ (сүүлийн 60 хоног). Код (digest)-оор Vercel-ийн log-оос дэлгэрэнгүйг хайна.</p>
          </div>
          {errors.length === 0 ? (
            <EmptyState title="Алдаа алга ✓">010_v2.sql ажиллаагүй бол энд бүртгэгдэхгүй.</EmptyState>
          ) : (
            <Card className="divide-y divide-slate-100">
              {errors.map(e => (
                <div key={e.id} className="space-y-1 px-4 py-3 text-sm">
                  <p className="break-words font-mono text-xs font-semibold text-red-700">{e.message}</p>
                  <p className="text-xs text-slate-500">
                    {fmtDateTime(e.created_at)} · {e.url}
                    {e.digest && <> · код <span className="font-mono">{e.digest}</span></>}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}

      {tab === "landing" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-bold">Нүүр хуудасны баннер</h2>
            <p className="text-sm text-slate-500">hhk.mn нүүр хуудасны дээд хэсэгт харагдах зураг (урамшуулал, мэдээ). Хадгалмагц шууд солигдоно.</p>
          </div>
          {banner && (
            <Card className="space-y-3 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Одоогийн баннер {banner.enabled ? "· харагдаж байна" : "· нуусан"}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.url} alt={banner.alt} className="w-full rounded-lg border border-slate-200" />
              <form action={removeBanner}>
                <button className="text-sm font-semibold text-red-600 hover:underline">Баннер устгах</button>
              </form>
            </Card>
          )}
          <Card className="p-5">
            <BannerForm link={banner?.link ?? ""} alt={banner?.alt ?? ""} enabled={banner?.enabled ?? true} hasImage={!!banner} />
          </Card>
          <p className="text-sm text-slate-500">
            <a href={rootUrl("/")} target="_blank" className="font-semibold text-indigo-600 underline">Нүүр хуудсыг нээж харах →</a>
          </p>
        </section>
      )}
    </div>
  );
}
