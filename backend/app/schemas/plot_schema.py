from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.plot import PlotStatus


class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]] = Field(
        ...,
        description="Array of linear rings of coordinates in [longitude, latitude] format."
    )


class PlotCreate(BaseModel):
    project_name: str = Field(..., min_length=3, max_length=255)
    state_ut: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    ecosystem_type: str = "MANGROVE"
    target_species: List[str] = ["Rhizophora mucronata", "Avicennia marina"]
    boundary_geojson: GeoJSONPolygon
    ipfs_metadata_cid: Optional[str] = None


class PlotResponse(BaseModel):
    id: UUID
    project_name: str
    developer_id: Optional[UUID] = None
    state_ut: str
    district: str
    ecosystem_type: str
    target_species: List[str]
    area_hectares: float
    boundary_hash: str
    boundary_geojson: Optional[Dict[str, Any]] = None
    ipfs_metadata_cid: Optional[str] = None
    onchain_project_id: Optional[int] = None
    status: PlotStatus
    created_at: datetime

    class Config:
        from_attributes = True
