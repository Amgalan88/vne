import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SampleSheet } from "@/components/sample-sheet";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/hosts";
import { fmtMoney } from "@/lib/format";
import { PLANS } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Гарын авлага",
  description: "hhk.mn-ийг хэрхэн ашиглах: бүртгүүлэх, тамга оруулах, баримт гаргах, ажилтан урих, төлбөр.",
};

type Section = { id: string; title: string; steps?: string[]; body?: React.ReactNode; tip?: string };

const SECTIONS: Section[] = [
  {
    id: "start",
    title: "Бүртгүүлж эхлэх",
    steps: [
      "hhk.mn нүүр хуудсанд компанийнхаа хаягийг (жишээ нь jishee) бичээд «Үнэгүй эхлэх» дарна.",
      "Компанийн нэр, өөрийн нэр, имэйл, нууц үгээ оруулна.",
      "Имэйлд ирсэн холбоос дээр дарж баталгаажуулна. Ирэхгүй бол Spam хавтсаа шалгана.",
      "Таны компани jishee.hhk.mn хаягаар нээгдэнэ. Дараа нь энэ хаягаар шууд орно.",
    ],
  },
  {
    id: "company",
    title: "Байгууллагын мэдээлэл бөглөх",
    steps: [
      "Дээд цэсний «Тохиргоо» руу орно.",
      "Нэр, хаяг, регистрийн дугаар, банк, дансны дугаар, захирлын нэрээ бөглөөд «Хадгалах» дарна.",
      "Энэ мэдээлэл баримт бүрийн толгой, төлбөрийн хэсэгт автоматаар гарна — дахин бичих шаардлагагүй.",
    ],
  },
  {
    id: "stamp",
    title: "Лого, тамга, гарын үсэг оруулах",
    steps: [
      "«Тохиргоо» хуудасны доод хэсэгт «Лого, тамга, гарын үсэг» хэсэг бий.",
      "Цагаан цаасан дээр тамгаа дарж, гарын үсгээ зураад утсаараа зургийг нь авна.",
      "«Оруулах» дарж зургаа сонгоно (PNG, JPG, 2MB хүртэл).",
      "Горимоо сонгоно: «Үргэлж гаргах», «PIN-ээр нээсэн үед» эсвэл «Гаргахгүй».",
    ],
    tip: "Ил тод дэвсгэртэй PNG зураг хамгийн гоё харагдана. Ажилтан баримт бэлдээд захирал PIN-ээр тамга нээх бол PIN горимыг сонгоно (төлбөртэй багцад).",
  },
  {
    id: "documents",
    title: "Баримт гаргах",
    steps: [
      "«Баримтууд» → «＋ Нэхэмжлэх» (эсвэл бусад төрөл) дарна.",
      "Харилцагчийн нэрийг бичнэ — өмнө нь бичсэн бол жагсаалтаас сонгоход РД, хаяг автоматаар бөглөгдөнө.",
      "Бараа, тоо, үнээ нэмнэ. Нийт дүн, үсгээр бичсэн дүн автоматаар гарна.",
      "«Хадгалах» (эсвэл Ctrl+S) дарна. Дугаар автоматаар олгогдоно.",
      "«🖨 Хэвлэх / PDF» дарж хэвлэнэ эсвэл PDF болгоно.",
    ],
    tip: "Утсан дээр дээд талын «✎ Засах / 👁 Урьдчилж харах» товчоор шилжинэ. Сар бүр давтагддаг нэхэмжлэхийг хуучныг нь нээгээд «⧉ Хуулах» дарж хурдан гаргана. Гарын үсэг зурагч, нягтлангийн нэр зэргийг дараагийн баримтад автоматаар санана.",
  },
  {
    id: "pdf",
    title: "PDF хадгалах, хаана хадгалагддаг вэ",
    steps: [
      "«Хадгалах» дарсан баримт системд хадгалагдаж, «Баримтууд» жагсаалтад үргэлж харагдана. Ямар ч төхөөрөмжөөс нээж болно.",
      "PDF файл авах бол «Хэвлэх / PDF» → хэвлэгчийн оронд «PDF хэлбэрээр хадгалах» (Save as PDF) сонгоно.",
      "Файл «Татаж авсан» (Downloads) хавтсанд орно: Android — Files → Downloads, компьютер — Downloads хавтас.",
    ],
  },
  {
    id: "share",
    title: "PDF татах, харилцагчид холбоосоор илгээх",
    steps: [
      "Баримтаа хадгалаад «⬇ PDF татах» дарна — файл шууд «Татаж авсан» хавтсанд орно.",
      "«🔗 Харилцагчид холбоосоор илгээх» → «Холбоос үүсгэх» дарж холбоосыг хуулна, эсвэл WhatsApp-аар илгээнэ.",
      "Харилцагч нэвтрэлгүйгээр баримтаа харж, PDF татна. Хэрэггүй болбол «Холбоосыг хаах».",
    ],
    tip: "PIN-ээр хамгаалсан тамга холбоосоор харагдахгүй — зөвхөн «Үргэлж гаргах» горимтой тамга гарна.",
  },
  {
    id: "reports",
    title: "Тайлан, хугацаа хэтэрсэн нэхэмжлэх",
    steps: [
      "«Тайлан» цэснээс сар сонгож нийт нэхэмжилсэн, төлөгдсөн, төлөгдөөгүй дүнг харна.",
      "Нэхэмжлэхийн «Төлөх хугацаа» талбарт «14 хоног» гэх мэт бичвэл хугацаа хэтрэхэд жагсаалтад улаанаар тэмдэглэгдэнэ.",
      "Хэтэрсэн нэхэмжлэх дээр «✉ Сануулга» эсвэл «💬 SMS» дарж харилцагчид бэлэн текстээр сануулна. Мөнгө орвол «✓ Төлөгдсөн».",
    ],
  },
  {
    id: "status",
    title: "Баримтын төлөв",
    body: (
      <ul className="space-y-1.5">
        <li><b>Ноорог</b> — бэлдэж байгаа. Жагсаалтад «✎ Засах» товчтой харагдана.</li>
        <li><b>Гаргасан</b> — харилцагчид илгээсэн.</li>
        <li><b>Төлөгдсөн</b> — мөнгө нь орсон.</li>
        <li><b>Цуцалсан</b> — хүчингүй болсон.</li>
      </ul>
    ),
    tip: "Жагсаалтын дээд талын хайлтаар дугаар, харилцагчаар хайж, төрөл, төлвөөр шүүнэ.",
  },
  {
    id: "members",
    title: "Ажилтан урих",
    steps: [
      "«Гишүүд» → «Гишүүн урих» хэсэгт ажилтны имэйл, эрхийг сонгоно.",
      "«Урих» дарна.",
      "Гарч ирсэн урилгын холбоосыг «✉ Имэйлээр илгээх» эсвэл хуулж ажилтанд явуулна.",
      "Ажилтан холбоос дээр дармагц имэйл нь баталгаажиж, өөрийн нууц үгээ тохируулна (24 цаг хүчинтэй).",
    ],
    body: (
      <ul className="mt-3 space-y-1.5 text-sm">
        <li><b>Эзэмшигч</b> — бүх эрх.</li>
        <li><b>Админ</b> — тохиргоо, тамга, гишүүн урих, аудит лог.</li>
        <li><b>Ажилтан</b> — баримт, харилцагч үүсгэх, засах.</li>
        <li><b>Харагч</b> — зөвхөн харах.</li>
      </ul>
    ),
    tip: "Ажилтан урих нь төлбөртэй багцад багтана.",
  },
  {
    id: "billing",
    title: "Багц, төлбөр",
    body: (
      <p>
        <b>Үнэгүй:</b> өдөрт 1 баримт. <b>Төлбөртэй:</b> {PLANS.map(p => `${p.label} ${fmtMoney(p.price)}₮`).join(", ")} — хязгааргүй баримт, ажилтан урих, тамганы PIN, аудит лог, олон ХХК.
      </p>
    ),
    steps: [
      "«Багц» руу орж 1 сар эсвэл 1 жил сонгоно.",
      "Харуулсан данс руу шилжүүлнэ. Гүйлгээний утга дээр компанийнхаа хаягийг (jishee.hhk.mn) заавал бичнэ.",
      "«Төлбөр шилжүүллээ — хүсэлт илгээх» дарна.",
      "Төлбөр шалгагдмагц багц автоматаар идэвхжиж, хуудас өөрөө шинэчлэгдэнэ.",
    ],
  },
  {
    id: "notifications",
    title: "Апп болгон суулгах, мэдэгдэл авах",
    steps: [
      "Android/Chrome: хуудасны доод талын «📲 Апп болгон суулгах» дарна.",
      "iPhone: Safari-д Хуваалцах → «Нүүр дэлгэцэнд нэмэх».",
      "Суулгасан апп-аа нээгээд «🔔 Мэдэгдэл асаах» дарж зөвшөөрнө. Төлбөр баталгаажих зэрэгт мэдэгдэл ирнэ.",
    ],
  },
  {
    id: "legacy",
    title: "Хуучин апп (hhk.mn/umgm)-аас шилжих",
    steps: [
      "Хуучин апп дээр «⬆ Шинэ апп руу» товч дарж файл татна.",
      "Шинэ апп-ын «Тохиргоо» → «Хуучин аппаас импортлох» → файлаа сонгоод «Импортлох».",
      "Бүх баримт, харилцагч шилжинэ. Давхардсан дугаартай баримт алгасагдана.",
    ],
  },
  {
    id: "password",
    title: "Нууц үгээ мартсан",
    steps: ["Нэвтрэх хуудсан дээр «Нууц үгээ мартсан уу?» дарна.", "Имэйлд ирсэн холбоосоор шинэ нууц үг тохируулна."],
  },
];

