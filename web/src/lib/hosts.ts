import { ROOT_DOMAIN } from "./env";

const rootHostname = ROOT_DOMAIN.split(":")[0];
const isLocal = rootHostname === "localhost";

/** Админ (компаниудын жагсаалт, шинэ компани нээх) — app.hhk.mn. Үндсэн домэйн зөвхөн танилцуулга. */
export const APP_SUBDOMAIN = "app";

/**
 * Host толгойноос компанийн дэд домэйныг ялгана.
 * "umgm.hhk.mn" → "umgm", "hhk.mn" / "www.hhk.mn" / "*.vercel.app" → null
 */
export function tenantFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === rootHostname || hostname === "www." + rootHostname) return null;
  if (!hostname.endsWith("." + rootHostname)) return null;
  const sub = hostname.slice(0, -(rootHostname.length + 1));
  return sub.includes(".") || sub === APP_SUBDOMAIN ? null : sub;
}

export function isAppHost(host: string | null): boolean {
  return host?.split(":")[0].toLowerCase() === `${APP_SUBDOMAIN}.${rootHostname}`;
}

/** Нэвтэрсний дараа очих анхны хаяг: компанийн дэд домэйн дээр "/", бусад үед админ (app.hhk.mn) */
export function homeFor(host: string | null): string {
  return tenantFromHost(host) ? "/" : appUrl();
}

export function tenantHost(slug: string): string {
  return `${slug}.${ROOT_DOMAIN}`;
}

export function tenantUrl(slug: string, path = "/"): string {
  return `${isLocal ? "http" : "https"}://${tenantHost(slug)}${path}`;
}

export function appUrl(path = "/"): string {
  return `${isLocal ? "http" : "https"}://${APP_SUBDOMAIN}.${ROOT_DOMAIN}${path}`;
}

export function rootUrl(path = "/"): string {
  return `${isLocal ? "http" : "https"}://${ROOT_DOMAIN}${path}`;
}

/**
 * Нэвтрэлтийн cookie-г ".hhk.mn" дээр тавьснаар нэг удаа нэвтэрч бүх дэд домэйнд ажиллана.
 * Хөтчүүд "localhost"-д domain бүхий cookie хүлээж авдаггүй тул хөгжүүлэлтэд host-only үлдээнэ.
 */
export const COOKIE_DOMAIN = isLocal ? undefined : "." + rootHostname;

/** Нэвтэрсний дараа буцах замыг зөвхөн дотоод замаар хязгаарлана (open redirect-ээс сэргийлнэ) */
export function safeNext(next: unknown, fallback = "/"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}
