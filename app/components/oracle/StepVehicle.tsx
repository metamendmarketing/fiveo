/**
 * StepVehicle — Q1-Q2: Vehicle Type + Year/Make/Model/Engine
 * Cascading dropdowns: makes → models → years → engines
 * Centered layout with proper padding and visual accents
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { type BuildProfile, IMAGES } from "@/app/lib/constants";
import { VehicleMake, VehicleModel, VehicleYear, VehicleEngine } from "@/app/lib/types";
import { Car, Bike, Anchor, CheckCircle2, Settings2, Zap } from "lucide-react";

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  showTypeSelector?: boolean;
}

// ─── Constants for Engine Status ───
const STATUS_OPTIONS = [
  {
    value: "stock" as const,
    label: "Completely Stock",
    desc: "Factory original — no modifications",
    accent: "#22c55e",
    icon: <CheckCircle2 className="w-8 h-8 stroke-[1.5px]" />,
  },
  {
    value: "light-mods" as const,
    label: "Light Mods",
    desc: "Bolt-ons: intake, exhaust, tune",
    accent: "#f59e0b",
    icon: <Settings2 className="w-8 h-8 stroke-[1.5px]" />,
  },
  {
    value: "heavily-modified" as const,
    label: "Heavily Modified",
    desc: "Built engine, turbo/blower, standalone",
    accent: "#ef4444",
    icon: <Zap className="w-8 h-8 stroke-[1.5px]" />,
  },
];

/**
 * StepVehicle — Machine Identification
 * 
 * Handles the cascaded selection of vehicle make, model, year, and engine.
 * Once a vehicle is fully identified, the user selects their current engine status.
 */
