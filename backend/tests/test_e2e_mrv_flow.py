"""
End-to-End Pipeline Integration Test for Meridien MRV Protocol
Tests the complete flow from Plot Boundary Ingestion -> IPCC Biomass Calculation -> IPFS Bundle Generation.
"""

import pytest
import json
from app.services.gis_service import GISService
from app.services.biomass_service import BiomassService
from app.services.ipfs_service import IPFSService


@pytest.mark.asyncio
async def test_full_e2e_mrv_pipeline():
    # 1. Surveyor defines coastal plot boundary in Sundarbans (~458 Ha)
    sundarbans_boundary = {
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
    }

    # 2. Validate GIS Topology & Calculate Geodesic Area
    is_valid, err_msg, area_ha, boundary_hash = GISService.validate_geojson_polygon(
        sundarbans_boundary
    )
    assert is_valid is True, f"GIS Validation failed: {err_msg}"
    assert area_ha > 0, "Area must be strictly positive"
    assert 450.0 <= area_ha <= 470.0, f"Expected ~458 Ha, got {area_ha}"
    assert boundary_hash.startswith("0x")
    assert len(boundary_hash) == 66  # 0x + 64 hex chars

    # 3. Execute IPCC Tier 2 Biomass Sequestration Model
    biomass_result = BiomassService.calculate_total_tco2e(
        tree_count=5000,
        mean_dbh_cm=15.0,
        area_hectares=area_ha,
        species_list=["Rhizophora mucronata", "Avicennia marina"],
        soil_organic_carbon_pct=2.5,
        canopy_cover_pct=75.0,
    )

    assert biomass_result["total_tco2e"] > 0
    assert biomass_result["aboveground_biomass_tons"] > 0
    assert biomass_result["belowground_biomass_tons"] > 0

    # 4. Assemble Canonical IPFS MRV Bundle
    evidence_photos = [
        {
            "cid": "QmPhotoSundarbans001",
            "latitude": 21.7450,
            "longitude": 88.8550,
            "timestamp": "2026-08-16T10:00:00Z",
            "filename": "quadrat_a1.jpg",
        },
        {
            "cid": "QmPhotoSundarbans002",
            "latitude": 21.7480,
            "longitude": 88.8620,
            "timestamp": "2026-08-16T10:30:00Z",
            "filename": "canopy_b2.jpg",
        },
    ]

    bundle_payload = {
        "plot_id": "sundarbans-plot-001",
        "survey_timestamp": "2026-08-16T11:00:00Z",
        "biometric_metrics": {
            "tree_count": 5000,
            "mean_dbh_cm": 15.0,
            "species": ["Rhizophora mucronata"],
            "calculated_tco2e": biomass_result["total_tco2e"],
        },
        "biomass_calculations": biomass_result,
        "evidence_photos": evidence_photos,
    }

    cid, bundle_hash = await IPFSService.pin_json_to_ipfs(bundle_payload)

    assert cid.startswith("Qm")
    assert bundle_hash.startswith("0x")
    assert len(bundle_hash) == 66
    assert (
        bundle_payload["biometric_metrics"]["calculated_tco2e"]
        == biomass_result["total_tco2e"]
    )
