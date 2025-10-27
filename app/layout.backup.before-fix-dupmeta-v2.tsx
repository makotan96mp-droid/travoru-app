import "./globals.css";
import type { Metadata } from "next";

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Travoru", template: "%s | Travoru" },
  description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Travoru",
    title: "Travoru",
    description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
    images: [
      { url: "/og/og-1200x630.jpg",  width: 1200, height: 630 },
      { url: "/og/og-1200x1200.jpg", width: 1200, height: 1200 }
    ],
    locale: "ja_JP"
  },
  twitter: {
    card: "summary_large_image",
    title: "Travoru",
    description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
    images: ["/og/og-1200x630.jpg"]
  },
  icons: {
    icon: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  alternates: { canonical: "/" }
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Travoru", template: "%s | Travoru" },
  description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Travoru",
    title: "Travoru",
    description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
    images: [
      { url: "/og/og-1200x630.jpg",  width: 1200, height: 630 },
      { url: "/og/og-1200x1200.jpg", width: 1200, height: 1200 }
    ],
    locale: "ja_JP"
  },
  twitter: {
    card: "summary_large_image",
    title: "Travoru",
    description: "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。",
    images: ["/og/og-1200x630.jpg"]
  },
  icons: {
    icon: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  alternates: { canonical: "/" }
};

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container flex items-center justify-between py-4">
            <div className="text-lg font-semibold">Travoru</div>
            <nav className="text-sm">
              <a href="/new" className="hover:underline">New plan</a>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}
