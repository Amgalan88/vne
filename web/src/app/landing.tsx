import Link from "next/link";
import { Logo } from "@/components/logo";
import { FREE_FEATURES, PLANS, PRO_FEATURES, PRO_PRICE } from "@/lib/billing";
import { fmtMoney } from "@/lib/format";
import { ROOT_DOMAIN } from "@/lib/env";
import { appUrl } from "@/lib/hosts";
import { SlugClaim } from "@/components/slug-claim";
import { SampleSheet } from "@/components/sample-sheet";
import type { Banner } from "@/lib/platform";
import type { DocType } from "@/lib/types";

/* hhk.mn нүүр хуудас (нэвтрээгүй хэрэглэгчид). Харанхуй горимоос үл хамааран цайвар өнгөтэй. */

export function Landing({ signedIn = false, banner = null }: { signedIn?: boolean; banner?: Banner | null }) {
  return (
    <div className="flex-1 bg-white text-slate-900">
      <Nav signedIn={signedIn} />
      {banner?.enabled && <PromoBanner banner={banner} />}
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
          <Link href="/guide" className="hover:text-slate-900">Гарын авлага</Link>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <a href={appUrl()} className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:brightness-110">
              Ажлын хэсэг рүү →
            </a>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Нэвтрэх
              </Link>
              <Link href="/signup" className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:brightness-110">
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
      {/* Дээд хэсэг — цагаан дэвсгэр дээр уриа (постерын дээд хэсэгтэй адил) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,var(--color-indigo-50),transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-14 text-center sm:px-6 lg:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
          Жижиг, дунд бизнест зориулсан
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-brand-navy sm:text-6xl lg:text-7xl">
          Бизнесээ өргөжүүлээрэй. <span className="text-brand">Үнэгүй!</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          Компанийн өөрийн хаяг, вэб хуудас, албан бичиг, нэхэмжлэх — дижитал тамга, гарын үсэгтэй.
          Багаа нэг дор удирдаж, бүх үйлдэл аюулгүй бүртгэгдэнэ.
        </p>
        <div className="mt-8 flex justify-center text-left">
          <SlugClaim rootDomain={ROOT_DOMAIN} />
        </div>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          {["Карт шаардлагагүй", "Утас, таблет, компьютер", "PDF болон хэвлэх"].map(t => (
            <li key={t} className="flex items-center gap-1.5">
              <Check /> {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Доод хэсэг — гүн хөх сүлжээн дэвсгэр дээр 3 төхөөрөмж, дараа нь 3 багана */}
      <div className="relative mt-14 bg-brand-dark text-white">
        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          <Devices />
        </div>
        <Pillars />
      </div>
    </section>
  );
}

/** Зөөврийн компьютер, таблет, утас — апп-ын гурван гол боломжийг харуулна */
function Devices() {
  return (
    <div className="flex justify-center overflow-hidden pb-10" aria-hidden>
      <div className="relative flex w-[1000px] shrink-0 items-end justify-center gap-6 [zoom:0.36] sm:[zoom:0.62] lg:[zoom:1]">
        <Laptop />
        <Tablet />
        <Phone />
      </div>
    </div>
  );
}

