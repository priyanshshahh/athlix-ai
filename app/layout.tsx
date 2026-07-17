import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATHLIX AI — Athlete Financial Risk Scenario Simulator",
  description:
    "A scenario simulator for athlete financial risk on real NBA data. Model career collapse, injury-linked earning decline, retirement liquidity, and contract instability with transparent, deterministic formulas — not predictions.",
  applicationName: "ATHLIX AI",
  authors: [{ name: "Priyansh Shah" }],
  keywords: [
    "athlete finance",
    "sports analytics",
    "risk scenario simulator",
    "career stability",
    "wealth modeling",
    "NBA data",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="noise-overlay min-h-full bg-[#050816] text-slate-100">
        {children}
      </body>
    </html>
  );
}
