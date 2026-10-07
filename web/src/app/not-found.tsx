import { rootUrl } from "@/lib/hosts";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold text-slate-300">404</p>
      <p className="mt-2 font-semibold">Хуудас олдсонгүй</p>
      <p className="mt-1 text-sm text-slate-500">Хаяг буруу, эсвэл ийм компани бүртгэлгүй байна.</p>
      <a href={rootUrl()} className="mt-5 text-sm font-semibold underline">
        hhk.mn руу буцах
      </a>
    </main>
  );
}
