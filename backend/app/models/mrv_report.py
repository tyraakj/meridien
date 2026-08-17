import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class MRVStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class MRVReport(Base):
    __tablename__ = "mrv_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id"), nullable=False, index=True)
    surveyor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    survey_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Biometric Field Metrics
    tree_count_estimate = Column(Integer, nullable=False)
    average_canopy_cover_pct = Column(Float, nullable=False) # e.g. 68.5%
    mean_dbh_cm = Column(Float, nullable=False)              # Diameter at Breast Height (cm)
    soil_organic_carbon_pct = Column(Float, default=2.0)     # Soil Organic Carbon %
    
    # Calculated Sequestration
    calculated_tco2e = Column(Float, nullable=False)         # Metric tons of CO2e
    
    # Evidence & IPFS
    evidence_photos = Column(JSON, default=list, nullable=False) # List of {cid, lat, lng, timestamp}
    ipfs_bundle_cid = Column(String(100), nullable=False)
    bundle_hash = Column(String(66), nullable=False, index=True)
    
    # Blockchain Anchoring & Approvals
    onchain_report_id = Column(Integer, unique=True, nullable=True)
    status = Column(SQLEnum(MRVStatus), default=MRVStatus.SUBMITTED, nullable=False)
    approvals_count = Column(Integer, default=0, nullable=False)
    verifier_approvals = Column(JSON, default=list) # List of {verifier_address, role, timestamp, tx_hash}
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
