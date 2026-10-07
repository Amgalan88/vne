// Хуучин апп-ын (index.html) toWordsMn-тэй ижил — баримтууд өмнөхтэйгээ адил бичигдэнэ
export function toWordsMn(input: number): string {
  const n = Math.floor(input);
  if (!n) return "тэг төгрөг";
  const ones = ["", "нэг", "хоёр", "гурав", "дөрөв", "тав", "зургаа", "долоо", "найм", "ес"];
  const tens = ["", "арав", "хорин", "гучин", "дөчин", "тавин", "жаран", "далан", "наян", "ерэн"];
  const under1000 = (x: number) => {
    let s = "";
    const h = Math.floor(x / 100), t = Math.floor((x % 100) / 10), o = x % 10;
    if (h) s += ones[h] + " зуу";
    const tw = x % 100;
    if (tw) {
      if (s) s += " ";
      if (tw < 10) s += ones[o];
      else if (tw < 20) s += tw === 10 ? "арав" : "арван " + ones[tw - 10];
      else {
        s += tens[t];
        if (o) s += " " + ones[o];
      }
    }
    return s.trim();
  };
  const scales = ["", "мянга", "сая", "тэрбум", "их наяд"];
  const parts: string[] = [];
  let x = n;
  for (let i = 0; x > 0 && i < scales.length; i++) {
    const c = x % 1000;
    if (c) parts.push(under1000(c) + (scales[i] ? " " + scales[i] : ""));
    x = Math.floor(x / 1000);
  }
  return parts.reverse().join(" ").replace(/\s+/g, " ").trim() + " төгрөг";
}
