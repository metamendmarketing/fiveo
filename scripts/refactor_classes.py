import os

components_dir = "app/components/oracle"

replacements = {
    "oracle-cta-primary": "bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)]",
    "oracle-result-card": "bg-white rounded-md border border-black/5 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]",
    "oracle-narrative-text": "text-[15px] leading-[1.8] text-[#444]",
    "oracle-expert-pick": "bg-gradient-to-br from-[#00AEEF] to-[#0088cc] text-white text-[10px] font-extrabold uppercase tracking-[0.15em] px-3 py-1 rounded-sm",
    "oracle-strategy-card": "bg-black/80 backdrop-blur-md border border-white/10 rounded-xl border-t-[3px] border-t-[#00AEEF]",
    "oracle-card-clickable": "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,174,239,0.1)]",
    "oracle-priority-chip": "inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e4e8] rounded text-[13px] font-bold uppercase tracking-[0.05em] text-[#333] cursor-grab select-none transition-all duration-200 hover:border-[#00AEEF]",
    "oracle-priority-chip-active": "border-[#00AEEF] bg-[#00AEEF]/5 shadow-[0_0_20px_rgba(0,174,239,0.15)]",
    "oracle-priority-chip-rank": "flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#00AEEF] text-white text-[11px] font-black",
    "oracle-mod-check": "flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded text-white/70 text-[13px] font-semibold uppercase tracking-[0.05em] cursor-pointer transition-all duration-200 hover:border-[#00AEEF]/30 hover:text-white",
    "oracle-mod-check-active": "border-[#00AEEF] bg-[#00AEEF]/10 text-white",
    "oracle-progress-bar": "w-full max-w-[320px] h-[3px] bg-white/10 rounded-[2px] overflow-hidden",
    "oracle-progress-bar-fill": "h-full bg-gradient-to-r from-[#00AEEF] to-[#00d4ff] rounded-[2px] transition-all duration-300 shadow-[0_0_6px_rgba(0,174,239,0.5)]",
    "oracle-progress-percent": "text-[32px] font-black italic text-[#00AEEF] font-[var(--font-open-sans-condensed)]",
    "oracle-hp-slider": "appearance-none w-full h-1.5 rounded-[3px] outline-none transition-all duration-200 bg-gray-200",
    "oracle-build-profile": "bg-[#0f0f0f]/75 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)]",
    "oracle-build-profile-label": "text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#00AEEF]",
    "oracle-build-profile-value": "text-[13px] font-medium text-white/85 leading-snug",
    "oracle-card": "relative overflow-hidden rounded-md border border-white/5 bg-cover bg-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:border-[#00AEEF]/20",
    "oracle-card-selected": "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.15),0_8px_32px_rgba(0,0,0,0.12)]",
    "oracle-card-dimmed": "opacity-35 pointer-events-none scale-[0.97] transition-all duration-400"
}

for root, _, files in os.walk("app/components"):
    for filename in files:
        if filename.endswith(".tsx"):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            
            modified = False
            for old_class, new_class in replacements.items():
                if old_class in content:
                    # We must be careful not to replace partial matches.
                    # This simple replace is usually fine for these specific long class names.
                    content = content.replace(old_class, new_class)
                    modified = True
                    
            if modified:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated {filename}")
