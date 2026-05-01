"use client";

import React, { useState } from "react";
import type { BuildProfile } from "@/app/lib-v2/constants";
import { motion } from "framer-motion";

interface Props {
  profile: BuildProfile;
  onClose: () => void;
  onSubmit: (updatedProfile: BuildProfile) => void;
}

// Helper for rendering select fields
const SelectField = ({ label, field, value, options, onChange }: { 
  label: string, 
  field: keyof BuildProfile, 
  value: string,
  options: { label: string, value: string }[],
  onChange: (field: keyof BuildProfile, val: string) => void
}) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-4 py-3 appearance-none focus:outline-none focus:border-[#00AEEF] transition-colors"
    >
      <option value="" disabled className="text-black">Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
      ))}
    </select>
  </div>
);

export function EditBuildModal({ profile, onClose, onSubmit }: Props) {
  const [edited, setEdited] = useState<BuildProfile>({ ...profile });

  const handleChange = (field: keyof BuildProfile, value: string) => {
    setEdited((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSubmit(edited);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black uppercase italic text-white drop-shadow-md">
              Edit Your <span className="text-[#00AEEF]">Build</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mt-1">
              Adjust parameters to refine recommendations
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {/* Intent & Objective */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00AEEF] mb-4 border-b border-white/10 pb-2">Mission & Usage</h3>
              
              <SelectField 
                label="Goal" 
                field="goal" 
                value={(edited.goal as string) || ""}
                onChange={handleChange}
                options={[
                  { value: "replace", label: "OEM Replacement" },
                  { value: "improve", label: "Mild Improvement" },
                  { value: "max-power", label: "Max Power" },
                  { value: "fix-issues", label: "Fix Issues" }
                ]} 
              />

              <SelectField 
                label="Usage" 
                field="usage" 
                value={(edited.usage as string) || ""}
                onChange={handleChange}
                options={[
                  { value: "daily", label: "Daily Driver" },
                  { value: "street", label: "Street Performance" },
                  { value: "track", label: "Track / Racing" },
                  { value: "mixed", label: "Mixed Use" }
                ]} 
              />
              
              <SelectField 
                label="Build Level" 
                field="engineStatus" 
                value={(edited.engineStatus as string) || ""}
                onChange={handleChange}
                options={[
                  { value: "stock", label: "Stock" },
                  { value: "light-mods", label: "Light Mods" },
                  { value: "heavily-modified", label: "Heavily Modified" }
                ]} 
              />
            </div>

            {/* Performance & Fuel */}
            <div className="space-y-2 mt-8 md:mt-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00AEEF] mb-4 border-b border-white/10 pb-2">Performance & Fuel</h3>
              
              <SelectField 
                label="Target HP" 
                field="hpMode" 
                value={(edited.hpMode as string) || ""}
                onChange={handleChange}
                options={[
                  { value: "stock", label: "Stock Power" },
                  { value: "+50", label: "+50 HP" },
                  { value: "+100", label: "+100 HP" },
                  { value: "+150", label: "150+ HP" },
                  { value: "unsure", label: "Not Sure" }
                ]} 
              />

              <SelectField 
                label="Fuel Type" 
                field="fuelType" 
                value={(edited.fuelType as string) || ""}
                onChange={handleChange}
                options={[
                  { value: "pump", label: "Pump Gas" },
                  { value: "e85", label: "E85 / Flex Fuel" },
                  { value: "race", label: "Race Fuel" },
                  { value: "unsure", label: "Not Sure" }
                ]} 
              />

              <SelectField 
                label="Budget" 
                field="budget" 
                value={(edited.budget as string) || ""}
                onChange={handleChange}
                options={[
                  { value: "budget", label: "Budget-Friendly" },
                  { value: "mid", label: "Mid-Range Performance" },
                  { value: "premium", label: "Premium / Motorsport" }
                ]} 
              />
            </div>
          </div>

        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-[#00AEEF] text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-3 rounded-lg shadow-[0_4px_16px_rgba(0,174,239,0.25)] hover:bg-[#0088cc] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(0,174,239,0.35)] transition-all"
          >
            Update & Re-run Advisor
          </button>
        </div>

      </motion.div>
    </div>
  );
}
