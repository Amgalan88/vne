// Хуучин нэг файлтай апп-ыг (repo-гийн үндсэн index.html) /umgm/ хаягаар үйлчилнэ.
// Ижил домэйн дээр байгаа тул хэрэглэгчдийн localStorage дахь өгөгдөл хадгалагдана.
// Шинэ апп-д баримт засварлагч бэлэн болтол түр хэрэглэнэ. dev/build бүрийн өмнө ажиллана.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const src = new URL("../../", import.meta.url);
const dest = new URL("../public/umgm/", import.meta.url);

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const f of ["index.html", "sw.js", "manifest.json", "images"]) {
  if (existsSync(new URL(f, src))) cpSync(new URL(f, src), new URL(f, dest), { recursive: true });
}
console.log("legacy app → public/umgm/");