export function StepVehicle({ profile, onUpdate, onNext, showTypeSelector }: Props) {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [years, setYears] = useState<VehicleYear[]>([]);
  const [engines, setEngines] = useState<VehicleEngine[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper for API calls that prepends the basePath automatically
  const fetchVehicleData = useCallback(async (params: string) => {
    try {
      const response = await fetch(`/fiveo/demo/api/oracle/vehicles?${params}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const json = await response.json();
      return json.data || [];
    } catch (err) {
      console.error("[StepVehicle] Fetch error:", err);
      return [];
    }
  }, []);

  // Fetch makes on initial mount
  useEffect(() => {
    setLoading(true);
    fetchVehicleData("type=makes")
      .then(setMakes)
      .finally(() => setLoading(false));
  }, [fetchVehicleData]);

  // Cascade: Fetch models when make changes
  useEffect(() => {
    if (!profile.makeId) { setModels([]); return; }
    fetchVehicleData(`type=models&makeId=${profile.makeId}`).then(setModels);
  }, [profile.makeId, fetchVehicleData]);

  // Cascade: Fetch years when model changes
  useEffect(() => {
    if (!profile.modelId) { setYears([]); return; }
    fetchVehicleData(`type=years&modelId=${profile.modelId}`).then(setYears);
  }, [profile.modelId, fetchVehicleData]);

  // Cascade: Fetch engines when year changes
  useEffect(() => {
    if (!selectedYearId) { setEngines([]); return; }
    fetchVehicleData(`type=engines&yearId=${selectedYearId}`).then(setEngines);
  }, [selectedYearId, fetchVehicleData]);

  const canAdvance = !!(profile.make && profile.model && profile.year && profile.engineLabel && profile.engineStatus);

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full max-w-xl mx-auto">
        
        {/* Step Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-white mb-1 drop-shadow-md">
            Machine <span className="text-[#00AEEF]">Identification</span>
          </h2>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-black drop-shadow-sm">
            Configure Your Setup
          </p>
        </div>

        {/* 1. Category Selection (Car/Moto/Marine) */}
        {showTypeSelector && (
          <div className="mb-8">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block text-center">
              A. SELECT CATEGORY
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["car", "motorcycle", "marine"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ vehicleType: type })}
                  className={`relative p-6 rounded-2xl border-2 text-center transition-all group overflow-hidden ${
                    profile.vehicleType === type
                      ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.2)] text-white"
                      : "border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-white/30 hover:bg-white/10"
                  } ${type !== "car" ? "opacity-30 cursor-not-allowed" : ""}`}
                  disabled={type !== "car"}
                >
                  {profile.vehicleType === type && (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00AEEF]/20 to-transparent" />
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full mb-3 relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {/* Glassmorphic Badge Background */}
                      <div className={`absolute inset-0 rounded-full transition-all duration-300 ${profile.vehicleType === type ? "bg-[#00AEEF] shadow-[0_0_15px_rgba(0,174,239,0.5)]" : "bg-white/10"}`} />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent border border-white/20" />
                      
                      {/* Icon */}
                      <div className={`relative z-10 ${profile.vehicleType === type ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                        {type === "car" && <Car className="w-5 h-5 stroke-[2px]" />}
                        {type === "motorcycle" && <Bike className="w-5 h-5 stroke-[2px]" />}
                        {type === "marine" && <Anchor className="w-5 h-5 stroke-[2px]" />}
                      </div>
                    </div>
                    <span className="font-black uppercase text-[10px] tracking-widest block">
                      {type === "car" ? "Auto" : type === "motorcycle" ? "Bike" : "Marine"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Cascaded Attribute Selection */}
        <div className={`space-y-3 transition-opacity ${!profile.vehicleType && showTypeSelector ? "opacity-30 pointer-events-none" : ""}`}>
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block text-center">
            B. VEHICLE ATTRIBUTES
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Make Selector */}
            <div className="oracle-attribute-container shadow-sm">
              <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Make</label>
              <select
                value={profile.make || ""}
                onChange={(e) => {
                  const selected = makes.find((m) => m.name === e.target.value);
                  onUpdate({
                    make: e.target.value || null,
                    makeId: selected?.id || null,
                    model: null,
                    modelId: null,
                    year: null,
                    engineCode: null,
                    engineLabel: null,
                    engineStatus: null
                  });
                  setSelectedYearId(null);
                }}
                className="w-full h-12 bg-slate-50 border border-gray-200 rounded-xl px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]"
              >
                <option value="">{loading ? "Loading..." : "Select Make..."}</option>
                {makes.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* Model Selector */}
            <div className={`oracle-attribute-container shadow-sm ${!profile.makeId ? "opacity-40" : ""}`}>
              <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Model</label>
              <select
                value={profile.model || ""}
                disabled={!profile.makeId}
                onChange={(e) => {
                  const selected = models.find((m) => m.name === e.target.value);
                  onUpdate({
                    model: e.target.value || null,
                    modelId: selected?.id || null,
                    year: null,
                    engineCode: null,
                    engineLabel: null,
                    engineStatus: null
                  });
                  setSelectedYearId(null);
                }}
                className="w-full h-12 bg-slate-50 border border-gray-200 rounded-xl px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]"
              >
                <option value="">Model...</option>
                {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Year Selector */}
            <div className={`oracle-attribute-container shadow-sm ${!profile.modelId ? "opacity-40" : ""}`}>
              <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Year</label>
              <select
                value={profile.year?.toString() || ""}
                disabled={!profile.modelId}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  const selectedYear = years.find((y) => y.year === val);
                  onUpdate({
                    year: val,
                    engineCode: null,
                    engineLabel: null,
                    engineStatus: null
                  });
                  setSelectedYearId(selectedYear?.id || null);
                }}
                className="w-full h-12 bg-slate-50 border border-gray-200 rounded-xl px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]"
              >
                <option value="">Year...</option>
                {years.map((y) => <option key={y.id} value={y.year}>{y.year}</option>)}
              </select>
            </div>

            {/* Engine Selector */}
            <div className={`oracle-attribute-container shadow-sm ${!selectedYearId ? "opacity-40" : ""}`}>
              <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Engine</label>
              <select
                value={profile.engineLabel || ""}
                disabled={!selectedYearId}
                onChange={(e) => {
                  const selected = engines.find((eng) => eng.label === e.target.value);
                  onUpdate({
                    engineLabel: e.target.value || null,
                    engineCode: selected?.id?.toString() || null,
                    engineStatus: null
                  });
                }}
                className="w-full h-12 bg-slate-50 border border-gray-200 rounded-xl px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]"
              >
                <option value="">Engine...</option>
                {engines.map((eng) => (
                  <option key={eng.id} value={eng.label}>
                    {eng.label}{eng.displacement ? ` (${eng.displacement})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Engine Modification Status */}
        {profile.engineLabel && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block text-center">
              C. CURRENT CONFIGURATION
            </label>
            <div className="grid grid-cols-1 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => onUpdate({ engineStatus: status.value })}
                  className={`relative flex items-center p-5 rounded-2xl border transition-all text-left group overflow-hidden ${
                    profile.engineStatus === status.value
                      ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.2)]"
                      : "border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {profile.engineStatus === status.value && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF]/20 to-transparent" />
                  )}
                  
                  <div className="relative z-10 w-12 h-12 rounded-full mr-5 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className={`absolute inset-0 rounded-full transition-all duration-300 ${profile.engineStatus === status.value ? "bg-[#00AEEF] shadow-[0_0_15px_rgba(0,174,239,0.5)]" : "bg-white/10"}`} />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent border border-white/20" />
                    
                    <div className={`relative z-10 ${profile.engineStatus === status.value ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                      {status.icon}
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <span className={`block font-black uppercase tracking-widest text-sm mb-1 ${profile.engineStatus === status.value ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                      {status.label}
                    </span>
                    <span className="block text-[11px] font-medium text-white/50 leading-relaxed">{status.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guidance Prompt */}
        {!profile.engineStatus && (
          <div className="mt-8 text-center text-white/40">
            <p className="text-[10px] font-bold uppercase italic tracking-widest">
              Precisely Matching Your Build →
            </p>
          </div>
        )}

        {/* Confirmation CTA */}
        <div className="mt-10">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] w-full py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            CONFIRM CONFIGURATION & CONTINUE →
          </button>
        </div>
      </div>
    </div>
  );
}
