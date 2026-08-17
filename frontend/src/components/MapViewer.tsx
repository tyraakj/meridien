"use client";

import React, { useState } from "react";
import { MapPin, Layers, Trees, ShieldCheck } from "lucide-react";

interface PlotMarker {
  id: string;
  name: string;
  stateUt: string;
  district: string;
  species: string;
  areaHa: number;
  tco2e: number;
  lat: number;
  lng: number;
  status: string;
}

const COASTAL_PLOTS: PlotMarker[] = [
  {
    id: "plot-sundarbans",
    name: "Sundarbans Intertidal Mangrove Delta",
    stateUt: "West Bengal",
    district: "South 24 Parganas",
    species: "Rhizophora mucronata",
    areaHa: 42.5,
    tco2e: 612.4,
    lat: 21.74,
    lng: 88.86,
    status: "APPROVED",
  },
  {
    id: "plot-pichavaram",
    name: "Pichavaram Estuarine Mangrove Zone B",
    stateUt: "Tamil Nadu",
    district: "Cuddalore",
    species: "Avicennia marina",
    areaHa: 85.0,
    tco2e: 1145.8,
    lat: 11.42,
    lng: 79.79,
    status: "ACTIVE",
  },
  {
    id: "plot-khambhat",
    name: "Gulf of Khambhat Mudflat Project",
    stateUt: "Gujarat",
    district: "Bharuch",
    species: "Avicennia officinalis",
    areaHa: 120.0,
    tco2e: 1540.0,
    lat: 21.635,
    lng: 72.565,
    status: "ACTIVE",
  },
  {
    id: "plot-bhitarkanika",
    name: "Bhitarkanika Tidal Wetland Project",
    stateUt: "Odisha",
    district: "Kendrapara",
    species: "Sonneratia apetala",
    areaHa: 64.2,
    tco2e: 890.5,
    lat: 20.705,
    lng: 86.865,
    status: "APPROVED",
  },
];

export function MapViewer() {
  const [selectedPlot, setSelectedPlot] = useState<PlotMarker>(COASTAL_PLOTS[0]);

  return (
    <div className="bg-ocean-900 border border-ocean-700/60 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ocean-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-ocean-400" />
            Interactive Coastal Mangrove Spatial Map
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time PostGIS plot polygons across India&apos;s maritime states
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-mangrove-400 font-semibold bg-mangrove-500/10 border border-mangrove-500/20 px-2.5 py-1 rounded-full">
            ● 4 Verified Coastal Sites
          </span>
        </div>
      </div>

      {/* Simulated GIS Map Canvas */}
      <div className="relative w-full h-80 bg-ocean-950 rounded-xl border border-ocean-800 overflow-hidden flex items-center justify-center p-4">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        {/* Coastal Plot Markers */}
        <div className="relative z-10 w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COASTAL_PLOTS.map((plot) => {
            const isSelected = selectedPlot.id === plot.id;
            return (
              <button
                key={plot.id}
                onClick={() => setSelectedPlot(plot)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-ocean-800/90 border-ocean-400 shadow-lg shadow-ocean-500/20 scale-105"
                    : "bg-ocean-900/60 border-ocean-800 hover:border-ocean-700 hover:bg-ocean-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <MapPin
                    className={`w-4 h-4 ${isSelected ? "text-mangrove-400" : "text-slate-400"}`}
                  />
                  <span className="text-[10px] font-mono text-ocean-300 font-bold">
                    {plot.areaHa} Ha
                  </span>
                </div>
                <span className="text-xs font-bold text-white block truncate">
                  {plot.name.split(" ")[0]}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">{plot.stateUt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Plot Detailed Info Panel */}
      {selectedPlot && (
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedPlot.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mangrove-500/10 text-mangrove-300 border border-mangrove-500/20">
                {selectedPlot.status}
              </span>
            </div>
            <p className="text-slate-400">
              {selectedPlot.district}, {selectedPlot.stateUt} • Coordinates:{" "}
              {selectedPlot.lat.toFixed(4)}°N, {selectedPlot.lng.toFixed(4)}°E
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Restored Area</span>
              <span className="font-bold text-white">{selectedPlot.areaHa} Hectares</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Sequestration</span>
              <span className="font-bold text-mangrove-400">{selectedPlot.tco2e} tCO₂e</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
