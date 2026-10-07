import Link from "next/link";
import { rootUrl } from "@/lib/hosts";

/** HHK.MN тэмдэг: сүлжээ бүхий «H» + баримтын дүрс, цэнхэр→ногоон градиент */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  // Нэг хуудсанд олон удаа гарсан ч ижил тодорхойлолттой тул id давхардах нь асуудалгүй
  const id = "hhk";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a5bcc" />
          <stop offset=".55" stopColor="#1689c4" />
          <stop offset="1" stopColor="#14b3a0" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="10" height="34" rx="2.5" fill={`url(#g${id})`} />
      <rect x="27" y="3" width="10" height="34" rx="2.5" fill={`url(#g${id})`} />
      <rect x="12" y="16" width="16" height="6" fill={`url(#g${id})`} />
      {/* сүлжээ */}
      <g stroke="#fff" strokeOpacity=".75" strokeWidth=".9" fill="none">
        <path d="M6 8L10 13L6.5 19L10.5 25L7 31M10 13L16 12M10.5 25L15 27" />
      </g>
      <g fill="#fff">
        <circle cx="6" cy="8" r="1.3" />
        <circle cx="10" cy="13" r="1.5" />
        <circle cx="6.5" cy="19" r="1.2" />
        <circle cx="10.5" cy="25" r="1.5" />
        <circle cx="7" cy="31" r="1.2" />
        <circle cx="16" cy="12" r="1.1" />
      </g>
      {/* баримт */}
      <g>
        <path d="M16 23h7.5l2.5 2.5V35a1.5 1.5 0 0 1-1.5 1.5H16A1.5 1.5 0 0 1 14.5 35v-10.5A1.5 1.5 0 0 1 16 23z" fill="#fff" stroke="#1a5bcc" strokeWidth="1.1" />
        <path d="M17 27.5h6M17 30h6M17 32.5h4" stroke="#1689c4" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Лого дээр дарахад үргэлж hhk.mn нүүр хуудас руу (компанийн дэд домэйн, app.hhk.mn дээрээс ч) */
export function Logo({ href = rootUrl(), light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-black tracking-tight" aria-label="HHK.MN нүүр хуудас">
      <LogoMark />
      <span className={`text-xl leading-none ${light ? "text-brand-light" : "text-brand"}`}>HHK.MN</span>
    </Link>
  );
}
