import Link from "next/link";
import { rootUrl } from "@/lib/hosts";
import { initials, THEME, type PublicSiteData } from "@/lib/site";

/** slug.hhk.mn — компанийн нийтийн хуудасны стандарт загвар */
export function PublicSite({ site, member }: { site: PublicSiteData; member: boolean }) {
  const t = THEME[site.color ?? "indigo"];
  const appLink = member ? (
    <Link href="/documents" className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
      Ажлын хэсэг →
    </Link>
  ) : (
    <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
      Ажилтан нэвтрэх
    </Link>
  );

  const header = (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${t.solid}`}>
            {initials(site.name)}
          </span>
          <span className="truncate font-bold">{site.name}</span>
        </div>
        {appLink}
      </div>
    </header>
  );

  if (!site.published) {
    return (
      <div className="flex flex-1 flex-col bg-white text-slate-900">
        {header}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <p className="text-2xl font-extrabold">{site.name}</p>
          <p className="mt-2 text-slate-500">Компанийн хуудас удахгүй нээгдэнэ.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const services = (site.services ?? []).filter(s => s.title);
  const contacts = [
    site.phone && { icon: "📞", label: "Утас", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    site.email && { icon: "✉️", label: "Имэйл", value: site.email, href: `mailto:${site.email}` },
    site.address && { icon: "📍", label: "Хаяг", value: site.address },
    site.facebook && { icon: "💬", label: "Facebook", value: "Facebook хуудас", href: site.facebook.startsWith("http") ? site.facebook : `https://${site.facebook}` },
  ].filter(Boolean) as { icon: string; label: string; value: string; href?: string }[];

  return (
    <div className="flex-1 bg-white text-slate-900">
      {header}

      <section className={`${t.solid} text-white`}>
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{site.name}</h1>
          {site.headline && <p className="mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">{site.headline}</p>}
          {contacts.length > 0 && (
            <a href="#contact" className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-50">
              Холбоо барих
            </a>
          )}
        </div>
      </section>

      {site.about && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className={`text-sm font-semibold uppercase tracking-widest ${t.text}`}>Бидний тухай</p>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-slate-600">{site.about}</p>
        </section>
      )}

      {services.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className={`text-sm font-semibold uppercase tracking-widest ${t.text}`}>Бүтээгдэхүүн, үйлчилгээ</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(s => (
                <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <span className={`block h-1.5 w-10 rounded-full ${t.solid}`} />
                  <h3 className="mt-4 font-bold">{s.title}</h3>
                  {s.text && <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section id="contact" className="mx-auto max-w-5xl scroll-mt-4 px-4 py-16 sm:px-6">
          <p className={`text-sm font-semibold uppercase tracking-widest ${t.text}`}>Холбоо барих</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {contacts.map(c => {
              const body = (
                <>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.soft}`}>{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</span>
                    <span className="block whitespace-pre-line font-semibold">{c.value}</span>
                  </span>
                </>
              );
              return c.href ? (
                <a key={c.label} href={c.href} target={c.label === "Facebook" ? "_blank" : undefined} rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm">
                  {body}
                </a>
              ) : (
                <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5">{body}</div>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-slate-400 sm:px-6">
        <a href={rootUrl()} className="hover:text-slate-600">
          hhk.mn дээр бүтээв · Нэхэмжлэх, албан баримтаа 1 минутад
        </a>
      </div>
    </footer>
  );
}
