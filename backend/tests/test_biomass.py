import pytest
from app.services.biomass_service import BiomassService


def test_single_tree_biomass_calculation():
    # Mean DBH 15.0 cm, default wood density 0.65
    agb_kg, bgb_kg, total_kg = BiomassService.calculate_single_tree_biomass_kg(
        mean_dbh_cm=15.0, wood_density=0.65
    )
    assert agb_kg > 0
    assert bgb_kg > 0
    assert total_kg == agb_kg + bgb_kg
    # Expected AGB for DBH=15.0, rho=0.65: 0.251 * 0.65 * (15^2.46) ~ 128.5 kg
    assert 100.0 < agb_kg < 160.0


def test_mangrove_total_tco2e():
    # 10,000 trees, 15.0 cm DBH, 20 hectares, Sundarbans species
    result = BiomassService.calculate_total_tco2e(
        tree_count=10000,
        mean_dbh_cm=15.0,
        area_hectares=20.0,
        species_list=["Rhizophora mucronata", "Avicennia marina"],
        soil_organic_carbon_pct=2.4,
        canopy_cover_pct=75.0
    )

    assert result["total_tco2e"] > 0
    assert result["total_biomass_tons"] > 0
    assert result["carbon_stock_tons"] > 0
    assert result["soil_carbon_tco2e"] > 0
    assert result["effective_wood_density"] == pytest.approx(0.675, rel=1e-2)


def test_zero_tree_edge_case():
    result = BiomassService.calculate_total_tco2e(
        tree_count=0,
        mean_dbh_cm=0.0,
        area_hectares=0.0
    )
    assert result["total_tco2e"] == 0.0
