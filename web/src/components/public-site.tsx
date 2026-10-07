import Link from "next/link";
import { rootUrl } from "@/lib/hosts";
import { coverUrl, initials, THEME, type PublicSiteData, type SiteTemplate } from "@/lib/site";
import { LogoMark } from "@/components/logo";

/* slug.hhk.mn — компанийн нийтийн хуудас. 4 загвар: Орчин үе, Цэвэр, Тод, Харанхуй */

type T = (typeof THEME)[keyof typeof THEME];
type Contact = { icon: string; label: string; value: string; href?: string };

export function PublicSite({ site, member }: { site: PublicSiteData; member: boolean }) {
  const t = THEME[site.color ?? "indigo"] ?? THEME.indigo;
  const tpl: SiteTemplate = site.template ?? "modern";

  if (!site.published) {
    return (
      <div className="flex flex-1 flex-col bg-white text-slate-900">
        <Header site={site} t={t} member={member} tone="light" />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <span className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white ${t.solid}`}>{initials(site.name)}</span>
          <p className="mt-5 text-2xl font-extrabold">{site.name}</p>
          <p className="mt-2 text-slate-500">Компанийн хуудас удахгүй нээгдэнэ.</p>
        </main>
        <Footer tone="light" />
      </div>
    );
  }

  const services = (site.services ?? []).filter(s => s.title);
  const contacts = [
    site.phone && { icon: "📞", label: "Утас", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    site.email && { icon: "✉️", label: "Имэйл", value: site.email, href: `mailto:${site.email}` },
    site.address && { icon: "📍", label: "Хаяг", value: site.address },
    site.facebook && { icon: "💬", label: "Facebook", value: "Facebook хуудас", href: site.facebook.startsWith("http") ? site.facebook : `https://${site.facebook}` },
  ].filter(Boolean) as Contact[];
  const cover = coverUrl(site.cover_path);
  const props = { site, t, member, services, contacts, cover };

  return (
    <div className={`flex-1 ${tpl === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"}`}>
      {tpl === "modern" && <Modern {...props} />}
      {tpl === "clean" && <Clean {...props} />}
      {tpl === "bold" && <Bold {...props} />}
      {tpl === "dark" && <Dark {...props} />}
      <Footer tone={tpl === "dark" ? "dark" : "light"} />
    </div>
  );
}

type P = { site: PublicSiteData; t: T; member: boolean; services: { title: string; text: string }[]; contacts: Contact[]; cover: string | null };

/* ───────────── Нийтлэг хэсгүүд ───────────── */

function Header({ site, t, member, tone }: { site: PublicSiteData; t: T; member: boolean; tone: "light" | "dark" | "overlay" }) {
  const onDark = tone !== "light";
  const wrap =
    tone === "overlay" ? "absolute inset-x-0 top-0 z-20" : tone === "dark" ? "border-b border-white/10 bg-slate-950/80 backdrop-blur" : "border-b border-slate-100 bg-white/90 backdrop-blur";
  return (
    <header className={`${wrap} ${tone !== "overlay" ? "sticky top-0 z-20" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg ${t.solid} ${onDark ? "ring-2 ring-white/30" : ""}`}>
            {initials(site.name)}
          </span>
          <span className={`truncate text-lg font-extrabold ${onDark ? "text-white" : ""}`}>{site.name}</span>
        </div>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <a href="#services" className={`hidden rounded-lg px-3 py-2 sm:block ${onDark ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>Үйлчилгээ</a>
          <a href="#contact" className={`hidden rounded-lg px-3 py-2 sm:block ${onDark ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>Холбоо барих</a>
          {member ? (
            <Link href="/documents" className={`rounded-lg px-3.5 py-2 ${onDark ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}>Ажлын хэсэг →</Link>
          ) : (
            <Link href="/login" className={`rounded-lg px-3 py-2 ${onDark ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>Нэвтрэх</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function CtaButtons({ contacts, t, onDark }: { contacts: Contact[]; t: T; onDark: boolean }) {
  const phone = contacts.find(c => c.label === "Утас");
  return (
    <div className="mt-9 flex flex-wrap gap-3">
      {phone?.href && (
        <a href={phone.href} className={`rounded-xl px-5 py-3 text-sm font-bold shadow-lg ${onDark ? "bg-white text-slate-900 hover:bg-slate-100" : `${t.solid} text-white hover:opacity-90`}`}>
          📞 {phone.value}
        </a>
      )}
      <a href="#contact" className={`rounded-xl px-5 py-3 text-sm font-bold ${onDark ? "border border-white/40 text-white hover:bg-white/10" : "border border-slate-300 hover:bg-slate-50"}`}>
        Холбоо барих
      </a>
    </div>
  );
}

function Cover({ cover, site, t, className = "" }: { cover: string | null; site: PublicSiteData; t: T; className?: string }) {
  if (cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cover} alt={site.name} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${t.grad} ${className}`}>
      <div className="absolute inset-0 bg-network opacity-70" />
      <span className="relative text-7xl font-black tracking-tight text-white/90">{initials(site.name)}</span>
    </div>
  );
}

function ContactCards({ contacts, t, tone }: { contacts: Contact[]; t: T; tone: "light" | "dark" }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {contacts.map(c => {
        const body = (
          <>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${tone === "dark" ? "bg-white/10" : t.soft}`}>{c.icon}</span>
            <span className="min-w-0">
              <span className={`block text-xs font-semibold uppercase tracking-wide ${tone === "dark" ? "text-white/50" : "text-slate-400"}`}>{c.label}</span>
              <span className="block whitespace-pre-line font-semibold">{c.value}</span>
            </span>
          </>
        );
        const cls = `flex items-center gap-4 rounded-2xl p-5 transition ${tone === "dark" ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-slate-200 bg-white hover:shadow-md"}`;
        return c.href ? (
          <a key={c.label} href={c.href} target={c.label === "Facebook" ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>{body}</a>
        ) : (
          <div key={c.label} className={cls}>{body}</div>
        );
      })}
    </div>
  );
}

function Eyebrow({ children, className }: { children: React.ReactNode; className: string }) {
  return <p className={`text-sm font-bold uppercase tracking-[0.18em] ${className}`}>{children}</p>;
}

function Footer({ tone }: { tone: "light" | "dark" }) {
  return (
    <footer className={tone === "dark" ? "border-t border-white/10 bg-slate-950" : "border-t border-slate-100 bg-white"}>
      <div className={`mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-6 text-sm sm:px-6 ${tone === "dark" ? "text-slate-500" : "text-slate-400"}`}>
        <LogoMark className="h-5 w-5" />
        <a href={rootUrl()} className="hover:underline">HHK.MN дээр бүтээв — өөрийн компанийн хуудсаа үнэгүй нээ</a>
      </div>
    </footer>
  );
}

/* ───────────── 1. Орчин үе ───────────── */

function Modern({ site, t, member, services, contacts, cover }: P) {
  return (
    <>
      <section className={`relative overflow-hidden bg-gradient-to-br ${t.grad} text-white`}>
        <div className="absolute inset-0 bg-network" />
        <Header site={site} t={t} member={member} tone="overlay" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-32 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-40 lg:pb-28">
          <div>
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">{site.slug}.hhk.mn</span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{site.name}</h1>
            {site.headline && <p className="mt-5 max-w-xl text-lg text-white/85 sm:text-xl">{site.headline}</p>}
            <CtaButtons contacts={contacts} t={t} onDark />
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl shadow-black/30 ring-1 ring-white/20">
            <Cover cover={cover} site={site} t={t} />
          </div>
        </div>
      </section>

      {site.about && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <Eyebrow className={t.text}>Бидний тухай</Eyebrow>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Танд итгэлтэй түнш</h2>
            </div>
            <p className="whitespace-pre-line text-lg leading-relaxed text-slate-600">{site.about}</p>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section id="services" className="scroll-mt-20 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Eyebrow className={t.text}>Бүтээгдэхүүн, үйлчилгээ</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Бидний санал болгох зүйлс</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <div key={s.title} className="group rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.grad} text-lg font-black text-white`}>{i + 1}</span>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  {s.text && <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section id="contact" className="scroll-mt-20 px-4 py-20 sm:px-6">
          <div className={`relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br ${t.grad} p-8 text-white sm:p-12`}>
            <div className="absolute inset-0 bg-network" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Холбоо барих</h2>
                <p className="mt-3 text-white/80">Асуух зүйл, захиалга байвал бидэнтэй холбогдоорой.</p>
              </div>
              <ContactCards contacts={contacts} t={t} tone="dark" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── 2. Цэвэр ───────────── */

function Clean({ site, t, member, services, contacts, cover }: P) {
  return (
    <>
      <Header site={site} t={t} member={member} tone="light" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <span className={`inline-block h-1.5 w-14 rounded-full ${t.solid}`} />
          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">{site.name}</h1>
          {site.headline && <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">{site.headline}</p>}
          <CtaButtons contacts={contacts} t={t} onDark={false} />
        </div>
        <div className="relative">
          <div className={`absolute -inset-3 -z-10 rotate-2 rounded-[2rem] ${t.soft}`} />
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
            <Cover cover={cover} site={site} t={t} />
          </div>
        </div>
      </section>

      {site.about && (
        <section className={`${t.soft} py-20`}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <Eyebrow className={t.text}>Бидний тухай</Eyebrow>
            <p className="mt-6 whitespace-pre-line text-xl leading-relaxed text-slate-700 sm:text-2xl">{site.about}</p>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section id="services" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6">
          <Eyebrow className={t.text}>Бүтээгдэхүүн, үйлчилгээ</Eyebrow>
          <ol className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {services.map((s, i) => (
              <li key={s.title} className="grid gap-2 py-7 sm:grid-cols-[80px_1fr_2fr] sm:items-baseline">
                <span className={`font-mono text-sm font-bold ${t.text}`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl font-bold">{s.title}</h3>
                {s.text && <p className="leading-relaxed text-slate-600">{s.text}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {contacts.length > 0 && (
        <section id="contact" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-20 sm:px-6">
          <Eyebrow className={t.text}>Холбоо барих</Eyebrow>
          <div className="mt-6">
            <ContactCards contacts={contacts} t={t} tone="light" />
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── 3. Тод ───────────── */

function Bold({ site, t, member, services, contacts, cover }: P) {
  return (
    <>
      <section className={`relative overflow-hidden ${t.solid} text-white`}>
        {cover && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          </>
        )}
        <Header site={site} t={t} member={member} tone="overlay" />
        <div className="relative mx-auto max-w-6xl px-4 pt-36 pb-24 sm:px-6 lg:pt-44 lg:pb-32">
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">{site.name}</h1>
          {site.headline && <p className="mt-6 max-w-2xl text-xl font-medium text-white/90 sm:text-2xl">{site.headline}</p>}
          <CtaButtons contacts={contacts} t={t} onDark />
        </div>
      </section>

      {services.length > 0 && (
        <section id="services" className="scroll-mt-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <div key={s.title} className={`p-10 ${i % 2 === 0 ? "bg-slate-900 text-white" : `${t.soft} text-slate-900`}`}>
                <span className={`text-5xl font-black ${i % 2 === 0 ? t.light : t.text}`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-2xl font-black uppercase tracking-tight">{s.title}</h3>
                {s.text && <p className={`mt-3 leading-relaxed ${i % 2 === 0 ? "text-slate-300" : "text-slate-600"}`}>{s.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {site.about && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
            <h2 className={`text-5xl font-black uppercase tracking-tight ${t.text}`}>Бид</h2>
            <p className="whitespace-pre-line text-xl leading-relaxed text-slate-700">{site.about}</p>
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section id="contact" className={`scroll-mt-20 ${t.solid} py-20 text-white`}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">Холбогдох</h2>
            <div className="mt-8">
              <ContactCards contacts={contacts} t={t} tone="dark" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── 4. Харанхуй ───────────── */

function Dark({ site, t, member, services, contacts, cover }: P) {
  return (
    <>
      <Header site={site} t={t} member={member} tone="dark" />
      <section className="relative overflow-hidden">
        <div className={`pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl ${t.glow}`} />
        <div className="relative mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:px-6 lg:pt-32">
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">{site.name}</h1>
          {site.headline && <p className={`mx-auto mt-6 max-w-2xl text-lg sm:text-xl ${t.light}`}>{site.headline}</p>}
          <div className="flex justify-center">
            <CtaButtons contacts={contacts} t={t} onDark />
          </div>
        </div>
        {cover && (
          <div className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6">
            <div className="aspect-[16/7] overflow-hidden rounded-3xl ring-1 ring-white/10">
              <Cover cover={cover} site={site} t={t} />
            </div>
          </div>
        )}
      </section>

      {site.about && (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <Eyebrow className={t.light}>Бидний тухай</Eyebrow>
          <p className="mt-6 whitespace-pre-line text-xl leading-relaxed text-slate-300">{site.about}</p>
        </section>
      )}

      {services.length > 0 && (
        <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <Eyebrow className={t.light}>Бүтээгдэхүүн, үйлчилгээ</Eyebrow>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(s => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition hover:border-white/25 hover:bg-white/[0.07]">
                <span className={`block h-1 w-10 rounded-full ${t.solid}`} />
                <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                {s.text && <p className="mt-2 leading-relaxed text-slate-400">{s.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 pb-24 sm:px-6">
          <Eyebrow className={t.light}>Холбоо барих</Eyebrow>
          <div className="mt-8">
            <ContactCards contacts={contacts} t={t} tone="dark" />
          </div>
        </section>
      )}
    </>
  );
}
