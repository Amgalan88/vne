import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isAppHost, rootUrl, tenantFromHost } from "@/lib/hosts";

/** Хайлтын системд: нүүр хуудас, гарын авлага, компанийн нийтийн хуудсууд нээлттэй; ажлын хэсэг, админ хаалттай */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  if (isAppHost(host)) return { rules: { userAgent: "*", disallow: "/" } };
  if (tenantFromHost(host)) {
    return { rules: { userAgent: "*", allow: "/", disallow: ["/documents", "/customers", "/members", "/settings", "/site", "/audit", "/billing", "/login", "/signup", "/t/"] } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/setup", "/dashboard", "/new", "/login", "/signup", "/auth", "/t/"] },
    sitemap: rootUrl("/sitemap.xml"),
  };
}
