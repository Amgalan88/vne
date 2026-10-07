import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { rootUrl } from "@/lib/hosts";

/** app.hhk.mn хуудсуудын нийтлэг хүрээ: гүн хөх толгой (лого, имэйл, гарын авлага, гарах) + доорх агуулга */
export function AppShell({
  email,
  title,
  subtitle,
  children,
}: {
  email: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <section className="bg-brand-dark text-white">
        <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-12">
          <header className="mb-10 flex items-center justify-between gap-3">
            <Logo light href="/" />
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="hidden sm:inline">{email}</span>
              <a href={rootUrl("/guide")} className="hover:text-white">Гарын авлага</a>
              <SignOutButton onDark />
            </div>
          </header>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-white/70">{subtitle}</p>}
        </div>
      </section>
      <main className="mx-auto -mt-6 w-full max-w-2xl px-4 pb-10">{children}</main>
    </div>
  );
}
