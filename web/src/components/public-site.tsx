import Link from "next/link";
import { rootUrl } from "@/lib/hosts";
import { coverUrl, initials, siteImageUrl, THEME, type PublicSiteData, type Service, type SiteTemplate } from "@/lib/site";
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
  const aboutImage = siteImageUrl(site.about_image_path);
  const order = contacts.find(c => c.label === "Утас")?.href;
  const props = { site, t, member, services, contacts, cover, aboutImage, order };

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

type P = { site: PublicSiteData; t: T; member: boolean; services: Service[]; contacts: Contact[]; cover: string | null; aboutImage: string | null; order?: string };

/* ───────────── Нийтлэг хэсгүүд ───────────── */

function Header({ site, t, member, tone }: { site: PublicSiteData; t: T; member: boolean; tone: "light" | "dark" | "overlay" }) {
  const onDark = tone !== "light";
  const wrap =
    tone === "overlay" ? "absolute inset-x-0 top-0 z-20" : tone === "dark" ? "border-b border-white/10 bg-slate-950/80 backdrop-blur" : "border-b border-slate-100 bg-white/90 backdrop-blur";
  return (
    <header className={`${wrap} ${tone !== "overlay" ? "sticky top-0 z-20" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {site.logo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={siteImageUrl(site.logo_path)!} alt={site.name} className={`h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-0.5 shadow-lg ${onDark ? "ring-2 ring-white/30" : "ring-1 ring-slate-200"}`} />
          ) : (
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg ${t.solid} ${onDark ? "ring-2 ring-white/30" : ""}`}>
              {initials(site.name)}
            </span>
          )}
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

function ServiceImg({ s, className = "" }: { s: Service; className?: string }) {
  const url = siteImageUrl(s.image);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={s.title} className={`w-full object-cover ${className}`} />;
}

function Price({ s, className }: { s: Service; className: string }) {
  return s.price ? <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${className}`}>{s.price}</span> : null;
}

function OrderLink({ href, className }: { href?: string; className: string }) {
  return href ? <a href={href} className={`inline-flex text-sm font-bold ${className}`}>Захиалах →</a> : null;
}

function AboutImg({ url, className = "" }: { url: string | null; className?: string }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`w-full object-cover ${className}`} />;
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

function Modern({ site, t, member, services, contacts, cover, aboutImage, order }: P) {
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
          <div className={`grid items-center gap-10 ${aboutImage ? "lg:grid-cols-2" : "lg:grid-cols-[1fr_2fr]"}`}>
            {aboutImage ? (
              <AboutImg url={aboutImage} className="aspect-[4/3] rounded-3xl shadow-xl" />
            ) : (
              <div>
                <Eyebrow className={t.text}>Бидний тухай</Eyebrow>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Танд итгэлтэй түнш</h2>
              </div>
            )}
            <div>
              {aboutImage && (
                <>
                  <Eyebrow className={t.text}>Бидний тухай</Eyebrow>
                  <h2 className="mt-3 mb-5 text-3xl font-black tracking-tight">Танд итгэлтэй түнш</h2>
                </>
              )}
              <p className="whitespace-pre-line text-lg leading-relaxed text-slate-600">{site.about}</p>
            </div>
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
                <div key={s.title} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
                  <ServiceImg s={s} className="aspect-[16/10]" />
                  <div className="flex flex-1 flex-col p-7">
                    {!s.image && <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.grad} text-lg font-black text-white`}>{i + 1}</span>}
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    {s.text && <p className="mt-2 flex-1 whitespace-pre-line leading-relaxed text-slate-600">{s.text}</p>}
                    {(s.price || order) && (
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <Price s={s} className={`${t.soft} ${t.text}`} />
                        <OrderLink href={order} className={t.text} />
                      </div>
                    )}
                  </div>
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

function Clean({ site, t, member, services, contacts, cover, aboutImage, order }: P) {
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
          <div className={`mx-auto px-4 sm:px-6 ${aboutImage ? "grid max-w-6xl items-center gap-10 lg:grid-cols-2" : "max-w-3xl text-center"}`}>
            <AboutImg url={aboutImage} className="aspect-[4/3] rounded-3xl shadow-lg" />
            <div>
              <Eyebrow className={t.text}>Бидний тухай</Eyebrow>
              <p className="mt-6 whitespace-pre-line text-xl leading-relaxed text-slate-700 sm:text-2xl">{site.about}</p>
            </div>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section id="services" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6">
          <Eyebrow className={t.text}>Бүтээгдэхүүн, үйлчилгээ</Eyebrow>
          <ol className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {services.map((s, i) => (
              <li key={s.title} className="grid gap-5 py-7 sm:grid-cols-[160px_1fr] sm:items-start">
                {s.image ? (
                  <ServiceImg s={s} className="aspect-square rounded-2xl" />
                ) : (
                  <span className={`font-mono text-3xl font-black ${t.text}`}>{String(i + 1).padStart(2, "0")}</span>
                )}
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <Price s={s} className={`${t.soft} ${t.text}`} />
                  </div>
                  {s.text && <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">{s.text}</p>}
                  <OrderLink href={order} className={`mt-3 ${t.text}`} />
                </div>
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

function Bold({ site, t, member, services, contacts, cover, aboutImage, order }: P) {
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
              <div key={s.title} className={`flex flex-col ${i % 2 === 0 ? "bg-slate-900 text-white" : `${t.soft} text-slate-900`}`}>
                <ServiceImg s={s} className="aspect-[16/10]" />
                <div className="flex flex-1 flex-col p-10">
                  <span className={`text-5xl font-black ${i % 2 === 0 ? t.light : t.text}`}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-4 text-2xl font-black uppercase tracking-tight">{s.title}</h3>
                  {s.text && <p className={`mt-3 flex-1 whitespace-pre-line leading-relaxed ${i % 2 === 0 ? "text-slate-300" : "text-slate-600"}`}>{s.text}</p>}
                  {s.price && <p className={`mt-5 text-2xl font-black ${i % 2 === 0 ? "text-white" : t.text}`}>{s.price}</p>}
                  <OrderLink href={order} className={`mt-3 ${i % 2 === 0 ? t.light : t.text}`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {site.about && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
            <h2 className={`text-5xl font-black uppercase tracking-tight ${t.text}`}>Бид</h2>
            <p className="whitespace-pre-line text-xl leading-relaxed text-slate-700">{site.about}</p>
          </div>
          <AboutImg url={aboutImage} className="mt-10 aspect-[21/9] rounded-none" />
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

function Dark({ site, t, member, services, contacts, cover, aboutImage, order }: P) {
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
          <AboutImg url={aboutImage} className="mt-10 aspect-[16/9] rounded-3xl ring-1 ring-white/10" />
        </section>
      )}

      {services.length > 0 && (
        <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <Eyebrow className={t.light}>Бүтээгдэхүүн, үйлчилгээ</Eyebrow>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(s => (
              <div key={s.title} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/25 hover:bg-white/[0.07]">
                <ServiceImg s={s} className="aspect-[16/10] opacity-90" />
                <div className="flex flex-1 flex-col p-7">
                  <span className={`block h-1 w-10 rounded-full ${t.solid}`} />
                  <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                  {s.text && <p className="mt-2 flex-1 whitespace-pre-line leading-relaxed text-slate-400">{s.text}</p>}
                  {(s.price || order) && (
                    <div className="mt-5 flex items-center justify-between gap-3">
                      {s.price ? <span className={`text-lg font-bold ${t.light}`}>{s.price}</span> : <span />}
                      <OrderLink href={order} className="text-white/80 hover:text-white" />
                    </div>
                  )}
                </div>
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
