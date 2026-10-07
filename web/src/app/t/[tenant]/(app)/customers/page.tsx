import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import { canEdit, canManage } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/ui";
import { CustomerForm, type CustomerRow } from "./customer-form";
import { DeleteCustomerButton } from "./delete-button";

export const metadata: Metadata = { title: "Харилцагчид" };

export default async function CustomersPage({ params }: PageProps<"/t/[tenant]/customers">) {
  const { tenant: slug } = await params;
  const { tenant, role } = await requireTenant(slug);
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, rd, address, phone, email, note")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .order("name")
    .limit(500)
    .returns<CustomerRow[]>();
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold">Харилцагчид</h1>
        <p className="mt-1 text-sm text-slate-500">Баримт гаргахдаа нэрээр нь сонгоход РД, хаяг, утас автоматаар бөглөгдөнө.</p>
      </div>

      {canEdit(role) && (
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Шинэ харилцагч</h2>
          <CustomerForm tenantId={tenant.id} customer={null} />
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState title="Харилцагч алга">Баримтад бичсэн харилцагч эндээс сонгогдохын тулд эхлээд нэмнэ.</EmptyState>
      ) : (
        <Card className="divide-y divide-slate-100">
          {rows.map(c => (
            <details key={c.id} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="block truncate text-xs text-slate-500">{[c.rd && `РД ${c.rd}`, c.phone, c.email].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="text-xs text-slate-400 group-open:hidden">Засах</span>
              </summary>
              <div className="mt-3 space-y-3">
                {canEdit(role) ? <CustomerForm tenantId={tenant.id} customer={c} /> : <p className="text-sm text-slate-500">{c.address}</p>}
                {canManage(role) && <DeleteCustomerButton tenantId={tenant.id} id={c.id} name={c.name} />}
              </div>
            </details>
          ))}
        </Card>
      )}
    </div>
  );
}
