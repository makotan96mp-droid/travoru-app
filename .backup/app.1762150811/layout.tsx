import "./globals.css";
import type { Metadata } from "next";
import { Playfair_Display, Noto_Serif_JP } from "next/font/google";
import Header from "./_components/Header";
import Footer from "./_components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-hero",
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travoru – AI旅程ジェネレーター",
  description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${playfair.variable} ${notoSerifJP.variable}`}>
      <body className="antialiased bg-slate-950 text-white">
        <Header />
        <main className="min-h-dvh pb-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
