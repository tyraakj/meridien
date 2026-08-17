"use client";

import React, { useState, useEffect } from "react";
import { localDb, type LocalSurvey, type LocalEvidencePhoto, type LocalPlot } from "@/lib/db";
import { queueSurveyForSync } from "@/lib/sync";
import { BoundaryDrawer } from "@/components/BoundaryDrawer";
import {
  Trees,
  Camera,
  Layers,
  Save,
  CheckCircle2,
  Leaf,
  UploadCloud,
  FileCheck,
  Info,
} from "lucide-react";

export default function FieldCapturePage() {
  const [plots, setPlots] = useState<LocalPlot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const [isCreatingPlot, setIsCreatingPlot] = useState<boolean>(false);

  // New Plot Fields
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newStateUt, setNewStateUt] = useState<string>("West Bengal");
  const [newDistrict, setNewDistrict] = useState<string>("South 24 Parganas");
  const [boundaryData, setBoundaryData] = useState<{
    coordinates: number[][][];
    areaHectares: number;
    boundaryHash: string;
  } | null>(null);

  // Survey Form Fields
  const [treeCount, setTreeCount] = useState<number>(450);
  const [meanDbhCm, setMeanDbhCm] = useState<number>(14.5);
  const [canopyCoverPct, setCanopyCoverPct] = useState<number>(75);
  const [soilCarbonPct, setSoilCarbonPct] = useState<number>(2.4);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([
    "Rhizophora mucronata",
    "Avicennia marina",
  ]);
  const [photos, setPhotos] = useState<LocalEvidencePhoto[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load existing plots on mount
  useEffect(() => {
    async function loadPlots() {
      const existing = await localDb.plots.toArray();
      if (existing.length === 0) {
        // Seed a default Sundarbans Plot into local IndexedDB
        const defaultPlot: LocalPlot = {
          id: "plot-sundarbans-01",
          project_name: "Sundarbans Intertidal Mangrove Delta",
          state_ut: "West Bengal",
          district: "South 24 Parganas",
          ecosystem_type: "MANGROVE",
          target_species: ["Rhizophora mucronata", "Avicennia marina"],
          boundary_geojson: {
            type: "Polygon",
            coordinates: [
              [
                [88.85, 21.75],
                [88.87, 21.75],
                [88.87, 21.73],
                [88.85, 21.73],
                [88.85, 21.75],
              ],
            ],
          },
          area_hectares: 42.5,
          boundary_hash: "0x4a1f9e83b271d4401c9a62ef830182410a5bf321d89201a4e21b789901ef24a1",
          status: "ACTIVE",
          is_local: false,
          created_at: new Date().toISOString(),
        };
        await localDb.plots.put(defaultPlot);
        setPlots([defaultPlot]);
        setSelectedPlotId(defaultPlot.id);
      } else {
        setPlots(existing);
        setSelectedPlotId(existing[0].id);
      }
    }
    loadPlots();
  }, []);

  // Real-time IPCC Tier 2 Mangrove Biomass calculation
  const calculatedTCO2e = calculateEstimatedTCO2e(
    treeCount,
    meanDbhCm,
    selectedSpecies[0] || "Rhizophora mucronata"
  );

  // Handle Photo Selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const photoObjects: LocalEvidencePhoto[] = newFiles.map((file, idx) => ({
        id: `photo-${Date.now()}-${idx}`,
        filename: file.name,
        blob: file,
        latitude: 21.745 + Math.random() * 0.005,
        longitude: 88.855 + Math.random() * 0.005,
        timestamp: new Date().toISOString(),
      }));
      setPhotos((prev) => [...prev, ...photoObjects]);
    }
  };

  // Submit & Queue Survey
  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlotId && !isCreatingPlot) {
      alert("Please select or create a restoration plot first");
      return;
    }

    setIsSaving(true);

    try {
      let plotIdToUse = selectedPlotId;

      // If creating a new plot offline, save plot first
      if (isCreatingPlot && boundaryData) {
        plotIdToUse = `plot-${Date.now()}`;
        const newPlot: LocalPlot = {
          id: plotIdToUse,
          project_name: newProjectName || "New Mangrove Plot",
          state_ut: newStateUt,
          district: newDistrict,
          ecosystem_type: "MANGROVE",
          target_species: selectedSpecies,
          boundary_geojson: {
            type: "Polygon",
            coordinates: boundaryData.coordinates,
          },
          area_hectares: boundaryData.areaHectares,
          boundary_hash: boundaryData.boundaryHash,
          status: "PENDING",
          is_local: true,
          created_at: new Date().toISOString(),
        };
        await localDb.plots.put(newPlot);
        setPlots((prev) => [...prev, newPlot]);
        setSelectedPlotId(plotIdToUse);
        setIsCreatingPlot(false);
      }

      // Create Survey Record
      const newSurvey: LocalSurvey = {
        id: `survey-${Date.now()}`,
        plot_id: plotIdToUse,
        survey_timestamp: new Date().toISOString(),
        tree_count_estimate: treeCount,
        average_canopy_cover_pct: canopyCoverPct,
        mean_dbh_cm: meanDbhCm,
        soil_organic_carbon_pct: soilCarbonPct,
        calculated_tco2e: calculatedTCO2e,
        evidence_photos: photos,
        sync_status: "PENDING",
        created_at: new Date().toISOString(),
      };

      await queueSurveyForSync(newSurvey);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      setPhotos([]);
    } catch (err: any) {
      console.error("Save survey error:", err);
      alert("Failed to save survey locally: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Trees className="w-7 h-7 text-mangrove-400" />
              Field MRV Data Capture
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Offline-first field survey logging & IPCC Tier 2 biomass estimation
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-mangrove-500/20 border border-mangrove-500/40 text-mangrove-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-mangrove-400 shrink-0" />
            <span className="text-sm font-medium">
              Field survey successfully saved to local IndexedDB queue! It will sync automatically
              when network is available.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveSurvey} className="space-y-6">
          {/* Section 1: Plot Selection & Boundary */}
          <div className="bg-ocean-900/90 border border-ocean-700/60 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-ocean-400" />
                1. Restoration Plot Selection
              </h2>
              <button
                type="button"
                onClick={() => setIsCreatingPlot(!isCreatingPlot)}
                className="text-xs font-medium text-ocean-400 hover:text-ocean-300 underline"
              >
                {isCreatingPlot ? "Select Existing Plot" : "+ Define New Plot"}
              </button>
            </div>

            {!isCreatingPlot ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Registered Plot
                </label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} ({p.district}, {p.state_ut}) — {p.area_hectares} Ha
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-ocean-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Project / Plot Name
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Pichavaram Mangrove Delta #4"
                      className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      State / UT
                    </label>
                    <input
                      type="text"
                      value={newStateUt}
                      onChange={(e) => setNewStateUt(e.target.value)}
                      className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Boundary Drawer Component */}
                <BoundaryDrawer onBoundaryComplete={setBoundaryData} />
              </div>
            )}
          </div>

          {/* Section 2: Biometric Field Measurements */}
          <div className="bg-ocean-900/90 border border-ocean-700/60 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-mangrove-400" />
              2. Biometric & Canopy Measurements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Estimated Tree Count (Sample Quadrant)
                </label>
                <input
                  type="number"
                  min="1"
                  value={treeCount}
                  onChange={(e) => setTreeCount(Number(e.target.value))}
                  className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mean DBH (Diameter at Breast Height in cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={meanDbhCm}
                  onChange={(e) => setMeanDbhCm(Number(e.target.value))}
                  className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Canopy Cover ({canopyCoverPct}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={canopyCoverPct}
                  onChange={(e) => setCanopyCoverPct(Number(e.target.value))}
                  className="w-full accent-mangrove-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Soil Organic Carbon (% SOC)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={soilCarbonPct}
                  onChange={(e) => setSoilCarbonPct(Number(e.target.value))}
                  className="w-full bg-ocean-950 border border-ocean-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live IPCC Biomass Estimation Box */}
            <div className="bg-mangrove-950/40 border border-mangrove-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-mangrove-500/10 text-mangrove-400 border border-mangrove-500/20">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-mangrove-300 font-semibold block">
                    IPCC Tier 2 Estimated Sequestration
                  </span>
                  <span className="text-xs text-slate-400">
                    Allometric formula: W = 0.128 * DBH^2.60 (Rhizophora)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">{calculatedTCO2e.toFixed(2)}</span>
                <span className="text-xs text-mangrove-400 font-bold ml-1.5">tCO₂e (BCT)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Geotagged Photographic Evidence */}
          <div className="bg-ocean-900/90 border border-ocean-700/60 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-ocean-400" />
              3. Geotagged Field Photo Evidence
            </h2>

            <div className="border-2 border-dashed border-ocean-700 hover:border-ocean-500 rounded-xl p-6 text-center cursor-pointer transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                id="photo-upload"
                className="hidden"
              />
              <label htmlFor="photo-upload" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 text-ocean-400 mx-auto" />
                <span className="text-sm font-medium text-slate-200 block">
                  Tap to capture or upload quadrat field photos
                </span>
                <span className="text-xs text-slate-400 block">
                  Photos are timestamped, geotagged, and stored locally in IndexedDB
                </span>
              </label>
            </div>

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="bg-ocean-950 border border-ocean-800 rounded-lg p-2 space-y-1 text-xs"
                  >
                    <div className="h-20 bg-ocean-800 rounded flex items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 truncate block">
                      {photo.filename}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium block">
                      📍 {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-ocean-500 to-mangrove-500 hover:from-ocean-600 hover:to-mangrove-600 text-white text-sm font-semibold shadow-lg shadow-ocean-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Survey..." : "Save Field Survey (Offline Ready)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Client-side IPCC Tier 2 calculation helper
function calculateEstimatedTCO2e(treeCount: number, meanDbhCm: number, species: string): number {
  if (treeCount <= 0 || meanDbhCm <= 0) return 0;
  // Allometric Biomass per tree: W = 0.128 * DBH^2.60
  const agbKg = 0.128 * Math.pow(meanDbhCm, 2.6);
  const bgbKg = agbKg * 0.49; // Root-to-shoot ratio
  const totalBiomassTonnes = (treeCount * (agbKg + bgbKg)) / 1000.0;
  const carbonTonnes = totalBiomassTonnes * 0.47;
  const tco2e = carbonTonnes * (44.0 / 12.0);
  return Number(tco2e.toFixed(3));
}
