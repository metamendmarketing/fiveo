/**
 * StepVehicle — Q1-Q2: Vehicle Type + Year/Make/Model/Engine
 * Cascading dropdowns: makes → models → years → engines
 * Centered layout with proper padding and visual accents
 */
"use client";

import { useState, useEffect } from "react";
import type { BuildProfile } from "@/app/lib/constants";
import { IMAGES } from "@/app/lib/constants";

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
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "light-mods" as const,
    label: "Light Mods",
    desc: "Bolt-ons: intake, exhaust, tune",
    accent: "#f59e0b",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.66-5.66L7.17 8.1l4.25 4.25 8.49-8.49 1.41 1.41z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.66 10.5a10 10 0 11-3.14-6.36" />
      </svg>
    ),
  },
  {
    value: "heavily-modified" as const,
    label: "Heavily Modified",
    desc: "Built engine, turbo/blower, standalone",
    accent: "#ef4444",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.545 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
];

export function StepVehicle({ profile, onUpdate, onNext, showTypeSelector }: Props) {
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [models, setModels] = useState<{ id: number; name: string }[]>([]);
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
  const [engines, setEngines] = useState<{ id: number; label: string; displacement?: string }[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch makes on mount
  useEffect(() => {
    setLoading(true);
    fetch("/fiveo/demo/api/oracle/vehicles?type=makes")
      .then((r) => r.json())
      .then((d) => setMakes(d.data || []))
      .catch(() => setMakes([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!profile.makeId) { setModels([]); return; }
    fetch(`/fiveo/demo/api/oracle/vehicles?type=models&makeId=${profile.makeId}`)
      .then((r) => r.json())
      .then((d) => setModels(d.data || []))
      .catch(() => setModels([]));
  }, [profile.makeId]);

  // Fetch years when model changes
  useEffect(() => {
    if (!profile.modelId) { setYears([]); return; }
    fetch(`/fiveo/demo/api/oracle/vehicles?type=years&modelId=${profile.modelId}`)
      .then((r) => r.json())
      .then((d) => setYears(d.data || []))
      .catch(() => setYears([]));
  }, [profile.modelId]);

  // Fetch engines when year changes
  useEffect(() => {
    if (!selectedYearId) { setEngines([]); return; }
    fetch(`/fiveo/demo/api/oracle/vehicles?type=engines&yearId=${selectedYearId}`)
      .then((r) => r.json())
      .then((d) => setEngines(d.data || []))
      .catch(() => setEngines([]));
  }, [selectedYearId]);

  const canAdvance = profile.make && profile.model && profile.year && profile.engineLabel && profile.engineStatus;

  return (
    <div className="oracle-bg-vehicle min-h-[65vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-black mb-1">
            Machine <span className="text-[#00AEEF]">Identification</span>
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">
            Configure Your Setup
          </p>
        </div>

        {/* 1. Vehicle Type (only shown on Guide path initially) */}
        {showTypeSelector && (
          <div className="mb-8">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block text-center">
              A. SELECT CATEGORY
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["car", "motorcycle", "marine"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ vehicleType: type })}
                  className={`px-4 py-8 rounded-md border-2 text-center transition-all ${
                    profile.vehicleType === type
                      ? "border-[#00AEEF] bg-blue-50 text-[#00AEEF] shadow-sm"
                      : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                  } ${type !== "car" ? "opacity-30 cursor-not-allowed" : ""}`}
                  disabled={type !== "car"}
                >
                  <div className="mb-1 flex justify-center">
                    {type === "car" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18M6 14.25H3.375a1.125 1.125 0 01-1.125-1.125V9.75L5.25 6h13.5l3 3.75v3.375c0 .621-.504 1.125-1.125 1.125H18m-12 0v-3h12v3" />
                      </svg>
                    )}
                    {type === "motorcycle" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <circle cx="5.5" cy="17.5" r="3.5" />
                        <circle cx="18.5" cy="17.5" r="3.5" />
                        <path strokeLinecap="round" d="M9 17.5h6M5.5 14l4-6h3l2 3h4" />
                      </svg>
                    )}
                    {type === "marine" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M5 12l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-black uppercase text-[10px] block">
                    {type === "car" ? "Auto" : type === "motorcycle" ? "Bike" : "Marine"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Cascading Dropdowns */}
        <div className={`space-y-3 transition-opacity ${!profile.vehicleType && showTypeSelector ? "opacity-30 pointer-events-none" : ""}`}>
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 block text-center">
            B. VEHICLE ATTRIBUTES
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Make */}
            <div className="bg-white rounded border border-gray-100 px-6 py-4 shadow-sm">
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
                className="w-full h-11 bg-gray-50 border border-gray-100 rounded px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF]"
              >
                <option value="">{loading ? "Loading..." : "Make..."}</option>
                {makes.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* Model */}
            <div className={`bg-white rounded border border-gray-100 px-6 py-4 shadow-sm ${!profile.makeId ? "opacity-40" : ""}`}>
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
                className="w-full h-11 bg-gray-50 border border-gray-100 rounded px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF]"
              >
                <option value="">Model...</option>
                {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Year */}
            <div className={`bg-white rounded border border-gray-100 px-6 py-4 shadow-sm ${!profile.modelId ? "opacity-40" : ""}`}>
              <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Year</label>
              <select
                value={profile.year?.toString() || ""}
                disabled={!profile.modelId}
                onChange={(e) => {
                  const selectedYear = years.find((y) => y.year === parseInt(e.target.value));
                  onUpdate({
                    year: e.target.value ? parseInt(e.target.value) : null,
                    engineCode: null,
                    engineLabel: null,
                    engineStatus: null
                  });
                  setSelectedYearId(selectedYear?.id || null);
                }}
                className="w-full h-11 bg-gray-50 border border-gray-100 rounded px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF]"
              >
                <option value="">Year...</option>
                {years.map((y) => <option key={y.id} value={y.year}>{y.year}</option>)}
              </select>
            </div>

            {/* Engine */}
            <div className={`bg-white rounded border border-gray-100 px-6 py-4 shadow-sm ${!selectedYearId ? "opacity-40" : ""}`}>
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
                className="w-full h-11 bg-gray-50 border border-gray-100 rounded px-4 text-xs font-bold uppercase text-gray-800 outline-none focus:border-[#00AEEF]"
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

        {/* 3. Engine Status (The "Oracle Reveal") */}
        {profile.engineLabel && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block text-center">
              C. CURRENT CONFIGURATION
            </label>
            <div className="grid grid-cols-1 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ engineStatus: opt.value })}
                  className={`flex items-center gap-4 oracle-status-card rounded border-2 text-left transition-all backdrop-blur-sm ${
                    profile.engineStatus === opt.value
                      ? "border-[#00AEEF] bg-[#00AEEF]/5 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div 
                    className="w-12 h-12 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${opt.accent}10`, color: opt.accent }}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="text-black font-black uppercase text-sm leading-tight">{opt.label}</h3>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Education Beat */}
        {!profile.engineStatus && (
          <div className="oracle-education-beat mt-8 text-center text-gray-400 bg-transparent border-none">
            <p className="text-[10px] font-bold uppercase italic tracking-widest">
              Precisely Matching Your Build →
            </p>
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-10">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="oracle-cta-primary w-full text-sm py-4 disabled:opacity-20 disabled:grayscale"
          >
            CONFIRM CONFIGURATION & CONTINUE →
          </button>
        </div>
      </div>
    </div>
  );
}