function Laptop() {
  return (
    <div className="w-[520px]">
      <div className="rounded-t-2xl border-[10px] border-b-[14px] border-slate-800 bg-slate-800 shadow-2xl shadow-black/40">
        <div className="h-[300px] overflow-hidden rounded-md bg-white text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-[13px] font-black text-brand-navy">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-brand text-[10px] text-white">Т</span>
              Таны Компани
            </span>
            <span className="flex gap-4 text-[11px] text-slate-500">
              <span>Бидний тухай</span>
              <span>Үйлчилгээ</span>
              <span>Холбоо барих</span>
            </span>
          </div>
          <div className="bg-brand-dark px-6 py-7 text-white">
            <p className="font-mono text-[11px] text-teal-200">🔒 tanykompani.hhk.mn</p>
            <p className="mt-2 text-[26px] font-black leading-tight">Таны компанийн вэб хуудас</p>
            <p className="mt-2 max-w-xs text-[12px] text-slate-200">Компанийн танилцуулга, үйлчилгээ, холбоо барих мэдээлэл — үнэгүй, өөрийн хаягтай.</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold">Холбогдох</span>
              <span className="rounded-md border border-white/40 px-3 py-1.5 text-[11px] font-semibold">Үйлчилгээ</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 p-4">
            {["Бараа нийлүүлэлт", "Хүргэлт", "Засвар үйлчилгээ"].map(t => (
              <div key={t} className="rounded-lg border border-slate-100 p-2.5">
                <div className="h-6 w-6 rounded bg-indigo-50" />
                <p className="mt-1.5 text-[11px] font-semibold">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto h-4 w-[590px] -translate-x-[35px] rounded-b-2xl bg-gradient-to-b from-slate-300 to-slate-400" />
    </div>
  );
}

function DocIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M8 11h8M8 14h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}

function Tablet() {
  const tiles = ["Албан бичиг", "Үнийн санал", "Нэхэмжлэх", "Зарлагын баримт"];
  return (
    <div className="relative z-10 w-[300px] rounded-[28px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-black/50">
      <div className="h-[400px] overflow-hidden rounded-[18px] bg-gradient-to-b from-[#0d2a5c] to-[#0a1f4a] p-4">
        <p className="text-center text-[14px] font-bold">Баримт бичиг үүсгэх</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {tiles.map(t => (
            <div key={t} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-4">
              <DocIcon className="h-9 w-9 text-sky-300" />
              <span className="text-[11px] font-semibold">{t}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-teal-300/80 shadow-[0_0_30px_rgba(45,212,191,0.55)]">
            <div className="absolute inset-2 rounded-full border border-teal-300/50" />
            <svg viewBox="0 0 120 50" className="h-8 w-16 text-teal-200">
              <path d="M5 35c10-25 18-25 14 0s12-30 20-10 6 18 16-2 10 8 18 4 14-14 22-6 10 10 20 2" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-teal-200">Дижитал тамга, гарын үсэг</p>
      </div>
    </div>
  );
}

function Phone() {
  const team = [
    ["Б.Болд", "Эзэмшигч", "bg-indigo-100 text-indigo-700"],
    ["Д.Сараа", "Админ", "bg-teal-100 text-teal-700"],
    ["Г.Тэмүүлэн", "Ажилтан", "bg-slate-100 text-slate-600"],
  ];
  return (
    <div className="w-[170px] rounded-[30px] border-[7px] border-slate-900 bg-slate-900 shadow-2xl shadow-black/50">
      <div className="h-[340px] overflow-hidden rounded-[22px] bg-slate-50 text-slate-900">
        <div className="bg-brand px-3 pt-5 pb-3 text-white">
          <p className="text-[12px] font-bold">Ажилтны удирдлага</p>
        </div>
        <div className="space-y-1.5 p-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Баг</p>
          {team.map(([n, r, c]) => (
            <div key={n} className="flex items-center justify-between rounded-lg bg-white p-1.5 shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-300 to-teal-300" />
                <span className="text-[9.5px] font-semibold">{n}</span>
              </span>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${c}`}>{r}</span>
            </div>
          ))}
          <p className="pt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Аюулгүй нэвтрэлт</p>
          <div className="rounded-lg bg-white p-2 shadow-sm">
            <div className="flex justify-center gap-1.5">
              {[1, 1, 1, 0].map((on, i) => (
                <span key={i} className={`h-2 w-2 rounded-full ${on ? "bg-indigo-600" : "border border-slate-300"}`} />
              ))}
            </div>
            <div className="mt-2 rounded-md bg-brand py-1.5 text-center text-[9px] font-semibold text-white">Нэвтрэх</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PILLARS = [
  {
    title: ["Үнэгүй ландинг", "& домэйн"],
    items: ["tanykompani.hhk.mn хаяг", "Компанийн танилцуулга хуудас", "Утсанд тохирсон"],
    tone: "from-[#0b2a63] to-[#0d3b7a]",
  },
  {
    title: ["Албан бичиг", "& дижитал тамга"],
    items: ["Нэхэмжлэх ТМ-1, БМ-3, үнийн санал", "Тамга, гарын үсэг PIN-ээр", "PDF, хэвлэх нэг товчоор"],
    tone: "from-[#0d3b7a] to-[#0b5f86]",
  },
  {
    title: ["Багийн удирдлага", "& аюулгүй байдал"],
    items: ["Эзэмшигч, админ, ажилтан, харагч", "Хэн юу хийснийг бүртгэнэ", "Өгөгдөл компани бүрт тусдаа"],
    tone: "from-[#0b5f86] to-[#0c8a7c]",
  },
];

function Pillars() {
  return (
    <div className="grid md:grid-cols-3">
      {PILLARS.map(p => (
        <div key={p.title[0]} className={`bg-gradient-to-b ${p.tone} px-6 py-12 text-center`}>
          <h2 className="text-2xl font-black uppercase leading-tight tracking-tight lg:text-3xl">
            {p.title[0]}
            <br />
            {p.title[1]}
          </h2>
          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-sm text-slate-200">
            {p.items.map(i => (
              <li key={i} className="flex items-center justify-center gap-2">
                <span className="text-teal-300"><Check /></span>
                {i}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PromoBanner({ banner }: { banner: Banner }) {
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={banner.url} alt={banner.alt} className="mx-auto block max-h-[320px] w-full max-w-6xl object-cover sm:rounded-2xl" />;
  return (
    <div className="px-0 pt-4 sm:px-6">
      {banner.link ? (
        <a href={banner.link} className="block transition hover:opacity-95">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}

const GALLERY: { type: DocType; title: string; text: string }[] = [
  { type: "invoice", title: "Нэхэмжлэх · ТМ-1", text: "Сангийн сайдын батласан маягт. НӨАТ задлах, дүнг үсгээр." },
  { type: "dispatch", title: "Зарлагын баримт · БМ-3", text: "Бараа хүлээлцэх баримт, хүлээлгэн өгсөн, хүлээн авсан." },
  { type: "quote", title: "Үнийн санал", text: "Лого, өнгө бүхий брэнд загвар. Хүчинтэй хугацаа, нөхцөл." },
  { type: "letter", title: "Албан бичиг", text: "Дугаар, огноо, хаяглалттай албан бичиг тамга, гарын үсэгтэй." },
];

function DocTypes() {
  return (
    <section id="documents" className="scroll-mt-20 border-y border-slate-100 bg-slate-50/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead eyebrow="Баримтын төрлүүд" title="Апп дотор яг ийм баримт гарна" text="Доорх нь жишээ мэдээлэлтэй жинхэнэ загварууд. Өөрийн тамга, гарын үсэг, логотой гарна." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map(g => (
            <figure key={g.type} className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/5">
              <SampleSheet type={g.type} zoom="[zoom:0.36] sm:[zoom:0.33] lg:[zoom:0.3]" className="flex h-[330px] justify-center rounded-lg bg-slate-100 pt-2 sm:h-[300px] lg:h-[270px]" />
              <figcaption className="px-1 pt-3">
                <p className="font-bold">{g.title}</p>
                <p className="mt-1 text-sm text-slate-600">{g.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Зураг дээрх компани, хүмүүсийн нэр, дүн бүгд зохиомол.</p>
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
    <section id="security" className="scroll-mt-20 bg-brand-dark py-24 text-white">
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
    { name: "Төлбөртэй", price: `${fmtMoney(PRO_PRICE)}₮`, note: "сард", items: [`эсвэл 1 жил — ${fmtMoney(PLANS[1].price)}₮ (${fmtMoney(PRO_PRICE * 12 - PLANS[1].price)}₮ хэмнэнэ)`, "Үнэгүй багцын бүх боломж", ...PRO_FEATURES], cta: "Эхлэх", featured: true },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <SectionHead eyebrow="Үнэ" title="Энгийн, ил тод үнэ" text="Үнэгүй эхэлж, хэрэгтэй үедээ л шилжинэ. Гэрээ, нууц нөхцөл байхгүй." />
      <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
        {plans.map(p => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl p-7 ${p.featured ? "bg-brand-dark text-white shadow-2xl shadow-indigo-900/30" : "border border-slate-200 bg-white"}`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Түгээмэл</span>
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
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark px-6 py-14 text-center text-white sm:px-12">
        <h2 className="relative text-3xl font-black tracking-tight sm:text-4xl">Бизнесээ өнөөдөр <span className="text-brand-light">өргөжүүл</span></h2>
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
        <nav className="flex gap-5">
          <Link href="/guide" className="hover:text-slate-800">Гарын авлага</Link>
          <a href="#pricing" className="hover:text-slate-800">Үнэ</a>
          <a href="#faq" className="hover:text-slate-800">Асуулт</a>
        </nav>
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