export default async function GuidePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;

  return (
    <div className="flex-1 bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/"><Logo /></Link>
          {signedIn ? (
            <a href={appUrl()} className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">Ажлын хэсэг рүү →</a>
          ) : (
            <Link href="/signup" className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">Үнэгүй эхлэх</Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Гарын авлага</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">hhk.mn-ийг хэрхэн ашиглах вэ</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">Бүртгүүлэхээс эхлээд баримт гаргах, ажилтан урих, төлбөр хийх хүртэл алхам алхмаар.</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav className="lg:sticky lg:top-20 lg:self-start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Агуулга</p>
            <ol className="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 space-y-12">
            {SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-extrabold tracking-tight">
                  <span className="mr-2 text-indigo-600">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="mt-4 max-w-2xl space-y-3 leading-relaxed text-slate-700">
                  {s.steps && (
                    <ol className="space-y-2">
                      {s.steps.map((st, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{j + 1}</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {s.body}
                  {s.tip && <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-950">💡 {s.tip}</p>}
                </div>
                {s.id === "documents" && (
                  <div className="mt-6 w-fit rounded-xl bg-slate-100 p-3">
                    <SampleSheet type="invoice" zoom="[zoom:0.38] sm:[zoom:0.5]" className="max-h-[440px] rounded-lg sm:max-h-[580px]" />
                    <p className="mt-2 text-center text-xs text-slate-500">Жишээ нэхэмжлэх (ТМ-1) — зохиомол мэдээлэлтэй</p>
                  </div>
                )}
              </section>
            ))}

            <section className="rounded-2xl bg-slate-900 p-6 text-white">
              <h2 className="text-lg font-bold">Асуулт байна уу?</h2>
              <p className="mt-1 text-slate-300">erdenebilegamgalan@gmail.com хаягаар бичээрэй.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
