"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SyncBadge } from "./SyncBadge";
import { Waves, MapPin, ShieldCheck, Wallet, Globe } from "lucide-react";
import { fetchUserBCTBalance } from "@/lib/viem";

export function Navbar() {
  const pathname = usePathname();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [bctBalance, setBctBalance] = useState<string>("0.00");

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setWalletAddress(addr);
          const balance = await fetchUserBCTBalance(addr);
          setBctBalance(balance);
        }
      } catch (err) {
        console.warn("Wallet connection rejected:", err);
      }
    } else {
      // Demo fallback address if no wallet extension is installed
      const demoAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      setWalletAddress(demoAddress);
      setBctBalance("348.75");
    }
  };

  const navLinks = [
    { href: "/", label: "Public Registry", icon: Globe },
    { href: "/capture", label: "Field Capture (PWA)", icon: MapPin },
    { href: "/verifier", label: "Verifier Portal", icon: ShieldCheck },
    { href: "/capture-field", label: "Capture Fields (MAP)", icon: MapPin}
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ocean-800/80 bg-ocean-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-ocean-500/10 text-ocean-400 border border-ocean-500/20 group-hover:bg-ocean-500/20 transition-all">
            <Waves className="w-5 h-5 text-ocean-400" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-wide block">MERIDIEN</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-mangrove-400 block -mt-1">
              Blue Carbon Protocol
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-ocean-800 text-white shadow-sm border border-ocean-700/80"
                    : "text-slate-400 hover:text-white hover:bg-ocean-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-ocean-400" : "text-slate-500"}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Sync Badge + Wallet Connect */}
        <div className="flex items-center gap-3">
          <SyncBadge />

          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean-900 hover:bg-ocean-800 text-slate-200 text-xs font-medium border border-ocean-700/80 transition-all shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5 text-ocean-400" />
            {walletAddress ? (
              <span className="font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}{" "}
                <span className="text-mangrove-400 font-bold ml-1">
                  ({parseFloat(bctBalance).toFixed(1)} BCT)
                </span>
              </span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
