import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { tenantUrl } from "@/lib/hosts";
import { fmtDate } from "@/lib/format";
import type { Service } from "@/lib/site";

/**
 * Өдөр бүр Vercel Cron дууддаг (web/vercel.json → 09:00 Улаанбаатарын цагаар).
 * 1) Төлбөртэй багц 7 хоног / 1 хоногийн дараа дуусах, эсвэл өнөөдөр дууссан компанийн эзэмшигчид имэйл + push
 * 2) Нийтийн хуудаснаас хасагдсан (ашиглагдаагүй) үйлчилгээний зургийг storage-оос цэвэрлэнэ
 * Хамгаалалт: Vercel нь "Authorization: Bearer $CRON_SECRET" толгойтой дууддаг.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 86_400_000;
const ubDate = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY тохируулаагүй" }, { status: 500 });

  const report = { reminders: 0, cleaned: 0 };
  const today = ubDate(new Date());
  const in7 = ubDate(new Date(Date.now() + 7 * DAY));
  const in1 = ubDate(new Date(Date.now() + DAY));

  // ── 1. Багц дуусах сануулга ──
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name, slug, paid_until")
    .eq("plan", "pro")
    .gte("paid_until", new Date(Date.now() - 2 * DAY).toISOString())
    .lte("paid_until", new Date(Date.now() + 8 * DAY).toISOString());

  for (const t of tenants ?? []) {
    const end = ubDate(new Date(t.paid_until));
    const kind = end === in7 ? "7" : end === in1 ? "1" : end === today ? "0" : null;
    if (!kind) continue;
    const { data: owners } = await admin.from("memberships").select("user_id").eq("tenant_id", t.id).in("role", ["owner", "admin"]);
    const ids = (owners ?? []).map(o => o.user_id);
    if (!ids.length) continue;
    const { data: profiles } = await admin.from("profiles").select("email").in("id", ids);
    const billing = tenantUrl(t.slug, "/billing");
    const subject =
      kind === "0" ? `${t.name} — төлбөртэй багцын хугацаа өнөөдөр дууслаа` : `${t.name} — төлбөртэй багц ${kind} хоногийн дараа дуусна`;
    const html =
      kind === "0"
        ? `<p><b>${t.name}</b>-ийн төлбөртэй багцын хугацаа өнөөдөр (${fmtDate(t.paid_until)}) дууссан тул үнэгүй багц руу шилжлээ. Өгөгдөл тань хэвээр.</p><p><a href="${billing}">Сунгах →</a></p>`
        : `<p><b>${t.name}</b>-ийн төлбөртэй багц <b>${fmtDate(t.paid_until)}</b>-нд дуусна. Тасралтгүй ашиглахын тулд урьдчилан сунгаарай.</p><p><a href="${billing}">Сунгах →</a></p>`;
    for (const p of profiles ?? []) {
      if (!p.email) continue;
      await sendMail(p.email, subject, html);
      await sendPush(p.email, { title: subject, body: "Багц, төлбөр хуудсаас сунгана уу", url: billing });
      report.reminders++;
    }
  }

  // ── 2. Ашиглагдаагүй үйлчилгээ / цомгийн зураг (1 хоногоос хуучин) ──
  const { data: sites } = await admin.from("tenant_sites").select("*");
  for (const s of sites ?? []) {
    const used = new Set([...((s.services ?? []) as Service[]).map(x => x.image), ...((s.gallery ?? []) as string[])].filter(Boolean));
    const { data: files } = await admin.storage.from("sites").list(s.tenant_id, { limit: 1000 });
    const stale = (files ?? [])
      .filter(f => (f.name.startsWith("svc-") || f.name.startsWith("gal-")) && !used.has(`${s.tenant_id}/${f.name}`))
      .filter(f => (f.created_at ? Date.now() - Date.parse(f.created_at) > DAY : false))
      .map(f => `${s.tenant_id}/${f.name}`);
    if (stale.length) {
      await admin.storage.from("sites").remove(stale);
      report.cleaned += stale.length;
    }
  }

  return NextResponse.json({ ok: true, ...report });
}
