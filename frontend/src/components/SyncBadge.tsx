"use client";

import React, { useEffect, useState } from "react";
import { subscribeSyncState, triggerAutoSync, type SyncState } from "@/lib/sync";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export function SyncBadge() {
  const [syncState, setSyncState] = useState<SyncState>("ONLINE");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state, count) => {
      setSyncState(state);
      setPendingCount(count);
      setIsSyncing(state === "SYNCING");
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerAutoSync();
    setIsSyncing(false);
  };

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      {syncState === "ONLINE" && pendingCount === 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mangrove-500/10 text-mangrove-400 border border-mangrove-500/20">
          <Wifi className="w-3.5 h-3.5" />
          <span>Online & Synced</span>
        </span>
      )}

      {syncState === "ONLINE" && pendingCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-500/10 text-ocean-400 border border-ocean-500/20">
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{pendingCount} Pending</span>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="ml-1 underline hover:text-white transition-colors"
          >
            Sync
          </button>
        </span>
      )}

      {syncState === "OFFLINE" && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode ({pendingCount} Cached)</span>
        </span>
      )}

      {syncState === "ERROR" && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Sync Failed</span>
          <button
            onClick={handleManualSync}
            className="ml-1 underline hover:text-white transition-colors"
          >
            Retry
          </button>
        </span>
      )}
    </div>
  );
}
