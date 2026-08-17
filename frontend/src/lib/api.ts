const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("meridien_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API Request failed";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export const api = {
  // Plots
  registerPlot: (data: {
    project_name: string;
    state_ut: string;
    district: string;
    ecosystem_type?: string;
    target_species?: string[];
    boundary_geojson: { type: string; coordinates: number[][][] };
    ipfs_metadata_cid?: string;
  }) =>
    request<any>("/plots/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listPlots: (status?: string) => request<any[]>(`/plots${status ? `?status=${status}` : ""}`),

  getPlot: (id: string) => request<any>(`/plots/${id}`),

  // MRV Sync & Verification
  syncBatch: (
    surveys: Array<{
      client_uuid: string;
      plot_id: string;
      survey_timestamp: string;
      tree_count_estimate: number;
      average_canopy_cover_pct: number;
      mean_dbh_cm: number;
      soil_organic_carbon_pct: number;
      evidence_photos: Array<{
        cid: string;
        latitude: number;
        longitude: number;
        timestamp: string;
        filename?: string;
      }>;
    }>
  ) =>
    request<any[]>("/mrv/sync-batch", {
      method: "POST",
      body: JSON.stringify({ surveys }),
    }),

  listMRVReports: (plotId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (plotId) params.append("plot_id", plotId);
    if (status) params.append("status", status);
    return request<any[]>(`/mrv/reports?${params.toString()}`);
  },

  approveMRVReport: (reportId: string, txHash?: string) =>
    request<any>(`/mrv/reports/${reportId}/approve${txHash ? `?tx_hash=${txHash}` : ""}`, {
      method: "POST",
    }),

  // Registry & Certificates
  getRegistryStats: () => request<any>("/registry/stats"),

  getCertificate: (reportId: string) => request<any>(`/registry/certificate/${reportId}`),

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    wallet_address?: string;
    organization?: string;
  }) =>
    request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
};
