"""
IPCC Tier 2 Coastal Mangrove Biomass & Carbon Calculation Engine.
Calibrated for Indian coastal wetland ecosystems (Sundarbans, Pichavaram, Bhitarkanika, Gulf of Khambhat).
"""
from typing import List, Optional


SPECIES_WOOD_DENSITY = {
    "Rhizophora mucronata": 0.70,
    "Rhizophora apiculata": 0.72,
    "Avicennia marina": 0.65,
    "Avicennia officinalis": 0.63,
    "Bruguiera gymnorhiza": 0.68,
    "Ceriops decandra": 0.75,
    "Sonneratia apetala": 0.52,
    "DEFAULT_MANGROVE": 0.65,
}

CARBON_FRACTION_DRY_BIOMASS = 0.47  # IPCC standard carbon fraction
CO2_TO_C_RATIO = 44.0 / 12.0        # 3.6667 conversion factor


class BiomassService:
    @staticmethod
    def get_wood_density(species_list: Optional[List[str]] = None) -> float:
        if not species_list:
            return SPECIES_WOOD_DENSITY["DEFAULT_MANGROVE"]
        
        densities = [
            SPECIES_WOOD_DENSITY.get(s, SPECIES_WOOD_DENSITY["DEFAULT_MANGROVE"])
            for s in species_list
        ]
        return sum(densities) / len(densities)

    @classmethod
    def calculate_single_tree_biomass_kg(
        cls, mean_dbh_cm: float, wood_density: float = 0.65
    ) -> tuple[float, float, float]:
        """
        Calculates dry biomass in kg for a single tree using Komiyama et al. allometric model:
        AGB = 0.251 * rho * (DBH ^ 2.46)
        BGB = 0.199 * (rho ^ 0.899) * (DBH ^ 2.22)
        """
        if mean_dbh_cm <= 0:
            return 0.0, 0.0, 0.0
            
        agb_kg = 0.251 * wood_density * (mean_dbh_cm ** 2.46)
        bgb_kg = 0.199 * (wood_density ** 0.899) * (mean_dbh_cm ** 2.22)
        total_tree_kg = agb_kg + bgb_kg
        return agb_kg, bgb_kg, total_tree_kg

    @classmethod
    def calculate_total_tco2e(
        cls,
        tree_count: int,
        mean_dbh_cm: float,
        area_hectares: float,
        species_list: Optional[List[str]] = None,
        soil_organic_carbon_pct: float = 2.0,
        canopy_cover_pct: float = 70.0,
    ) -> dict:
        """
        Calculates total sequestered metric tons of CO2 equivalent (tCO2e).
        Includes aboveground tree biomass, belowground roots, and estimated soil carbon pool.
        """
        if tree_count <= 0 or area_hectares <= 0 or mean_dbh_cm <= 0:
            return {
                "total_tco2e": 0.0,
                "aboveground_biomass_tons": 0.0,
                "belowground_biomass_tons": 0.0,
                "total_biomass_tons": 0.0,
                "carbon_stock_tons": 0.0,
                "soil_carbon_tco2e": 0.0,
            }

        wood_density = cls.get_wood_density(species_list)
        agb_kg, bgb_kg, total_kg = cls.calculate_single_tree_biomass_kg(
            mean_dbh_cm, wood_density
        )

        # Total biomass in metric tons (1 ton = 1000 kg)
        total_agb_tons = (agb_kg * tree_count) / 1000.0
        total_bgb_tons = (bgb_kg * tree_count) / 1000.0
        total_biomass_tons = total_agb_tons + total_bgb_tons

        # Carbon Stock (Tons of C)
        vegetation_carbon_tons = total_biomass_tons * CARBON_FRACTION_DRY_BIOMASS
        vegetation_tco2e = vegetation_carbon_tons * CO2_TO_C_RATIO

        # Soil Organic Carbon restoration contribution (estimated 2.5 tCO2e/ha baseline credit rate scaled by SOC %)
        soil_carbon_tco2e = area_hectares * 2.5 * (soil_organic_carbon_pct / 2.0)

        # Canopy cover health weighting (0.5 to 1.0 factor based on canopy density)
        canopy_factor = max(0.5, min(1.0, canopy_cover_pct / 100.0))
        net_tco2e = round((vegetation_tco2e * canopy_factor) + soil_carbon_tco2e, 2)

        return {
            "total_tco2e": net_tco2e,
            "aboveground_biomass_tons": round(total_agb_tons, 2),
            "belowground_biomass_tons": round(total_bgb_tons, 2),
            "total_biomass_tons": round(total_biomass_tons, 2),
            "carbon_stock_tons": round(vegetation_carbon_tons, 2),
            "soil_carbon_tco2e": round(soil_carbon_tco2e, 2),
            "effective_wood_density": wood_density,
        }
