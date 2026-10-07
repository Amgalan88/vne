import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "hhk.mn — Нэхэмжлэх, албан баримт", template: "%s · hhk.mn" },
  description: "Нэхэмжлэх, БМ-3, ТМ-1, албан бичгээ тамга, гарын үсэгтэйгээр 1 минутад гарга.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
