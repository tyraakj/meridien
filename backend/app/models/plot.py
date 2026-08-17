import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from app.core.database import Base
import enum


class PlotStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class Plot(Base):
    __tablename__ = "plots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_name = Column(String(255), nullable=False)
    developer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    state_ut = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    ecosystem_type = Column(String(100), default="MANGROVE", nullable=False)
    target_species = Column(JSON, default=list, nullable=False) # e.g. ["Rhizophora mucronata", "Avicennia marina"]
    
    # PostGIS Spatial Polygon Geometry (SRID 4326 - WGS84)
    boundary_geom = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    area_hectares = Column(Float, nullable=False)
    boundary_hash = Column(String(66), unique=True, nullable=False, index=True)
    
    ipfs_metadata_cid = Column(String(100), nullable=True)
    onchain_project_id = Column(Integer, unique=True, nullable=True)
    
    status = Column(SQLEnum(PlotStatus), default=PlotStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
