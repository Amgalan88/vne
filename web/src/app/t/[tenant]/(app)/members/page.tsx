import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/tenant";
import { fmtDate } from "@/lib/format";
import { canManage, ROLE_LABEL, type Role } from "@/lib/types";
import { buttonClass, Card } from "@/components/ui";
import { cancelInvitation, changeRole, removeMember } from "./actions";
import { InviteForm } from "./invite-form";
import { Avatar } from "@/components/doc-icon";
import { isPro } from "@/lib/billing";
import { UpgradeNotice } from "@/components/upgrade-notice";

export const metadata: Metadata = { title: "Гишүүд" };

type Member = { user_id: string; role: Role; created_at: string };
type Profile = { id: string; full_name: string; email: string | null };
type Invitation = { id: string; email: string; role: Role; created_at: string };

const ROLE_BADGE: Record<Role, string> = {
  owner: "bg-indigo-100 text-indigo-700",
  admin: "bg-teal-100 text-teal-700",
  staff: "bg-sky-100 text-sky-700",
  viewer: "bg-slate-100 text-slate-600",
};

const ROLE_HELP: [Role, string][] = [
  ["owner", "Бүх эрх, эзэмшил шилжүүлэх, PIN мартсан үед шинэчлэх"],
  ["admin", "Байгууллагын тохиргоо, тамга, гишүүн урих, аудит лог"],
  ["staff", "Баримт, харилцагч үүсгэх, засах (устгахгүй)"],
  ["viewer", "Зөвхөн харах"],
];

export default async function MembersPage({ params }: PageProps<"/t/[tenant]/members">) {
  const { tenant: slug } = await params;
  const { tenant, role: myRole, userId } = await requireTenant(slug);
  const manage = canManage(myRole);

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, role, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at")
    .returns<Member[]>();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", (members ?? []).map(m => m.user_id))
    .returns<Profile[]>();
  const byId = new Map((profiles ?? []).map(p => [p.id, p]));
  const { data: invites } = manage
    ? await supabase
        .from("invitations")
        .select("id, email, role, created_at")
        .eq("tenant_id", tenant.id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })
        .returns<Invitation[]>()
    : { data: [] as Invitation[] };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="mb-3 text-lg font-bold">Гишүүд</h1>
        <Card className="divide-y divide-slate-100 dark:divide-slate-700">
          {members?.map(m => {
            const p = byId.get(m.user_id);
            const isMe = m.user_id === userId;
            // Эрх солих: зөвхөн эзэмшигч, өөрийгөө болон эзэмшигчийг биш
            const editable = myRole === "owner" && !isMe && m.role !== "owner";
            const removable =
              m.role !== "owner" && (isMe || myRole === "owner" || (myRole === "admin" && m.role !== "admin"));
            return (
              <div key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={p?.full_name || p?.email || "?"} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {p?.full_name || p?.email} {isMe && <span className="text-xs font-normal text-slate-400">(та)</span>}
                  </p>
                  <p className="text-sm text-slate-500">{p?.email}</p>
                </div>
                {editable ? (
                  <form action={changeRole.bind(null, tenant.id, m.user_id)} className="flex gap-1">
                    <select name="role" defaultValue={m.role} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
                      <option value="admin">Админ</option>
                      <option value="staff">Ажилтан</option>
                      <option value="viewer">Харагч</option>
                    </select>
                    <button className={buttonClass("light", "px-2 py-1 text-xs")}>Хадгалах</button>
                  </form>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[m.role]}`}>
                    {ROLE_LABEL[m.role]}
                  </span>
                )}
                {removable && (
                  <form action={removeMember.bind(null, tenant.id, m.user_id)}>
                    <button className="text-xs font-semibold text-red-600 hover:underline">{isMe ? "Гарах" : "Хасах"}</button>
                  </form>
                )}
              </div>
            );
          })}
        </Card>
      </section>

      {manage && (
        <section>
          <h2 className="mb-3 font-bold">Гишүүн урих</h2>
          <Card className="p-4">
            {isPro(tenant) ? (
              <InviteForm tenantId={tenant.id} canInviteAdmin={myRole === "owner"} />
            ) : (
              <UpgradeNotice title="Ажилтан урих нь төлбөртэй багцад багтана">
                Ажилтнуудаа урьж, эзэмшигч, админ, ажилтан, харагч гэсэн эрх тохируулна.
              </UpgradeNotice>
            )}
            {!!invites?.length && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Хүлээгдэж буй урилга</p>
                <ul className="space-y-1.5 text-sm">
                  {invites.map(i => (
                    <li key={i.id} className="flex items-center gap-2">
                      <span className="flex-1">
                        {i.email} · {ROLE_LABEL[i.role]} · <span className="text-slate-400">{fmtDate(i.created_at)}</span>
                      </span>
                      <form action={cancelInvitation.bind(null, i.id)}>
                        <button className="text-xs font-semibold text-red-600 hover:underline">Цуцлах</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">Эрхийн түвшин</h2>
        <Card className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
          {ROLE_HELP.map(([r, d]) => (
            <div key={r} className="flex gap-3 px-4 py-2.5">
              <span className="w-24 shrink-0 font-semibold">{ROLE_LABEL[r]}</span>
              <span className="text-slate-500">{d}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
