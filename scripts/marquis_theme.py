import os

components_dir = "app/components/oracle"

# We want to replace the outer container of every Step component
# It currently looks like: <div className="bg-gradient-to-br from-gray-50 to-white min-h-[65vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 rounded-xl border border-gray-100 shadow-sm">
# Or something similar based on our previous script.

# We will read each step file, find the outer return <div className="..."> and replace its classes.
# To be safe, we will just use regex to find `<div className=".*min-h-\[65vh\].*">` and replace the whole className.

import re

target_class = 'className="bg-white min-h-[65vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"'

for root, _, files in os.walk(components_dir):
    for filename in files:
        if filename.startswith("Step") and filename.endswith(".tsx"):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Find the main container, which usually has min-h-[65vh] or similar.
            # It's always the first <div> after return (
            # Let's just do a manual replace for the known strings from the previous script
            
            # Known backgrounds from previous script:
            bg1 = "bg-black relative overflow-hidden text-white" # StepEntryMode
            bg2 = "bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm rounded-2xl" # StepVehicle
            bg3 = "bg-[#0a0a0a] text-white rounded-2xl border border-white/5" # StepGoal
            bg4 = "bg-gradient-to-br from-[#0d1117] via-[#0a0e14] to-[#0d1117] text-white rounded-2xl border border-white/5 shadow-xl" # StepPerformance
            bg5 = "bg-[#f8f9fa] rounded-2xl border border-gray-100 shadow-sm" # StepPreferences
            bg6 = "bg-black text-white rounded-2xl" # ProcessingSequence
            
            # For the Marquis theme, all steps (except processing maybe) should use the same clean white card.
            marquis_bg = "bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            
            content = content.replace(bg1, marquis_bg)
            content = content.replace(bg2, marquis_bg)
            content = content.replace(bg3, marquis_bg)
            content = content.replace(bg4, marquis_bg)
            content = content.replace(bg5, marquis_bg)
            
            # StepEntryMode text might be white, we need to fix it if it's forced white.
            # I will just write a specific sed/replace for text-white where needed.
            
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Standardized container for {filename}")
