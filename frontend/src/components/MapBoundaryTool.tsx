'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface AreaMetrics {
  acres: number;
  hectares: number;
  square_meters: number;
  square_feet: number;
}

export const MapBoundaryTool: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

  const [currentGeometry, setCurrentGeometry] = useState<any>(null);
  const [metrics, setMetrics] = useState<AreaMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([18.75, 73.40], 10);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    featureGroupRef.current = drawnItems;

    const drawControl = new (L.Control as any).Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        circle: false,
        rectangle: {},
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    const handleDrawEvent = (e: any) => {
      if (e.type === (L as any).Draw.Event.CREATED) {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
      }

      const geojson = drawnItems.toGeoJSON() as any;
      if (geojson.features && geojson.features.length > 0) {
        setCurrentGeometry(geojson.features[0].geometry);
      } else {
        setCurrentGeometry(null);
        setMetrics(null);
      }
    };

    map.on((L as any).Draw.Event.CREATED, handleDrawEvent);
    map.on((L as any).Draw.Event.EDITED, handleDrawEvent);
    map.on((L as any).Draw.Event.DELETED, () => {
      setCurrentGeometry(null);
      setMetrics(null);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const runGisCalculations = async () => {
    if (!currentGeometry) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/gis/calculate-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometry: currentGeometry }),
      });

      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error connecting to FastAPI backend:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 60px)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 30,
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          minWidth: '280px',
          zIndex: 1000,
          fontFamily: 'sans-serif',
          border: '1px solid #334155',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
          GIS Field Processing
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>
          {currentGeometry 
            ? 'Boundary selected. Click run to analyze.' 
            : 'Draw a boundary using the map toolbar.'}
        </p>

        <button
          onClick={runGisCalculations}
          disabled={!currentGeometry || loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: !currentGeometry ? '#334155' : loading ? '#0284c7' : '#0ea5e9',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: !currentGeometry || loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {loading ? 'Running GIS Engine...' : 'Run Calculations'}
        </button>

        {metrics && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#38bdf8' }}>Results</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div><strong>Acres:</strong> {metrics.acres}</div>
              <div><strong>Hectares:</strong> {metrics.hectares}</div>
              <div><strong>Sq M:</strong> {metrics.square_meters}</div>
              <div><strong>Sq Ft:</strong> {metrics.square_feet}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapBoundaryTool;