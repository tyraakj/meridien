import json
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.functions import ST_GeomFromGeoJSON, ST_AsGeoJSON, ST_Intersects
from app.core.database import get_db
from app.models.plot import Plot, PlotStatus
from app.models.user import User
from app.schemas.plot_schema import PlotCreate, PlotResponse
from app.services.gis_service import GISService
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/plots", tags=["Plot Management"])


@router.post("/register", response_model=PlotResponse, status_code=status.HTTP_201_CREATED)
async def register_plot(
    req: PlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    geojson_dict = req.boundary_geojson.model_dump()
    
    # 1. Spatial validation via GISService
    is_valid, error_msg, area_ha, boundary_hash = GISService.validate_geojson_polygon(geojson_dict)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid boundary polygon: {error_msg}"
        )

    # 2. Check for duplicate boundary hash (Exact match prevention)
    hash_stmt = select(Plot).where(Plot.boundary_hash == boundary_hash)
    existing_hash = (await db.execute(hash_stmt)).scalar_one_or_none()
    if existing_hash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Plot with identical boundary hash already registered (Plot ID: {existing_hash.id})"
        )

    # 3. PostGIS topological overlap check against active/approved plots
    geom_json_str = json.dumps(geojson_dict)
    new_geom = ST_GeomFromGeoJSON(geom_json_str)

    overlap_stmt = select(Plot).where(
        ST_Intersects(Plot.boundary_geom, new_geom),
        Plot.status.in_([PlotStatus.APPROVED, PlotStatus.ACTIVE])
    )
    overlapping_plots = (await db.execute(overlap_stmt)).scalars().all()
    if overlapping_plots:
        conflict_ids = [str(p.id) for p in overlapping_plots]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Boundary overlaps with existing approved blue carbon projects: {', '.join(conflict_ids)}"
        )

    # 4. Persist new plot
    new_plot = Plot(
        project_name=req.project_name,
        developer_id=current_user.id if current_user else None,
        state_ut=req.state_ut,
        district=req.district,
        ecosystem_type=req.ecosystem_type,
        target_species=req.target_species,
        boundary_geom=new_geom,
        area_hectares=area_ha,
        boundary_hash=boundary_hash,
        ipfs_metadata_cid=req.ipfs_metadata_cid,
        status=PlotStatus.PENDING
    )
    db.add(new_plot)
    await db.commit()
    await db.refresh(new_plot)

    # Return response with boundary GeoJSON
    return PlotResponse(
        id=new_plot.id,
        project_name=new_plot.project_name,
        developer_id=new_plot.developer_id,
        state_ut=new_plot.state_ut,
        district=new_plot.district,
        ecosystem_type=new_plot.ecosystem_type,
        target_species=new_plot.target_species,
        area_hectares=new_plot.area_hectares,
        boundary_hash=new_plot.boundary_hash,
        boundary_geojson=geojson_dict,
        ipfs_metadata_cid=new_plot.ipfs_metadata_cid,
        onchain_project_id=new_plot.onchain_project_id,
        status=new_plot.status,
        created_at=new_plot.created_at
    )


@router.get("", response_model=List[PlotResponse])
async def list_plots(
    status_filter: Optional[PlotStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Plot, ST_AsGeoJSON(Plot.boundary_geom).label("geojson_str"))
    if status_filter:
        stmt = stmt.where(Plot.status == status_filter)
    stmt = stmt.order_by(Plot.created_at.desc())

    results = (await db.execute(stmt)).all()
    plot_list = []
    for plot, geojson_str in results:
        geojson_dict = json.loads(geojson_str) if geojson_str else None
        plot_list.append(
            PlotResponse(
                id=plot.id,
                project_name=plot.project_name,
                developer_id=plot.developer_id,
                state_ut=plot.state_ut,
                district=plot.district,
                ecosystem_type=plot.ecosystem_type,
                target_species=plot.target_species,
                area_hectares=plot.area_hectares,
                boundary_hash=plot.boundary_hash,
                boundary_geojson=geojson_dict,
                ipfs_metadata_cid=plot.ipfs_metadata_cid,
                onchain_project_id=plot.onchain_project_id,
                status=plot.status,
                created_at=plot.created_at
            )
        )
    return plot_list


@router.get("/{plot_id}", response_model=PlotResponse)
async def get_plot(plot_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Plot, ST_AsGeoJSON(Plot.boundary_geom).label("geojson_str")).where(Plot.id == plot_id)
    result = (await db.execute(stmt)).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    
    plot, geojson_str = result
    geojson_dict = json.loads(geojson_str) if geojson_str else None
    return PlotResponse(
        id=plot.id,
        project_name=plot.project_name,
        developer_id=plot.developer_id,
        state_ut=plot.state_ut,
        district=plot.district,
        ecosystem_type=plot.ecosystem_type,
        target_species=plot.target_species,
        area_hectares=plot.area_hectares,
        boundary_hash=plot.boundary_hash,
        boundary_geojson=geojson_dict,
        ipfs_metadata_cid=plot.ipfs_metadata_cid,
        onchain_project_id=plot.onchain_project_id,
        status=plot.status,
        created_at=plot.created_at
    )
