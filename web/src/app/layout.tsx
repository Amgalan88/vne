import type { Metadata, Viewport } from "next";
import { rootUrl } from "@/lib/hosts";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

const DESCRIPTION = "Нэхэмжлэх, ТМ-1, БМ-3, албан бичгээ дижитал тамга, гарын үсэгтэй 1 минутад гарга. Компанийн үнэгүй вэб хуудас, багийн удирдлага.";

export const metadata: Metadata = {
  metadataBase: new URL(rootUrl()),
  applicationName: "HHK.MN",
  title: { default: "HHK.MN — Бизнесээ өргөжүүлээрэй. Үнэгүй!", template: "%s · HHK.MN" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "HHK.MN",
    locale: "mn_MN",
    title: "HHK.MN — Бизнесээ өргөжүүлээрэй. Үнэгүй!",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "HHK.MN", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a1f4a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
