import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";
import { Card } from "@/components/ui";
import { deleteInquiry, setInquiryHandled } from "./actions";

type Inquiry = { id: string; name: string; phone: string; message: string; handled: boolean; created_at: string };

/** Нийтийн хуудасны маягтаар ирсэн захиалга, асуултууд */
export async function Inquiries({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_inquiries")
    .select("id, name, phone, message, handled, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<Inquiry[]>();
  if (error || !data?.length) return null; // 010_v2.sql ажиллаагүй эсвэл хүсэлт алга
  const open = data.filter(i => !i.handled).length;

  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-bold">
        📥 Ирсэн хүсэлтүүд {open > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{open} шинэ</span>}
      </p>
      <ul className="divide-y divide-slate-100">
        {data.map(i => (
          <li key={i.id} className={`flex flex-wrap items-start justify-between gap-3 py-3 text-sm ${i.handled ? "opacity-60" : ""}`}>
            <div className="min-w-0">
              <p className="font-semibold">
                {i.name} · <a href={`tel:${i.phone.replace(/\s/g, "")}`} className="text-indigo-600 hover:underline">{i.phone}</a>
              </p>
              {i.message && <p className="mt-0.5 whitespace-pre-line text-slate-600">{i.message}</p>}
              <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(i.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <form action={setInquiryHandled.bind(null, i.id, !i.handled)}>
                <button className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50">{i.handled ? "Буцаах" : "✓ Шийдсэн"}</button>
              </form>
              <form action={deleteInquiry.bind(null, i.id)}>
                <button className="px-1 text-xs text-red-600 hover:underline">Устгах</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
