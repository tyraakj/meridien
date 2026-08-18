from typing import Dict, Any, List, Optional
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.ops import transform
import pyproj

# lat/lng for world equal area in meters
WGS84 = pyproj.CRS("EPSG:4326") 
EQUAL_AREA = pyproj.CRS("EPSG:6933")
project_to_meters = pyproj.Transformer.from_crs(WGS84, EQUAL_AREA, always_xy=True).transform

def calculate_boundary_area(geojson_geometry: Dict[str, Any]) -> Dict[str, float]:
    # converts standard geoJSON polygon to an equal-area projection (rendering) and return area across units
    geom = shape(geojson_geometry)
    
    if not isinstance(geom, (Polygon, MultiPolygon)):
        raise ValueError("Geometry must be a Polygon or MultiPolygon")

    # projected coordinates to meters for surface area
    geom_projected = transform(project_to_meters, geom)
    area_sq_meters = geom_projected.area

    return {
        "square_meters": round(area_sq_meters, 2),
        "hectares": round(area_sq_meters / 10,000, 4),
        "acres": round(area_sq_meters / 4,046.8564224, 4),
        "square_kilometers": round(area_sq_meters / 1,000,000, 4),
        "square_feet": round(area_sq_meters * 10.76391041671, 2)
    }

def custom_algorithm():
    # field capture and further processing blockchain algorithm