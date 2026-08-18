from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from services.gis_service import calculate_boundary_area, custom_algorithm

router = APIRouter(prefix="/api/gis", tags=["GIS"])

class GeoJSONGeometry(BaseModel):
    type: str = Field(..., example="Polygon")
    coordinates: List[Any]

class BoundaryAnalysisRequest(BaseModel):
    geometry: GeoJSONGeometry
    metadata: Optional[Dict[str, Any]] = None

@router.post("/calculate-area")
async def analyze_boundary(payload: BoundaryAnalysisRequest):
    try:
        geometry_dict = payload.geometry.model_dump()
        areas = calculate_boundary_area(geometry_dict)
        algorithm_results = future_custom_algorithm(geometry_dict)

        return {
            "success": True,
            "metrics": areas,
            "algorithm_output": algorithm_results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GIS calculation failed: {str(e)}")