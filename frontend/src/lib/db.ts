import Dexie, { type Table } from "dexie";

export interface LocalPlot {
  id: string; // UUID
  project_name: string;
  state_ut: string;
  district: string;
  ecosystem_type: string;
  target_species: string[];
  boundary_geojson: {
    type: "Polygon";
    coordinates: number[][][];
  };
  area_hectares: number;
  boundary_hash: string;
  status: "PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED";
  is_local: boolean; // true if created offline and pending backend creation
  created_at: string;
}

export interface LocalEvidencePhoto {
  id: string;
  filename: string;
  blob?: Blob;
  dataUrl?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  cid?: string;
}

export interface LocalSurvey {
  id: string; // UUID
  plot_id: string;
  survey_timestamp: string;
  tree_count_estimate: number;
  average_canopy_cover_pct: number;
  mean_dbh_cm: number;
  soil_organic_carbon_pct: number;
  calculated_tco2e: number;
  evidence_photos: LocalEvidencePhoto[];
  sync_status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  entity_type: "PLOT" | "SURVEY";
  entity_id: string;
  payload: any;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export class MeridienLocalDB extends Dexie {
  plots!: Table<LocalPlot, string>;
  surveys!: Table<LocalSurvey, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("MeridienLocalDB");
    this.version(1).stores({
      plots: "id, project_name, status, is_local, created_at",
      surveys: "id, plot_id, sync_status, created_at",
      syncQueue: "id, entity_type, entity_id, status, created_at",
    });
  }
}

export const localDb = new MeridienLocalDB();
