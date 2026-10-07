/** Баримтын дүрс — градиент хайрцагт (нүүр хуудасны таблетын хавтантай ижил хэв маяг) */
export function DocIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M8 11h8M8 14h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}

export function DocIconTile({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-indigo-600/20 ${className}`}>
      <DocIcon className="h-6 w-6" />
    </span>
  );
}

/** Нэрийн эхний үсэгтэй дугуй — гишүүд, компаниудад */
export function Avatar({ name, className = "h-9 w-9 text-sm" }: { name: string; className?: string }) {
  const letters = name.trim().split(/[\s.]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-teal-400 font-bold text-white ${className}`}>
      {letters}
    </span>
  );
}
