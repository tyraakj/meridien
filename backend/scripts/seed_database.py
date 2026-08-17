"""
Meridien Blue Carbon Protocol - Initial Database Seed
Seeds reference Indian coastal mangrove plots, surveyor users, and verifier accounts.
"""

import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import async_session_maker, init_db
from app.models.user import User, UserRole
from app.models.plot import Plot, PlotStatus
from app.models.mrv_report import MRVReport, MRVStatus
from app.services.gis_service import GISService

REFERENCE_PLOTS = [
    {
        "project_name": "Sundarbans Intertidal Mangrove Delta",
        "state_ut": "West Bengal",
        "district": "South 24 Parganas",
        "ecosystem_type": "MANGROVE",
        "target_species": ["Rhizophora mucronata", "Avicennia marina"],
        "area_hectares": 42.5,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [
                [
                    [88.8500, 21.7500],
                    [88.8700, 21.7500],
                    [88.8700, 21.7300],
                    [88.8500, 21.7300],
                    [88.8500, 21.7500],
                ]
            ],
        },
        "status": PlotStatus.ACTIVE,
    },
    {
        "project_name": "Pichavaram Estuarine Mangrove Zone B",
        "state_ut": "Tamil Nadu",
        "district": "Cuddalore",
        "ecosystem_type": "MANGROVE",
        "target_species": ["Avicennia marina", "Rhizophora apiculata"],
        "area_hectares": 85.0,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.7800, 11.4300],
                    [79.8000, 11.4300],
                    [79.8000, 11.4100],
                    [79.7800, 11.4100],
                    [79.7800, 11.4300],
                ]
            ],
        },
        "status": PlotStatus.ACTIVE,
    },
    {
        "project_name": "Gulf of Khambhat Coastal Mudflat Restoration",
        "state_ut": "Gujarat",
        "district": "Bharuch",
        "ecosystem_type": "MANGROVE",
        "target_species": ["Avicennia officinalis"],
        "area_hectares": 120.0,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [
                [
                    [72.5500, 21.6500],
                    [72.5800, 21.6500],
                    [72.5800, 21.6200],
                    [72.5500, 21.6200],
                    [72.5500, 21.6500],
                ]
            ],
        },
        "status": PlotStatus.ACTIVE,
    },
    {
        "project_name": "Bhitarkanika Tidal Wetland Project Phase II",
        "state_ut": "Odisha",
        "district": "Kendrapara",
        "ecosystem_type": "MANGROVE",
        "target_species": ["Sonneratia apetala", "Ceriops decandra"],
        "area_hectares": 64.2,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [
                [
                    [86.8500, 20.7200],
                    [86.8800, 20.7200],
                    [86.8800, 20.6900],
                    [86.8500, 20.6900],
                    [86.8500, 20.7200],
                ]
            ],
        },
        "status": PlotStatus.ACTIVE,
    },
]


async def seed():
    print("🌊 Initializing Meridien Database Seed...")
    await init_db()

    async with async_session_maker() as session:
        # 1. Seed Reference Users
        surveyor_email = "surveyor@meridien.eco"
        result = await session.execute(
            select(User).where(User.email == surveyor_email)
        )
        surveyor = result.scalar_one_or_none()

        if not surveyor:
            surveyor = User(
                email=surveyor_email,
                name="Tyra Field Surveyor",
                hashed_password="pbkdf2:sha256:surveyor_password_hash",
                role=UserRole.SURVEYOR,
                wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                organization="Sundarbans Mangrove Protection Society",
            )
            session.add(surveyor)

        moes_verifier_email = "moes.lead@gov.in"
        result_moes = await session.execute(
            select(User).where(User.email == moes_verifier_email)
        )
        if not result_moes.scalar_one_or_none():
            moes_verifier = User(
                email=moes_verifier_email,
                name="Dr. S. Mukherjee (MoES Lead Verifier)",
                hashed_password="pbkdf2:sha256:moes_password_hash",
                role=UserRole.VERIFIER,
                wallet_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                organization="Ministry of Earth Sciences, Govt of India",
            )
            session.add(moes_verifier)

        nccr_verifier_email = "nccr.verifier@gov.in"
        result_nccr = await session.execute(
            select(User).where(User.email == nccr_verifier_email)
        )
        if not result_nccr.scalar_one_or_none():
            nccr_verifier = User(
                email=nccr_verifier_email,
                name="Dr. R. Raman (NCCR Coastal Verifier)",
                hashed_password="pbkdf2:sha256:nccr_password_hash",
                role=UserRole.VERIFIER,
                wallet_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                organization="National Centre for Coastal Research (NCCR)",
            )
            session.add(nccr_verifier)

        await session.flush()

        # 2. Seed Plots
        for plot_data in REFERENCE_PLOTS:
            res = await session.execute(
                select(Plot).where(Plot.project_name == plot_data["project_name"])
            )
            existing_plot = res.scalar_one_or_none()

            if not existing_plot:
                coords = plot_data["boundary_geojson"]["coordinates"]
                b_hash = GISService.compute_canonical_boundary_hash(coords)

                # Construct WKT Polygon: POLYGON((lng lat, lng lat, ...))
                wkt_points = ", ".join(f"{pt[0]} {pt[1]}" for pt in coords[0])
                wkt_polygon = f"POLYGON(({wkt_points}))"

                new_plot = Plot(
                    project_name=plot_data["project_name"],
                    developer_id=surveyor.id,
                    state_ut=plot_data["state_ut"],
                    district=plot_data["district"],
                    ecosystem_type=plot_data["ecosystem_type"],
                    target_species=plot_data["target_species"],
                    boundary_geojson=plot_data["boundary_geojson"],
                    boundary_polygon=wkt_polygon,
                    area_hectares=plot_data["area_hectares"],
                    boundary_hash=b_hash,
                    status=plot_data["status"],
                )
                session.add(new_plot)
                print(f"  ✓ Seeded Plot: {plot_data['project_name']} ({plot_data['area_hectares']} Ha)")

        await session.commit()
        print("✅ Database Seed Complete: Reference Users and Coastal Plots Ready.")


if __name__ == "__main__":
    asyncio.run(seed())
