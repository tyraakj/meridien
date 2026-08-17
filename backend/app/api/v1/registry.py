from uuid import UUID
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.plot import Plot, PlotStatus
from app.models.mrv_report import MRVReport, MRVStatus

router = APIRouter(prefix="/registry", tags=["Public Registry & Stats"])


@router.get("/stats")
async def get_registry_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns aggregate national blue carbon statistics for the public registry.
    """
    # 1. Total hectares across all approved/active plots
    ha_stmt = select(func.sum(Plot.area_hectares)).where(
        Plot.status.in_([PlotStatus.APPROVED, PlotStatus.ACTIVE])
    )
    total_hectares = (await db.execute(ha_stmt)).scalar() or 0.0

    # 2. Total plots count
    plots_stmt = select(func.count(Plot.id))
    total_plots = (await db.execute(plots_stmt)).scalar() or 0

    # 3. Total sequestered tCO2e across approved reports
    carbon_stmt = select(func.sum(MRVReport.calculated_tco2e)).where(
        MRVReport.status == MRVStatus.APPROVED
    )
    total_tco2e = (await db.execute(carbon_stmt)).scalar() or 0.0

    # 4. Total MRV reports submitted
    reports_stmt = select(func.count(MRVReport.id))
    total_reports = (await db.execute(reports_stmt)).scalar() or 0

    return {
        "total_hectares_restored": round(total_hectares, 2),
        "total_tco2e_sequestered": round(total_tco2e, 2),
        "total_active_projects": total_plots,
        "total_mrv_reports_verified": total_reports,
        "registry_operator": "Ministry of Earth Sciences (MoES) / NCCR",
        "blockchain_network": "EVM (Hardhat Local / Polygon PoS)",
    }


@router.get("/certificate/{report_id}")
async def get_carbon_certificate(report_id: UUID, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Retrieves public verifiable carbon retirement/minting certificate data.
    """
    stmt = select(MRVReport).where(MRVReport.id == report_id)
    report = (await db.execute(stmt)).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    plot_stmt = select(Plot).where(Plot.id == report.plot_id)
    plot = (await db.execute(plot_stmt)).scalar_one_or_none()

    return {
        "certificate_id": f"MERIDIEN-CERT-{str(report.id)[:8].upper()}",
        "project_name": plot.project_name if plot else "Sundarbans Coastal Plot",
        "state_ut": plot.state_ut if plot else "West Bengal",
        "district": plot.district if plot else "South 24 Parganas",
        "ecosystem_type": plot.ecosystem_type if plot else "MANGROVE",
        "area_hectares": plot.area_hectares if plot else 0.0,
        "verified_tco2e": report.calculated_tco2e,
        "ipfs_audit_bundle_cid": report.ipfs_bundle_cid,
        "bundle_sha256_hash": report.bundle_hash,
        "status": report.status.value,
        "approvals_count": report.approvals_count,
        "verifier_signatures": report.verifier_approvals,
        "timestamp": report.survey_timestamp.isoformat(),
        "registry_authority": "National Centre for Coastal Research (NCCR) & MoES"
    }
