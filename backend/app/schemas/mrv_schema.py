from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.mrv_report import MRVStatus


class EvidencePhoto(BaseModel):
    cid: str
    latitude: float
    longitude: float
    timestamp: datetime
    filename: Optional[str] = None


class MRVSyncItem(BaseModel):
    client_uuid: UUID
    plot_id: UUID
    survey_timestamp: datetime
    tree_count_estimate: int = Field(..., gt=0)
    average_canopy_cover_pct: float = Field(..., ge=0.0, le=100.0)
    mean_dbh_cm: float = Field(..., gt=0.0)
    soil_organic_carbon_pct: float = Field(default=2.0, ge=0.0)
    evidence_photos: List[EvidencePhoto] = []


class MRVSyncBatchRequest(BaseModel):
    surveys: List[MRVSyncItem]


class MRVReportResponse(BaseModel):
    id: UUID
    plot_id: UUID
    surveyor_id: Optional[UUID] = None
    survey_timestamp: datetime
    tree_count_estimate: int
    average_canopy_cover_pct: float
    mean_dbh_cm: float
    soil_organic_carbon_pct: float
    calculated_tco2e: float
    evidence_photos: List[Dict[str, Any]]
    ipfs_bundle_cid: str
    bundle_hash: str
    onchain_report_id: Optional[int] = None
    status: MRVStatus
    approvals_count: int
    verifier_approvals: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True
