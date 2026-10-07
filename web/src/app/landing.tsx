import Link from "next/link";
import { Logo } from "@/components/logo";
import { FREE_FEATURES, PRO_FEATURES, PRO_PRICE } from "@/lib/billing";
import { fmtMoney } from "@/lib/format";
import { ROOT_DOMAIN } from "@/lib/env";
import { appUrl } from "@/lib/hosts";
import { SlugClaim } from "@/components/slug-claim";

/* hhk.mn нүүр хуудас (нэвтрээгүй хэрэглэгчид). Харанхуй горимоос үл хамааран цайвар өнгөтэй. */

export function Landing({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="flex-1 bg-white text-slate-900">
      <Nav signedIn={signedIn} />
      <Hero />
      <DocTypes />
      <Features />
      <Steps />
      <StampSecurity />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900">Боломжууд</a>
          <a href="#security" className="hover:text-slate-900">Тамганы хамгаалалт</a>
          <a href="#pricing" className="hover:text-slate-900">Үнэ</a>
          <a href="#faq" className="hover:text-slate-900">Асуулт</a>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <a href={appUrl()} className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Ажлын хэсэг рүү →
            </a>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Нэвтрэх
              </Link>
              <Link href="/signup" className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Үнэгүй эхлэх
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-indigo-100),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Жижиг бизнес, хувь хүнд зориулсан
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Нэхэмжлэх, албан баримтаа{" "}
            <span className="relative whitespace-nowrap text-indigo-600">
              тамгатай нь
              <svg viewBox="0 0 220 12" className="absolute -bottom-1 left-0 h-2.5 w-full" preserveAspectRatio="none" aria-hidden>
                <path d="M2 9c50-6 120-8 216-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".35" />
              </svg>
            </span>{" "}
            1 минутад.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Үнийн санал, НЭХЭМЖЛЭХ (ТМ-1), ЗАРЛАГЫН БАРИМТ (БМ-3), албан бичгийг албан ёсны маягтаар нь гарга.
            Тамга, гарын үсэг PIN-ээр хамгаалагдана. Хэн юу хийсэн бүгд бүртгэгдэнэ.
          </p>
          <div className="mt-8">
            <SlugClaim rootDomain={ROOT_DOMAIN} />
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {["Карт шаардлагагүй", "Утсан дээр ажиллана", "PDF болон хэвлэх"].map(t => (
              <li key={t} className="flex items-center gap-1.5">
                <Check /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroMock />
      </div>
    </section>
  );
}

/** Нэхэмжлэхийн жишээ — тамга, гарын үсэг, аудит логийн мэдэгдэлтэй */
function HeroMock() {
  const rows = [
    ["Хэвлэлийн цаас A4", "20 хайрцаг", "1,100,000"],
    ["Хар бэх HP 85A", "4 ш", "640,000"],
    ["Хүргэлт", "1", "60,000"],
  ];
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-200/60 via-white to-amber-100/60 blur-2xl" />
      <div className="rotate-[1.5deg] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-bold">ЖИШЭЭ ТРЕЙД ХХК</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
              Улаанбаатар, СХД, 9-р хороо
              <br />
              РД: 6622755
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-extrabold tracking-[0.2em] text-slate-700">НЭХЭМЖЛЭХ</p>
            <p className="mt-1 inline-block rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-white">НХ-0043</p>
          </div>
        </div>
        <table className="mt-4 w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
              <th className="pb-2 font-semibold">Бараа</th>
              <th className="pb-2 font-semibold">Тоо</th>
              <th className="pb-2 text-right font-semibold">Дүн</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {rows.map(([n, q, s]) => (
              <tr key={n} className="border-t border-slate-100">
                <td className="py-2">{n}</td>
                <td className="py-2 text-slate-500">{q}</td>
                <td className="py-2 text-right font-medium">{s}₮</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Нийт дүн</span>
          <span className="text-base font-extrabold">1,800,000₮</span>
        </div>
        <div className="relative mt-6 flex h-28 items-end justify-between">
          <div className="text-[11px] text-slate-400">
            <p>Захирал ............ /Ю.Амгалан/</p>
            <p className="mt-3">Нягтлан ............ /Б.Сараа/</p>
          </div>
          <svg viewBox="0 0 120 50" className="absolute bottom-9 left-16 h-10 w-28 text-slate-700/80" aria-hidden>
            <path d="M5 35c10-25 18-25 14 0s12-30 20-10 6 18 16-2 10 8 18 4 14-14 22-6 10 10 20 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <Stamp className="h-28 w-28 -rotate-12" />
        </div>
      </div>

      <div className="absolute -top-5 -left-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold shadow-lg sm:-left-8">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">🔓</span>
        Тамга PIN-ээр нээгдлээ
      </div>
      <div className="absolute -bottom-12 -right-2 w-60 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg sm:-right-6">
        <p className="font-semibold text-slate-400">Аудит лог · 2 мин өмнө</p>
        <p className="mt-1 text-slate-700">
          <b>Б.Сараа</b> — НХ-0043-ийн дүн <span className="whitespace-nowrap">1,740,000₮ → 1,800,000₮</span>
        </p>
      </div>
    </div>
  );
}

function Stamp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`text-indigo-600/80 ${className}`} aria-hidden>
      <defs>
        <path id="stamp-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fill="currentColor" fontSize="8.6" fontWeight="700" letterSpacing="0.8">
        <textPath href="#stamp-ring">ЖИШЭЭ ТРЕЙД ХХК • УЛААНБААТАР ХОТ •</textPath>
      </text>
      <text x="60" y="57" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700">РД</text>
      <text x="60" y="70" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="800">6622755</text>
    </svg>
  );
}

function DocTypes() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-sm font-semibold text-slate-500 sm:px-6">
        <span className="text-xs uppercase tracking-widest text-slate-400">Баримтын төрлүүд</span>
        {["Үнийн санал", "Нэхэмжлэх · ТМ-1", "Зарлагын баримт · БМ-3", "Албан бичиг"].map(t => (
          <span key={t} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: "🏢", title: "Компанийн өөрийн хаяг", text: "jishee.hhk.mn гэх мэт тусдаа хаягаар орно. Өгөгдөл тань бусад компаниас бүрэн тусгаарлагдсан." },
  { icon: "🔒", title: "Тамга PIN-ээр хамгаалагдана", text: "Тамга, гарын үсгийг үргэлж, PIN-ээр, эсвэл огт гаргахгүй гэж тохируулна. Ажилтан бэлдээд, захирал PIN-ээр тамгална." },
  { icon: "📜", title: "Хэн юу хийсэн бүгд харагдана", text: "Баримт үүсгэх, дүн засах, тамга нээх — бүх үйлдэл цаг, хүнтэй нь бүртгэгдэж, хэн ч устгаж чадахгүй." },
  { icon: "🧾", title: "Албан ёсны маягт", text: "НЭХЭМЖЛЭХ ТМ-1, ЗАРЛАГЫН БАРИМТ БМ-3-ыг хэвлэмэл маягттай яг адил. Дүнг үсгээр автоматаар бичнэ." },
  { icon: "👥", title: "Багаараа ажиллана", text: "Ажилтнаа имэйлээр урь. Эзэмшигч, админ, ажилтан, харагч гэсэн эрхийн түвшинтэй." },
  { icon: "🏷️", title: "Олон ХХК нэг дор", text: "Хэд хэдэн компанийн нэрээр баримт гаргадаг бол нэг аккаунтаас сонгоод л гаргана." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <SectionHead eyebrow="Боломжууд" title="Word, Excel загвараас салах цаг болсон" text="Баримт бүрийг гараар засах, тамга дарах, дугаар давхардах асуудлыг нэг дор шийднэ." />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(f => (
          <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">{f.icon}</div>
            <h3 className="mt-4 font-bold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    ["Бүртгүүл", "Имэйлээрээ бүртгүүлээд компанийнхаа хаягийг сонго."],
    ["Тамга, логогоо оруул", "Байгууллагын мэдээлэл, лого, тамга, гарын үсгээ нэг удаа оруулна."],
    ["Баримтаа гарга", "Бараагаа нэмээд PDF болгох эсвэл шууд хэвлэ."],
  ];
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead eyebrow="Хэрхэн ажилладаг" title="3 алхамд эхэлнэ" />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StampSecurity() {
  return (
    <section id="security" className="scroll-mt-20 bg-slate-950 py-24 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">Тамганы хамгаалалт</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Тамгаа утсандаа, аюулгүй.</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Тамганы зураг хаалттай хадгалагдаж, PIN оруулаагүй хүнд огт харагдахгүй. Хэвлэх бүрт хэн нээснийг бүртгэнэ.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ["Ажилтан бэлдэнэ, захирал тамгална", "Ажилтан баримтаа бэлдээд, захирал PIN оруулмагц тамга орно."],
              ["Буруу оролдлогод түгжигдэнэ", "5 удаа буруу PIN оруулбал 15 минут түгжигдэнэ."],
              ["Сервер шалгана", "PIN-ийг таны төхөөрөмж биш, сервер шалгадаг тул тойрох боломжгүй."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                  <Check />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-white/25">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <p className="mt-6 font-semibold">Тамга, гарын үсэгтэй хэвлэх</p>
          <p className="mt-1 text-sm text-slate-400">PIN кодоо оруулна уу</p>
          <div className="mt-5 flex justify-center gap-3">
            {[1, 1, 1, 0].map((on, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full ${on ? "bg-white" : "border-2 border-white/40"}`} />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-lg font-semibold">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => (
              <span key={n} className="rounded-xl bg-white/5 py-2.5 text-slate-200">{n}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Үнэгүй", price: "0₮", note: "үргэлж", items: FREE_FEATURES, cta: "Үнэгүй эхлэх" },
    { name: "Төлбөртэй", price: `${fmtMoney(PRO_PRICE)}₮`, note: "сард", items: ["Үнэгүй багцын бүх боломж", ...PRO_FEATURES], cta: "Эхлэх", featured: true },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <SectionHead eyebrow="Үнэ" title="Энгийн, ил тод үнэ" text="Үнэгүй эхэлж, хэрэгтэй үедээ л шилжинэ. Гэрээ, нууц нөхцөл байхгүй." />
      <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
        {plans.map(p => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl p-7 ${p.featured ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900" : "border border-slate-200 bg-white"}`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">Түгээмэл</span>
            )}
            <p className={`font-semibold ${p.featured ? "text-slate-300" : "text-slate-500"}`}>{p.name}</p>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
              <span className={p.featured ? "text-slate-400" : "text-slate-500"}>/ {p.note}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {p.items.map(i => (
                <li key={i} className="flex items-center gap-2">
                  <span className={p.featured ? "text-indigo-300" : "text-indigo-600"}>
                    <Check />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`mt-8 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${p.featured ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-700"}`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const qa = [
    ["Хувь хүн ашиглаж болох уу?", "Болно. Тамгагүй бол гарын үсгээ л оруулаад, тамганы горимыг \"Унтраасан\" болгоно."],
    ["Миний өгөгдөл аюулгүй юу?", "Компани бүрийн өгөгдөл өгөгдлийн сангийн түвшинд тусгаарлагдсан. Тамга, гарын үсгийн зураг хаалттай хадгалагдаж, зөвхөн эрхтэй хүнд түр холбоосоор харагдана."],
    ["Утсан дээр ажиллах уу?", "Тийм. Утасныхаа хөтчөөр нээгээд шууд ашиглана, суулгах шаардлагагүй."],
    ["Яаж төлөх вэ?", "Хаан банкны данс руу шилжүүлж, гүйлгээний утга дээр компанийнхаа хаягийг (жишээ нь tumen.hhk.mn) бичнэ. Дансны мэдээлэл нэвтэрсний дараа \"Багц\" хэсэгт байгаа. Төлбөр орсноос хойш ажлын 1 өдрийн дотор идэвхжинэ."],
    ["Үнэгүй багцад юу багтах вэ?", "Өдөрт 1 баримт, бүх маягт, тамга, гарын үсэг, PDF болон хэвлэх. Ажилтан урих, тамганы PIN, аудит лог, олон ХХК нь төлбөртэй багцад."],
    ["eBarimt-тай холбогдох уу?", "Одоогоор үгүй. eBarimt болон QPay-ээр төлбөр авах боломжийг дараагийн шатанд нэмнэ."],
    ["Ажилтан маань тамгыг дураараа хэрэглэвэл яах вэ?", "Тамгыг PIN-ээр хамгаалвал зөвхөн PIN мэдэх хүн тамгална. Хэн хэзээ нээсэн нь аудит логт үлдэнэ."],
  ];
  return (
    <section id="faq" className="scroll-mt-20 bg-slate-50 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead eyebrow="Асуулт хариулт" title="Түгээмэл асуултууд" />
        <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {qa.map(([q, a]) => (
            <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-6 py-14 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-indigo-400/30" />
        <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Анхны баримтаа өнөөдөр гарга</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-indigo-100">Компанийнхаа хаягийг аваад 1 минутад эхэл. Карт шаардлагагүй.</p>
        <div className="relative mx-auto mt-8 flex justify-center text-left">
          <SlugClaim rootDomain={ROOT_DOMAIN} onDark />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <Logo />
        <p>© {new Date().getFullYear()} hhk.mn · Улаанбаатар</p>
      </div>
    </footer>
  );
}

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-slate-600">{text}</p>}
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
