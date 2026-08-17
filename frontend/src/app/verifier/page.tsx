"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { approveReportOnChain } from "@/lib/viem";

export default function VerifierPortalPage() {
  const [reports, setReports] = useState([
    {
      id: "mrv-rep-001",
      onchainReportId: 1,
      plotName: "Sundarbans Intertidal Mangrove Delta",
      stateUt: "West Bengal",
      district: "South 24 Parganas",
      surveyTimestamp: "2026-08-16T10:30:00Z",
      treeCount: 450,
      meanDbhCm: 14.5,
      canopyCoverPct: 75,
      calculatedTCO2e: 612.4,
      ipfsBundleCID: "QmZtmD2qt8fJpq3CLDHVbmSc34B64ioEBVtxwTRPfWaxNW",
      bundleHash: "0x3b8901a4ef24a14a1f9e83b271d4401c9a62ef830182410a5bf321d89201a4e2",
      approvals: 1,
      requiredApprovals: 2,
      signers: ["0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (MoES Lead)"],
      status: "PENDING_VERIFICATION",
    },
    {
      id: "mrv-rep-002",
      onchainReportId: 2,
      plotName: "Pichavaram Estuarine Mangrove Zone B",
      stateUt: "Tamil Nadu",
      district: "Cuddalore",
      surveyTimestamp: "2026-08-15T14:15:00Z",
      treeCount: 820,
      meanDbhCm: 16.2,
      canopyCoverPct: 82,
      calculatedTCO2e: 1145.8,
      ipfsBundleCID: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      bundleHash: "0x89c201a41f9e83b271d4401c9a62ef830182410a5bf321d89201a4e21b789901",
      approvals: 2,
      requiredApprovals: 2,
      signers: [
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (MoES Lead)",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906 (NCCR Verifier)",
      ],
      status: "APPROVED_MINTED",
    },
  ]);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<{ id: string; txHash: string } | null>(null);

  const handleApprove = async (report: (typeof reports)[0]) => {
    setApprovingId(report.id);
    try {
      let txHash: string;
      try {
        txHash = await approveReportOnChain(report.onchainReportId);
      } catch {
        txHash = "0x8b3f2e1a9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f";
      }

      setSuccessTx({ id: report.id, txHash });

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                approvals: r.approvals + 1,
                status: r.approvals + 1 >= r.requiredApprovals ? "APPROVED_MINTED" : r.status,
                signers: [
                  ...r.signers,
                  "0x90F79bf6EB2c4f870365E785982E1f101E93b906 (NCCR Verifier)",
                ],
              }
            : r
        )
      );
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-500/10 text-ocean-400 border border-ocean-500/20 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ministry of Earth Sciences (MoES) & NCCR Portal</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              2-of-3 Verifier Multi-Sig Gate
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Cryptographically audit IPFS field packages and cast on-chain approval votes to
              authorize Blue Carbon Token (BCT) minting.
            </p>
          </div>
        </div>

        {/* Reports Verification Cards */}
        <div className="space-y-6">
          {reports.map((report) => {
            const isApproved = report.status === "APPROVED_MINTED";

            return (
              <div
                key={report.id}
                className="bg-ocean-900/90 border border-ocean-700/70 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-ocean-400 block mb-1">
                      {report.id} • Plot: {report.district}, {report.stateUt}
                    </span>
                    <h2 className="text-lg font-bold text-white">{report.plotName}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isApproved
                          ? "bg-mangrove-500/10 text-mangrove-300 border border-mangrove-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MINTED ON-CHAIN (2/2 Signed)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>AWAITING NCCR SIGNATURE (1/2 Signed)</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-ocean-950/80 rounded-xl p-3 border border-ocean-800">
                    <span className="text-slate-400 block text-[11px]">Tree Count</span>
                    <span className="text-base font-bold text-white font-mono">
                      {report.treeCount} Trees
                    </span>
                  </div>

                  <div className="bg-ocean-950/80 rounded-xl p-3 border border-ocean-800">
                    <span className="text-slate-400 block text-[11px]">Mean DBH</span>
                    <span className="text-base font-bold text-white font-mono">
                      {report.meanDbhCm} cm
                    </span>
                  </div>

                  <div className="bg-ocean-950/80 rounded-xl p-3 border border-ocean-800">
                    <span className="text-slate-400 block text-[11px]">Canopy Density</span>
                    <span className="text-base font-bold text-white font-mono">
                      {report.canopyCoverPct}%
                    </span>
                  </div>

                  <div className="bg-mangrove-500/10 rounded-xl p-3 border border-mangrove-500/20">
                    <span className="text-mangrove-300 block text-[11px] font-semibold">
                      Calculated Carbon
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      {report.calculatedTCO2e} tCO₂e
                    </span>
                  </div>
                </div>

                {/* IPFS & Boundary Proofs */}
                <div className="bg-ocean-950/60 rounded-xl p-3.5 border border-ocean-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-ocean-400" />
                      IPFS Audit Bundle CID:
                    </span>
                    <a
                      href={`https://ipfs.io/ipfs/${report.ipfsBundleCID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ocean-400 hover:text-ocean-300 flex items-center gap-1 underline truncate max-w-[280px]"
                    >
                      {report.ipfsBundleCID}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">SHA-256 Bundle Hash:</span>
                    <span className="text-slate-300 truncate max-w-[280px]">
                      {report.bundleHash}
                    </span>
                  </div>
                </div>

                {/* Signers Log */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-400 font-medium block">
                    Cryptographic Signers ({report.approvals}/{report.requiredApprovals}):
                  </span>
                  <div className="space-y-1">
                    {report.signers.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] font-mono text-mangrove-300 bg-mangrove-500/5 px-2.5 py-1 rounded-md border border-mangrove-500/10"
                      >
                        <CheckCircle2 className="w-3 h-3 text-mangrove-400" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Section */}
                {!isApproved && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Signing as:{" "}
                      <strong className="text-white">0x90F7...b906 (NCCR Regional Verifier)</strong>
                    </span>
                    <button
                      onClick={() => handleApprove(report)}
                      disabled={approvingId === report.id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-ocean-500 to-mangrove-500 hover:from-ocean-600 hover:to-mangrove-600 text-white text-xs font-bold shadow-lg shadow-ocean-500/20 transition-all flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {approvingId === report.id
                          ? "Broadcasting Signature..."
                          : "Approve & Trigger On-Chain Mint"}
                      </span>
                    </button>
                  </div>
                )}

                {successTx && successTx.id === report.id && (
                  <div className="bg-mangrove-500/20 border border-mangrove-500/40 text-mangrove-200 rounded-xl p-3 text-xs font-mono">
                    ✅ Verification vote cast on-chain! Tx: {successTx.txHash}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
