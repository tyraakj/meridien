import json
import hashlib
from typing import Tuple, Optional, Dict, Any
from shapely.geometry import shape, Polygon
from shapely.validation import explain_validity
import pyproj
from functools import partial
from shapely.ops import transform


class GISService:
    @staticmethod
    def compute_canonical_boundary_hash(coordinates: list) -> str:
        """
        Generates a deterministic 0x-prefixed SHA-256 hash of canonical GeoJSON coordinates.
        """
        canonical_str = json.dumps(coordinates, separators=(",", ":"), sort_keys=True)
        h = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
        return f"0x{h}"

    @classmethod
    def calculate_geodesic_area_hectares(cls, poly: Polygon) -> float:
        """
        Calculates accurate surface area on WGS84 ellipsoid in hectares using pyproj.
        """
        geod = pyproj.Geod(ellps="WGS84")
        # geod.geometry_area_perimeter returns (area_m2, perimeter_m)
        area_m2, _ = geod.geometry_area_perimeter(poly)
        area_m2 = abs(area_m2)
        area_hectares = area_m2 / 10000.0
        return round(area_hectares, 4)

    @classmethod
    def validate_geojson_polygon(
        cls, geojson_dict: Dict[str, Any]
    ) -> Tuple[bool, Optional[str], float, str]:
        """
        Validates GeoJSON Polygon structure, checks for topological self-intersections,
        computes geodesic area in hectares, and generates deterministic boundary hash.
        
        Returns:
            (is_valid, error_message, area_hectares, boundary_hash)
        """
        if not geojson_dict or not isinstance(geojson_dict, dict):
            return False, "Invalid GeoJSON: must be a JSON object", 0.0, ""

        geom_type = geojson_dict.get("type")
        if geom_type != "Polygon":
            return False, f"Expected Polygon geometry, got '{geom_type}'", 0.0, ""

        coordinates = geojson_dict.get("coordinates")
        if not coordinates or not isinstance(coordinates, list) or len(coordinates) == 0:
            return False, "Polygon must contain at least one linear ring of coordinates", 0.0, ""

        # Outer ring must have at least 4 coordinates (closed ring)
        outer_ring = coordinates[0]
        if len(outer_ring) < 4:
            return False, "Polygon linear ring must contain at least 4 coordinates (first and last identical)", 0.0, ""

        if outer_ring[0] != outer_ring[-1]:
            # Auto-close ring if surveyor omitted duplicate last point
            outer_ring.append(outer_ring[0])

        try:
            poly = shape(geojson_dict)
            if not poly.is_valid:
                reason = explain_validity(poly)
                return False, f"Invalid polygon topology: {reason}", 0.0, ""

            if poly.is_empty or poly.area == 0:
                return False, "Polygon has zero area", 0.0, ""

            area_ha = cls.calculate_geodesic_area_hectares(poly)
            if area_ha < 0.01:
                return False, "Plot area is too small (< 0.01 hectares)", 0.0, ""

            boundary_hash = cls.compute_canonical_boundary_hash(coordinates)
            return True, None, area_ha, boundary_hash

        except Exception as e:
            return False, f"Failed to parse geometry: {str(e)}", 0.0, ""
