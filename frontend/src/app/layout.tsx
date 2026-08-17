import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meridien | Blue Carbon Registry & MRV Protocol",
  description:
    "Offline-first blue carbon MRV platform and blockchain settlement registry for coastal mangrove ecosystems.",
  manifest: "/manifest.json",
  themeColor: "#008DDA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B192C" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-ocean-950 text-slate-100`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ocean-800/80 bg-ocean-950/90 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              🌊 Meridien Protocol — SIH 2026 (SIH26038) • Ministry of Earth Sciences & NCCR
            </span>
            <span className="font-mono text-slate-400">Team Git Push Pray • Built by @tyraakj</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
