export type SiteColor = "indigo" | "emerald" | "rose" | "amber" | "sky" | "slate";
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
};

export const SITE_COLORS: SiteColor[] = ["indigo", "emerald", "rose", "amber", "sky", "slate"];

// Tailwind ангиудыг бүтнээр нь бичих ёстой — динамикаар угсарвал CSS-д орохгүй
export const THEME: Record<SiteColor, { solid: string; text: string; soft: string; swatch: string; label: string }> = {
  indigo: { solid: "bg-indigo-600", text: "text-indigo-600", soft: "bg-indigo-50", swatch: "bg-indigo-600", label: "Индиго" },
  emerald: { solid: "bg-emerald-600", text: "text-emerald-600", soft: "bg-emerald-50", swatch: "bg-emerald-600", label: "Ногоон" },
  rose: { solid: "bg-rose-600", text: "text-rose-600", soft: "bg-rose-50", swatch: "bg-rose-600", label: "Улаан" },
  amber: { solid: "bg-amber-500", text: "text-amber-600", soft: "bg-amber-50", swatch: "bg-amber-500", label: "Шар" },
  sky: { solid: "bg-sky-600", text: "text-sky-600", soft: "bg-sky-50", swatch: "bg-sky-600", label: "Цэнхэр" },
  slate: { solid: "bg-slate-800", text: "text-slate-800", soft: "bg-slate-100", swatch: "bg-slate-800", label: "Хар" },
};

export function initials(name: string): string {
  const words = name.replace(/\b(ХХК|ХК|LLC)\b/gi, "").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}
