import type { Metadata } from "next";
import {
  Noto_Sans,
  Noto_Sans_JP,
  Noto_Sans_Gurmukhi,
} from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "devanagari"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

const notoSansGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-noto-sans-gurmukhi",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gyaan Vriksh",
  description: "Knowledge tree powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${notoSans.variable} ${notoSansJP.variable} ${notoSansGurmukhi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
