import { localDb, type LocalSurvey, type SyncQueueItem } from "./db";
import { api } from "./api";

export type SyncState = "ONLINE" | "OFFLINE" | "SYNCING" | "ERROR";

type SyncListener = (state: SyncState, pendingCount: number) => void;
const listeners: Set<SyncListener> = new Set();

let currentSyncState: SyncState =
  typeof navigator !== "undefined" && navigator.onLine ? "ONLINE" : "OFFLINE";

export function subscribeSyncState(listener: SyncListener) {
  listeners.add(listener);
  getPendingCount().then((count) => listener(currentSyncState, count));
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(count: number) {
  listeners.forEach((fn) => fn(currentSyncState, count));
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === "undefined") return 0;
  return await localDb.syncQueue.where("status").equals("PENDING").count();
}

/**
 * Enqueues an offline survey capture for background sync.
 */
export async function queueSurveyForSync(survey: LocalSurvey): Promise<void> {
  const syncItem: SyncQueueItem = {
    id: `sync-survey-${survey.id}`,
    entity_type: "SURVEY",
    entity_id: survey.id,
    payload: survey,
    status: "PENDING",
    attempts: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await localDb.transaction("rw", [localDb.surveys, localDb.syncQueue], async () => {
    await localDb.surveys.put(survey);
    await localDb.syncQueue.put(syncItem);
  });

  const count = await getPendingCount();
  notifyListeners(count);

  if (typeof navigator !== "undefined" && navigator.onLine) {
    triggerAutoSync();
  }
}

/**
 * Executes batch sync against FastAPI backend.
 */
export async function triggerAutoSync(): Promise<{
  synced: number;
  failed: number;
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    currentSyncState = "OFFLINE";
    notifyListeners(await getPendingCount());
    return { synced: 0, failed: 0 };
  }

  const pendingItems = await localDb.syncQueue.where("status").equals("PENDING").toArray();

  if (pendingItems.length === 0) {
    currentSyncState = "ONLINE";
    notifyListeners(0);
    return { synced: 0, failed: 0 };
  }

  currentSyncState = "SYNCING";
  notifyListeners(pendingItems.length);

  let syncedCount = 0;
  let failedCount = 0;

  // Format survey batch payload
  const surveyBatchPayload = pendingItems
    .filter((item) => item.entity_type === "SURVEY")
    .map((item) => {
      const s: LocalSurvey = item.payload;
      return {
        client_uuid: s.id,
        plot_id: s.plot_id,
        survey_timestamp: s.survey_timestamp,
        tree_count_estimate: s.tree_count_estimate,
        average_canopy_cover_pct: s.average_canopy_cover_pct,
        mean_dbh_cm: s.mean_dbh_cm,
        soil_organic_carbon_pct: s.soil_organic_carbon_pct,
        evidence_photos: (s.evidence_photos || []).map((p) => ({
          cid: p.cid || `QmLocalPhoto${p.id.slice(0, 8)}`,
          latitude: p.latitude,
          longitude: p.longitude,
          timestamp: p.timestamp,
          filename: p.filename,
        })),
      };
    });

  if (surveyBatchPayload.length > 0) {
    try {
      const responseReports = await api.syncBatch(surveyBatchPayload);

      await localDb.transaction("rw", [localDb.surveys, localDb.syncQueue], async () => {
        for (const item of pendingItems) {
          await localDb.syncQueue.update(item.id, {
            status: "SYNCED",
            updated_at: new Date().toISOString(),
          });
          await localDb.surveys.update(item.entity_id, {
            sync_status: "SYNCED",
          });
        }
      });
      syncedCount = responseReports.length;
      currentSyncState = "ONLINE";
    } catch (err: any) {
      console.error("[Sync Engine] Batch sync error:", err);
      for (const item of pendingItems) {
        await localDb.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          last_error: err.message || "Network sync failed",
          updated_at: new Date().toISOString(),
        });
      }
      failedCount = pendingItems.length;
      currentSyncState = "ERROR";
    }
  }

  const remaining = await getPendingCount();
  notifyListeners(remaining);
  return { synced: syncedCount, failed: failedCount };
}

// Auto-attach network listeners in browser
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[Sync Engine] Network restored. Triggering auto-sync...");
    currentSyncState = "ONLINE";
    triggerAutoSync();
  });

  window.addEventListener("offline", () => {
    console.log("[Sync Engine] Device went offline. Queuing changes locally.");
    currentSyncState = "OFFLINE";
    getPendingCount().then((count) => notifyListeners(count));
  });
}
