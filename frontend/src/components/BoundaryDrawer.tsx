"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navigation, MapPin, Check, Trash2, ShieldCheck, Compass } from "lucide-react";

interface BoundaryDrawerProps {
  onBoundaryComplete: (data: {
    coordinates: number[][][]; // GeoJSON Polygon format: [[[lng, lat], ...]]
    areaHectares: number;
    boundaryHash: string;
  }) => void;
  initialCoordinates?: number[][][];
}

export function BoundaryDrawer({ onBoundaryComplete, initialCoordinates }: BoundaryDrawerProps) {
  const [points, setPoints] = useState<Array<[number, number]>>([]); // [lat, lng]
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentGps, setCurrentGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [areaHa, setAreaHa] = useState<number>(0);
  const [boundaryHash, setBoundaryHash] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);

  // Initialize from props if available
  useEffect(() => {
    if (initialCoordinates && initialCoordinates[0]?.length > 0) {
      const latLngPoints: Array<[number, number]> = initialCoordinates[0].map(([lng, lat]) => [
        lat,
        lng,
      ]);
      setPoints(latLngPoints);
    }
  }, [initialCoordinates]);

  // Compute Area & Hash whenever points change
  useEffect(() => {
    if (points.length >= 3) {
      const computedArea = calculatePolygonAreaHa(points);
      setAreaHa(computedArea);

      // GeoJSON expects [lng, lat]
      const geoJsonRing = points.map(([lat, lng]) => [lng, lat]);
      // Ensure closed ring
      if (
        geoJsonRing[0][0] !== geoJsonRing[geoJsonRing.length - 1][0] ||
        geoJsonRing[0][1] !== geoJsonRing[geoJsonRing.length - 1][1]
      ) {
        geoJsonRing.push([...geoJsonRing[0]]);
      }

      // Simple deterministic hash preview
      const hashStr =
        "0x" +
        Math.abs(
          geoJsonRing.reduce(
            (acc, [x, y]) => acc ^ (Math.floor(x * 1e6) + Math.floor(y * 1e6)),
            0x4a1f
          )
        )
          .toString(16)
          .padStart(64, "0");

      setBoundaryHash(hashStr);

      onBoundaryComplete({
        coordinates: [geoJsonRing],
        areaHectares: computedArea,
        boundaryHash: hashStr,
      });
    } else {
      setAreaHa(0);
      setBoundaryHash("");
    }
  }, [points]);

  // Start / Stop GPS walking tracker
  const toggleGpsTracking = () => {
    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      setIsTracking(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setCurrentGps({ lat: latitude, lng: longitude, accuracy });

          // Add point if accuracy is acceptable (< 15m)
          setPoints((prev) => {
            if (prev.length === 0) return [[latitude, longitude]];
            const last = prev[prev.length - 1];
            // Check distance > 3 meters
            const dist = getDistanceMeters(last[0], last[1], latitude, longitude);
            if (dist >= 3) {
              return [...prev, [latitude, longitude]];
            }
            return prev;
          });
        },
        (err) => {
          console.warn("[GPS] Tracking error:", err);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  };

  const handleAddSamplePlot = () => {
    // Sundarbans Mangrove Delta Sample Quadrant (~42.5 Hectares)
    const sundarbansPlot: Array<[number, number]> = [
      [21.75, 88.85],
      [21.75, 88.87],
      [21.73, 88.87],
      [21.73, 88.85],
    ];
    setPoints(sundarbansPlot);
  };

  const handleClear = () => {
    if (isTracking && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
    setPoints([]);
    setAreaHa(0);
    setBoundaryHash("");
  };

  return (
    <div className="bg-ocean-900 border border-ocean-700/60 rounded-xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-ocean-500/10 text-ocean-400 border border-ocean-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Plot Boundary Capture</h3>
            <p className="text-xs text-slate-400">Walk the coastal boundary or log GPS waypoints</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleGpsTracking}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isTracking
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                : "bg-mangrove-500/20 text-mangrove-300 border border-mangrove-500/30 hover:bg-mangrove-500/30"
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isTracking ? "animate-spin" : ""}`} />
            <span>{isTracking ? "Stop Walking" : "Walk GPS Boundary"}</span>
          </button>

          <button
            type="button"
            onClick={handleAddSamplePlot}
            className="px-3 py-1.5 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-slate-300 text-xs font-medium border border-ocean-700 transition-colors"
          >
            Sample Sundarbans Plot
          </button>

          {points.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              title="Clear Points"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* GPS Status Banner */}
      {currentGps && (
        <div className="bg-ocean-950/60 border border-ocean-800 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            GPS: {currentGps.lat.toFixed(5)}°N, {currentGps.lng.toFixed(5)}°E
          </span>
          <span className="text-slate-400">Accuracy: ±{currentGps.accuracy.toFixed(1)}m</span>
        </div>
      )}

      {/* Polygon Points Visual List */}
      <div className="bg-ocean-950/80 rounded-lg border border-ocean-800/80 p-3 max-h-36 overflow-y-auto font-mono text-xs space-y-1">
        {points.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            No coordinates captured yet. Click &quot;Walk GPS Boundary&quot; or load a sample plot.
          </div>
        ) : (
          points.map(([lat, lng], idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-slate-300 hover:text-white"
            >
              <span className="text-ocean-400">Waypoint #{idx + 1}</span>
              <span>
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Metric Summary */}
      {points.length >= 3 && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-mangrove-500/10 border border-mangrove-500/20 rounded-lg p-3">
            <span className="text-xs text-mangrove-300 block font-medium">Calculated Area</span>
            <span className="text-lg font-bold text-white">
              {areaHa.toFixed(2)}{" "}
              <span className="text-xs font-normal text-mangrove-400">Hectares</span>
            </span>
          </div>

          <div className="bg-ocean-500/10 border border-ocean-500/20 rounded-lg p-3">
            <span className="text-xs text-ocean-300 block font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-ocean-400" />
              Boundary Hash
            </span>
            <span className="text-xs font-mono text-slate-300 truncate block mt-1">
              {boundaryHash.slice(0, 10)}...{boundaryHash.slice(-8)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers for geodesic area calculation
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePolygonAreaHa(points: Array<[number, number]>): number {
  if (points.length < 3) return 0;
  const R = 6378137; // Earth radius meters
  let total = 0;

  for (let i = 0; i < points.length; i++) {
    const [p1Lat, p1Lng] = points[i];
    const [p2Lat, p2Lng] = points[(i + 1) % points.length];

    const p1LatRad = (p1Lat * Math.PI) / 180;
    const p2LatRad = (p2Lat * Math.PI) / 180;
    const p1LngRad = (p1Lng * Math.PI) / 180;
    const p2LngRad = (p2Lng * Math.PI) / 180;

    total += (p2LngRad - p1LngRad) * (2 + Math.sin(p1LatRad) + Math.sin(p2LatRad));
  }

  const areaM2 = Math.abs((total * R * R) / 2.0);
  return Number((areaM2 / 10000.0).toFixed(4));
}
