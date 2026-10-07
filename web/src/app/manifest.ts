import type { MetadataRoute } from "next";

/** Хөтчөөс "Апп болгон суулгах" (PWA) — дүрс, нэр, суулгах цонхны дэлгэцийн зургууд */
export default function manifest(): MetadataRoute.Manifest {
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
