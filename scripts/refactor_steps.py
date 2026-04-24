import os
import re

components_dir = "app/components/oracle"

bg_map = {
    "oracle-bg-entry": "bg-black relative overflow-hidden text-white",
    "oracle-bg-vehicle": "bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm rounded-2xl",
    "oracle-bg-intent": "bg-[#0a0a0a] text-white rounded-2xl border border-white/5",
    "oracle-bg-performance": "bg-gradient-to-br from-[#0d1117] via-[#0a0e14] to-[#0d1117] text-white rounded-2xl border border-white/5 shadow-xl",
    "oracle-bg-preferences": "bg-[#f8f9fa] rounded-2xl border border-gray-100 shadow-sm",
    "oracle-bg-processing": "bg-black text-white rounded-2xl",
    "oracle-bg-results": "bg-gradient-to-b from-[#f2f4f7] to-white"
}

for filename in os.listdir(components_dir):
    if filename.startswith("Step") or filename in ["ProcessingSequence.tsx", "ResultsPresentation.tsx"]:
        filepath = os.path.join(components_dir, filename)
        with open(filepath, 'r') as f:
            content = f.read()

        # Replace padding
        content = re.sub(r'px-6 md:px-12', 'px-4 sm:px-6 lg:px-8', content)
        content = re.sub(r'px-8 lg:px-28', 'px-4 sm:px-6 lg:px-8', content)
        content = re.sub(r'px-8 md:px-20', 'px-4 sm:px-6 lg:px-8', content)

        # Replace backgrounds
        for old_bg, new_bg in bg_map.items():
            content = content.replace(old_bg, new_bg)

        # Replace oracle-cta-secondary (temporary fix until button components are done)
        content = content.replace('oracle-cta-secondary', 'bg-transparent text-gray-500 font-bold uppercase tracking-wider text-xs border border-gray-200 rounded px-5 py-2.5 hover:text-black hover:border-gray-400 transition-colors')
        # Dark mode version of CTA secondary might be needed, but we'll stick to this for now.

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filename}")
