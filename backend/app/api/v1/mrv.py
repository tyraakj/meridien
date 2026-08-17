from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.plot import Plot
from app.models.mrv_report import MRVReport, MRVStatus
from app.models.user import User, UserRole
from app.schemas.mrv_schema import MRVSyncBatchRequest, MRVReportResponse
from app.services.biomass_service import BiomassService
from app.services.ipfs_service import IPFSService
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/mrv", tags=["MRV & Offline Sync Engine"])


@router.post("/sync-batch", response_model=List[MRVReportResponse], status_code=status.HTTP_200_OK)
async def sync_offline_batch(
    req: MRVSyncBatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Offline batch ingestion endpoint. Ingests cached surveys from field PWA,
    computes biomass & tCO2e, builds IPFS audit bundles, and anchors records.
    """
    if not req.surveys:
        return []

    created_reports: List[MRVReport] = []

    for survey in req.surveys:
        # 1. Fetch associated plot
        plot_stmt = select(Plot).where(Plot.id == survey.plot_id)
        plot = (await db.execute(plot_stmt)).scalar_one_or_none()
        if not plot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plot with ID {survey.plot_id} not found"
            )

        # 2. Compute carbon sequestration via IPCC Tier 2 Mangrove Model
        carbon_calc = BiomassService.calculate_total_tco2e(
            tree_count=survey.tree_count_estimate,
            mean_dbh_cm=survey.mean_dbh_cm,
            area_hectares=plot.area_hectares,
            species_list=plot.target_species,
            soil_organic_carbon_pct=survey.soil_organic_carbon_pct,
            canopy_cover_pct=survey.average_canopy_cover_pct
        )
        calculated_tco2e = carbon_calc["total_tco2e"]

        # 3. Assemble Canonical MRV Audit Bundle Payload
        bundle_payload = {
            "bundle_version": "1.0.0",
            "plot_id": str(plot.id),
            "project_name": plot.project_name,
            "survey_timestamp": survey.survey_timestamp.isoformat(),
            "surveyor": {
                "user_id": str(current_user.id) if current_user else None,
                "name": current_user.name if current_user else "Field Surveyor",
                "wallet_address": current_user.wallet_address if current_user else None,
                "organization": current_user.organization if current_user else None,
            },
            "field_metrics": {
                "tree_count_estimate": survey.tree_count_estimate,
                "average_canopy_cover_pct": survey.average_canopy_cover_pct,
                "mean_dbh_cm": survey.mean_dbh_cm,
                "soil_organic_carbon_pct": survey.soil_organic_carbon_pct,
                "calculated_tco2e": calculated_tco2e,
                "biomass_breakdown": carbon_calc
            },
            "evidence_photos": [p.model_dump(mode="json") for p in survey.evidence_photos]
        }

        # 4. Pin Canonical Audit Bundle to IPFS & Compute SHA-256 Hash
        bundle_cid, bundle_hash = await IPFSService.pin_json_to_ipfs(bundle_payload)

        # 5. Persist MRV report
        mrv_report = MRVReport(
            plot_id=plot.id,
            surveyor_id=current_user.id if current_user else None,
            survey_timestamp=survey.survey_timestamp,
            tree_count_estimate=survey.tree_count_estimate,
            average_canopy_cover_pct=survey.average_canopy_cover_pct,
            mean_dbh_cm=survey.mean_dbh_cm,
            soil_organic_carbon_pct=survey.soil_organic_carbon_pct,
            calculated_tco2e=calculated_tco2e,
            evidence_photos=[p.model_dump(mode="json") for p in survey.evidence_photos],
            ipfs_bundle_cid=bundle_cid,
            bundle_hash=bundle_hash,
            status=MRVStatus.SUBMITTED,
            approvals_count=0
        )
        db.add(mrv_report)
        created_reports.append(mrv_report)

    await db.commit()
    for report in created_reports:
        await db.refresh(report)

    return created_reports


@router.get("/reports", response_model=List[MRVReportResponse])
async def list_mrv_reports(
    plot_id: Optional[UUID] = Query(None),
    status_filter: Optional[MRVStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MRVReport)
    if plot_id:
        stmt = stmt.where(MRVReport.plot_id == plot_id)
    if status_filter:
        stmt = stmt.where(MRVReport.status == status_filter)
    stmt = stmt.order_by(MRVReport.created_at.desc())

    results = (await db.execute(stmt)).scalars().all()
    return results


@router.post("/reports/{report_id}/approve", response_model=MRVReportResponse)
async def approve_mrv_report(
    report_id: UUID,
    tx_hash: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifier approval endpoint (MoES / NCCR). Increments verifier approval count.
    When approval count reaches 2, sets report status to APPROVED.
    """
    if current_user.role not in [UserRole.VERIFIER_MOES, UserRole.VERIFIER_NCCR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authorized MoES/NCCR verifiers can approve MRV reports"
        )

    stmt = select(MRVReport).where(MRVReport.id == report_id)
    report = (await db.execute(stmt)).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MRV report not found")

    if report.status == MRVStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Report is already approved")

    # Check if verifier already voted
    approvals = list(report.verifier_approvals or [])
    for app in approvals:
        if app.get("user_id") == str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted verification approval for this report"
            )

    approvals.append({
        "user_id": str(current_user.id),
        "name": current_user.name,
        "role": current_user.role.value,
        "wallet_address": current_user.wallet_address,
        "tx_hash": tx_hash
    })

    report.verifier_approvals = approvals
    report.approvals_count = len(approvals)

    if report.approvals_count >= 2:
        report.status = MRVStatus.APPROVED
        # Also update associated plot status to ACTIVE
        plot_stmt = select(Plot).where(Plot.id == report.plot_id)
        plot = (await db.execute(plot_stmt)).scalar_one_or_none()
        if plot:
            plot.status = Plot.status = "ACTIVE"

    await db.commit()
    await db.refresh(report)
    return report
