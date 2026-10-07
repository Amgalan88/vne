import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { initials, siteImageUrl, type PublicSiteData, type SiteColor } from "@/lib/site";

/* Компани бүрийн апп дүрс, хуваалцах зураг — нийтийн хуудасны лого, өнгөөр автоматаар зурна */

const COLORS: Record<SiteColor, [string, string]> = {
  indigo: ["#1a5bcc", "#14b3a0"],
  emerald: ["#047857", "#14b8a6"],
  rose: ["#be123c", "#f97316"],
  amber: ["#b45309", "#eab308"],
  sky: ["#0369a1", "#06b6d4"],
  slate: ["#0f172a", "#475569"],
};

export type TenantBrand = { name: string; slug: string; headline: string; logo: string | null; from: string; to: string };

let font: Promise<Buffer> | null = null;
const loadFont = () => (font ??= readFile(join(process.cwd(), "assets/inter-extrabold.otf")));

export async function getTenantBrand(slug: string): Promise<TenantBrand> {
  let site: PublicSiteData | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("public_site", { p_slug: slug });
    site = data as PublicSiteData | null;
  } catch {
    site = null;
  }
  const [from, to] = COLORS[site?.color ?? "indigo"] ?? COLORS.indigo;

  // Satori зөвхөн PNG/JPEG уншина — логог татаж data URL болгоно, бусад хэлбэр бол нэрийн үсэг
  let logo: string | null = null;
  const url = siteImageUrl(site?.logo_path);
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && /image\/(png|jpe?g)/.test(type)) logo = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    } catch {
      logo = null;
    }
  }
  return { name: site?.name ?? slug, slug, headline: site?.headline ?? "", logo, from, to };
}

/** Дөрвөлжин апп дүрс. pad — maskable дүрсэнд илүү зай (Android дугуйлж тайрдаг) */
export async function brandIcon(b: TenantBrand, size: number, pad = 0.14) {
  const inner = Math.round(size * (1 - pad * 2));
  return new ImageResponse(
    b.logo ? (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={b.logo} width={inner} height={inner} style={{ objectFit: "contain" }} />
      </div>
    ) : (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${b.from}, ${b.to})`,
          color: "#ffffff",
          fontSize: Math.round(inner * 0.46),
          fontFamily: "Inter",
          letterSpacing: -2,
        }}
      >
        {initials(b.name)}
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Inter", data: await loadFont(), weight: 800 }] },
  );
}

/** Хуваалцах зураг (Facebook, Messenger) — 1200×630 */
export async function brandPoster(b: TenantBrand) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: `linear-gradient(135deg, #0a1f4a 0%, ${b.from} 60%, ${b.to} 100%)`,
          color: "#ffffff",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {b.logo ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={b.logo} width={150} height={150} style={{ objectFit: "contain", background: "#fff", borderRadius: 28, padding: 12 }} />
          ) : (
            <div style={{ width: 150, height: 150, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.15)", border: "3px solid rgba(255,255,255,.35)", fontSize: 64 }}>
              {initials(b.name)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, letterSpacing: -2, lineHeight: 1.05 }}>{b.name}</div>
            <div style={{ fontSize: 30, opacity: 0.75, marginTop: 10 }}>{`${b.slug}.hhk.mn`}</div>
          </div>
        </div>
        {b.headline && <div style={{ marginTop: 48, fontSize: 38, lineHeight: 1.3, opacity: 0.92, maxWidth: 1000 }}>{b.headline}</div>}
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: "Inter", data: await loadFont(), weight: 800 }] },
  );
}
