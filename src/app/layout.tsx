import type { Metadata } from "next";
import { Space_Grotesk, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tickers.ai | AI Systems Builder — Voice Agents & Backend Automation",
  description:
    "Sujith builds production AI agents — voice receptionists, multi-agent orchestration, and backend automation — using LangGraph, FastAPI, and ElevenLabs.",
  keywords: [
    "Sujith",
    "tickers.ai",
    "AI Agent Builder",
    "LangGraph",
    "ElevenLabs",
    "FastAPI",
    "Karaikal",
    "India",
    "Voice AI",
    "Multi-Agent Orchestration",
  ],
  authors: [{ name: "Sujith", url: "https://github.com/Spectral-Soul" }],
  openGraph: {
    title: "tickers.ai | AI Systems Builder",
    description:
      "Sujith builds production AI agents — voice receptionists, multi-agent orchestration, and backend automation.",
    url: "https://github.com/Spectral-Soul",
    siteName: "tickers.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tickers.ai | AI Systems Builder",
    description:
      "Sujith builds production AI agents — voice receptionists, multi-agent orchestration, and backend automation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${geistMono.variable} scroll-smooth`}
    >
      <body className="bg-[#0A0B0D] text-[#EDEEF0] font-body antialiased selection:bg-[#6C7BFF] selection:text-white">
        {children}
      </body>
    </html>
  );
}
