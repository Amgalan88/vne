import { SUPABASE_URL } from "./env";

export type SiteColor = "indigo" | "emerald" | "rose" | "amber" | "sky" | "slate";
export type SiteTemplate = "modern" | "clean" | "bold" | "dark";
export type Service = { title: string; text: string };

export type PublicSiteData = {
  name: string;
  slug: string;
  published: boolean;
  headline?: string;
  about?: string;
  services?: Service[];
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  color?: SiteColor;
  template?: SiteTemplate;
  cover_path?: string | null;
};

export const SITE_COLORS: SiteColor[] = ["indigo", "emerald", "rose", "amber", "sky", "slate"];
export const SITE_TEMPLATES: { key: SiteTemplate; label: string; text: string }[] = [
  { key: "modern", label: "Орчин үе", text: "Градиент, сүлжээн хээтэй — технологи, үйлчилгээний компанид" },
  { key: "clean", label: "Цэвэр", text: "Цагаан, энгийн, зурагтай — худалдаа, зөвлөх үйлчилгээнд" },
  { key: "bold", label: "Тод", text: "Том гарчиг, өнгөлөг хавтан — барилга, үйлдвэрлэл, хүргэлтэд" },
  { key: "dark", label: "Харанхуй", text: "Гүн өнгө, гэрэлтсэн өнгө — премиум, бүтээлч брэндэд" },
];

// Tailwind ангиудыг бүтнээр нь бичих ёстой — динамикаар угсарвал CSS-д орохгүй
export const THEME: Record<
  SiteColor,
  { solid: string; text: string; soft: string; swatch: string; label: string; grad: string; light: string; ring: string; glow: string }
> = {
  indigo: { solid: "bg-indigo-600", text: "text-indigo-600", soft: "bg-indigo-50", swatch: "bg-indigo-600", label: "Цэнхэр", grad: "from-indigo-900 via-indigo-700 to-teal-600", light: "text-indigo-300", ring: "ring-indigo-600", glow: "bg-indigo-500/30" },
  emerald: { solid: "bg-emerald-600", text: "text-emerald-600", soft: "bg-emerald-50", swatch: "bg-emerald-600", label: "Ногоон", grad: "from-emerald-900 via-emerald-700 to-teal-500", light: "text-emerald-300", ring: "ring-emerald-600", glow: "bg-emerald-500/30" },
  rose: { solid: "bg-rose-600", text: "text-rose-600", soft: "bg-rose-50", swatch: "bg-rose-600", label: "Улаан", grad: "from-rose-900 via-rose-700 to-orange-500", light: "text-rose-300", ring: "ring-rose-600", glow: "bg-rose-500/30" },
  amber: { solid: "bg-amber-500", text: "text-amber-600", soft: "bg-amber-50", swatch: "bg-amber-500", label: "Шар", grad: "from-amber-800 via-amber-600 to-yellow-500", light: "text-amber-300", ring: "ring-amber-500", glow: "bg-amber-500/30" },
  sky: { solid: "bg-sky-600", text: "text-sky-600", soft: "bg-sky-50", swatch: "bg-sky-600", label: "Тэнгэр", grad: "from-sky-900 via-sky-700 to-cyan-500", light: "text-sky-300", ring: "ring-sky-600", glow: "bg-sky-500/30" },
  slate: { solid: "bg-slate-800", text: "text-slate-800", soft: "bg-slate-100", swatch: "bg-slate-800", label: "Хар", grad: "from-slate-950 via-slate-800 to-slate-600", light: "text-slate-300", ring: "ring-slate-800", glow: "bg-slate-400/20" },
};

export function initials(name: string): string {
  const words = name.replace(/\b(ХХК|ХК|LLC)\b/gi, "").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Нийтийн "sites" bucket-ийн зургийн холбоос */
export function coverUrl(path: string | null | undefined): string | null {
  return path ? `${SUPABASE_URL}/storage/v1/object/public/sites/${path}` : null;
}
