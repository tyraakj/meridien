"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Flame,
  Trees,
  CheckCircle2,
  ExternalLink,
  Award,
  ArrowLeft,
  Share2,
  Printer,
  Waves,
} from "lucide-react";

export default function CertificatePage() {
  const params = useParams();
  const certId = (params?.id as string) || "cert-sih-2026-001";

  const [certData, setCertData] = useState({
    certificateId: certId,
    beneficiary: "Acme Corp ESG 2026",
    retiredAmountBCT: 10.0,
    equivalentTCO2e: 10.0,
    retirementReason: "Scope 1 Coastal Mangrove Sequestration Offset",
    projectName: "Sundarbans Intertidal Mangrove Delta",
    stateUt: "West Bengal, India",
    species: "Rhizophora mucronata, Avicennia marina",
    retirementTimestamp: new Date().toISOString(),
    txHash: "0x7c4f89d12a3e5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
    tokenAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    ipfsBundleCID: "QmZtmD2qt8fJpq3CLDHVbmSc34B64ioEBVtxwTRPfWaxNW",
    verifiers: [
      "Ministry of Earth Sciences (MoES Lead Verifier)",
      "National Centre for Coastal Research (NCCR Verifier)",
    ],
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation / Actions */}
        <div className="flex items-center justify-between no-print">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Registry</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-slate-200 text-xs font-medium border border-ocean-700 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="bg-gradient-to-b from-ocean-900 to-ocean-950 border-2 border-mangrove-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-8">
          {/* Decorative Corner Seals */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-mangrove-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-ocean-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Certificate Header */}
          <div className="text-center space-y-3 border-b border-ocean-800 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-mangrove-500/10 border border-mangrove-500/30 text-mangrove-400 flex items-center justify-center mx-auto shadow-lg shadow-mangrove-500/10">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-mangrove-400 font-bold block">
                Official Verification Certificate
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Blue Carbon Credit Retirement
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Certificate ID: {certData.certificateId}
              </p>
            </div>
          </div>

          {/* Beneficiary & Amount Highlight */}
          <div className="text-center space-y-2 py-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              This certifies that
            </span>
            <h2 className="text-2xl font-black text-white tracking-wide">{certData.beneficiary}</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              has permanently retired and burned on-chain verified blue carbon credits for:
            </p>
            <div className="inline-block bg-ocean-950/80 border border-ocean-700/80 px-4 py-1.5 rounded-xl text-xs italic text-ocean-300">
              &quot;{certData.retirementReason}&quot;
            </div>
          </div>

          {/* Sequestration Metric Pill */}
          <div className="bg-mangrove-950/40 border border-mangrove-500/30 rounded-2xl p-6 text-center space-y-1">
            <span className="text-xs font-semibold text-mangrove-300 uppercase tracking-wider block">
              Total Permanent Sequestration
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono">
              {certData.retiredAmountBCT.toFixed(1)}{" "}
              <span className="text-lg font-bold text-mangrove-400">tCO₂e</span>
            </div>
            <span className="text-xs text-slate-400 block">
              1.0 BCT = 1.0 Metric Ton of CO₂ equivalent
            </span>
          </div>

          {/* Project & Provenance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-ocean-950/80 rounded-xl p-4 border border-ocean-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Restoration Plot</span>
              <span className="font-bold text-white block">{certData.projectName}</span>
              <span className="text-slate-400 text-[11px] block">{certData.stateUt}</span>
            </div>

            <div className="bg-ocean-950/80 rounded-xl p-4 border border-ocean-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Target Mangrove Species</span>
              <span className="font-medium text-slate-200 italic block">{certData.species}</span>
              <span className="text-mangrove-400 text-[11px] font-mono block">
                IPCC Tier 2 Verified
              </span>
            </div>
          </div>

          {/* Regulatory & Cryptographic Proofs */}
          <div className="bg-ocean-950/90 rounded-2xl p-5 border border-ocean-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-mangrove-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Agency Verifier Signatures (2-of-3 Threshold Reached):</span>
            </div>
            <div className="space-y-1 pl-2 font-mono text-[11px] text-slate-300">
              {certData.verifiers.map((v, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-mangrove-400 shrink-0" />
                  <span>{v}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-ocean-800/80 pt-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 gap-1">
                <span>On-Chain Burn Tx:</span>
                <span className="text-ocean-400 truncate max-w-[280px]">{certData.txHash}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 gap-1">
                <span>IPFS Audit Bundle:</span>
                <span className="text-ocean-400 truncate max-w-[280px]">
                  {certData.ipfsBundleCID}
                </span>
              </div>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="text-center pt-4 border-t border-ocean-800/60 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-slate-400 font-semibold">
              <Waves className="w-4 h-4 text-ocean-400" />
              <span>Meridien Blue Carbon Protocol</span>
            </div>
            <span>Timestamp: {new Date(certData.retirementTimestamp).toUTCString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
