import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { tenantFromHost } from "@/lib/hosts";
import { getTenantBrand } from "@/lib/tenant-brand";

/**
 * Хөтчөөс "Апп болгон суулгах" (PWA).
 * hhk.mn / app.hhk.mn → HHK.MN апп; компани.hhk.mn → тухайн компанийн нэр, логотой тусдаа апп.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const slug = tenantFromHost((await headers()).get("host"));

  if (slug) {
    const b = await getTenantBrand(slug);
    return {
      id: "/",
      name: b.name,
      short_name: b.name.length > 14 ? b.name.replace(/\s*(ХХК|ХК|LLC)$/i, "").slice(0, 14) : b.name,
      description: b.headline || `${b.name} — ажлын хэсэг`,
      lang: "mn",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: b.from,
      categories: ["business", "productivity"],
      icons: [
        { src: `/t/${slug}/app-icon/192`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `/t/${slug}/app-icon/512`, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: `/t/${slug}/app-icon/maskable`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };
  }

  return {
    id: "/",
    name: "HHK.MN — Бизнесээ өргөжүүлээрэй",
    short_name: "HHK.MN",
    description: "Нэхэмжлэх, албан бичиг дижитал тамгатай, компанийн вэб хуудас, багийн удирдлага.",
    lang: "mn",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0a1f4a",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/narrow.png", sizes: "540x1170", type: "image/png", form_factor: "narrow", label: "HHK.MN утсан дээр" },
      { src: "/screenshots/wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "HHK.MN компьютер дээр" },
    ],
  };
}
