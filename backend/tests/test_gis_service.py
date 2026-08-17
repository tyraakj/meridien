import pytest
from app.services.gis_service import GISService


def test_valid_geojson_polygon():
    # Sundarbans Delta sample square (~2.4 km x ~2.2 km polygon in West Bengal)
    valid_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [88.8500, 21.7500],
                [88.8700, 21.7500],
                [88.8700, 21.7300],
                [88.8500, 21.7300],
                [88.8500, 21.7500]
            ]
        ]
    }

    is_valid, error_msg, area_ha, boundary_hash = GISService.validate_geojson_polygon(valid_geojson)
    assert is_valid is True
    assert error_msg is None
    assert area_ha > 400.0  # Approx ~450+ hectares
    assert boundary_hash.startswith("0x")
    assert len(boundary_hash) == 66  # 0x + 64 hex chars


def test_invalid_polygon_self_intersecting():
    # Figure-8 self-intersecting bowtie polygon
    bowtie_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [88.85, 21.75],
                [88.87, 21.73],
                [88.87, 21.75],
                [88.85, 21.73],
                [88.85, 21.75]
            ]
        ]
    }

    is_valid, error_msg, area_ha, boundary_hash = GISService.validate_geojson_polygon(bowtie_geojson)
    assert is_valid is False
    assert "Invalid polygon topology" in error_msg


def test_deterministic_boundary_hash():
    coords = [[[88.85, 21.75], [88.87, 21.75], [88.87, 21.73], [88.85, 21.73], [88.85, 21.75]]]
    hash1 = GISService.compute_canonical_boundary_hash(coords)
    hash2 = GISService.compute_canonical_boundary_hash(coords)
    assert hash1 == hash2
    assert hash1.startswith("0x")
