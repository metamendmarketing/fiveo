import re

with open("/Users/kevin/Documents/FiveO/app/components/oracle/ResultsPresentation.tsx", "r") as f:
    content = f.read()

# 1. Add IMAGES import
content = content.replace(
    'import { BuildProfile } from "@/app/lib/constants";',
    'import { type BuildProfile, IMAGES } from "@/app/lib/constants";'
)

# 2. Main container empty state
content = content.replace(
    '<div className="bg-gradient-to-b from-[#f2f4f7] to-white min-h-[60vh] px-6 py-20 flex items-center justify-center">',
    '''<div 
      className="relative min-h-[60vh] px-6 py-20 flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${IMAGES.carbonFiber})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">'''
)
content = content.replace(
    '<div className="max-w-3xl mx-auto text-center">',
    ''
)
content = content.replace(
    '<h2 className="text-2xl font-black uppercase italic text-black mb-4">',
    '<h2 className="text-2xl font-black uppercase italic text-white drop-shadow-md mb-4">'
)
content = content.replace(
    '<p className="text-gray-500 mb-8">',
    '<p className="text-white/60 drop-shadow-sm mb-8">'
)

# 3. Main container full state
content = content.replace(
    '<div className="bg-gradient-to-b from-[#f2f4f7] to-white min-h-[60vh] px-4 sm:px-6 lg:px-8 py-16 md:py-20">',
    '''<div 
      className="relative min-h-[60vh] px-4 sm:px-6 lg:px-8 py-16 md:py-20 overflow-hidden"
      style={{
        backgroundImage: `url(${IMAGES.carbonFiber})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
      <div className="relative z-10 max-w-7xl mx-auto">'''
)
content = content.replace(
    '<div className="max-w-7xl mx-auto">',
    ''
)
content = content.replace(
    '<h2 className="text-2xl md:text-4xl font-black uppercase italic text-black mb-1">',
    '<h2 className="text-2xl md:text-4xl font-black uppercase italic text-white drop-shadow-md mb-1">'
)
content = content.replace(
    '<p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6">',
    '<p className="text-sm font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-sm mb-6">'
)
content = content.replace(
    'Project: <span className="text-black">{apiData.vehicleLabel}</span>',
    'Project: <span className="text-white">{apiData.vehicleLabel}</span>'
)
content = content.replace(
    '<p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">',
    '<p className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-black drop-shadow-sm">'
)
content = content.replace(
    '<div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl border-t-[3px] border-t-[#00AEEF] p-8 md:p-12 mb-14 text-white shadow-xl bg-black/95 rounded-2xl border border-white/5">',
    '<div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 border-t-[3px] border-t-[#00AEEF] p-8 md:p-12 mb-14 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">'
)

# Top Pick
content = content.replace(
    'className="bg-white rounded-md border border-black/5 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-gray-200 rounded-2xl overflow-hidden bg-white shadow-xl relative"',
    'className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,174,239,0.15)] shadow-xl relative"'
)
content = content.replace(
    '<div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-10 md:p-14 border-r border-gray-100">',
    '<div className="md:w-2/5 bg-white/5 flex items-center justify-center p-10 md:p-14 border-r border-white/10 relative"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent" />'
)
content = content.replace(
    '<h3 className="text-xl md:text-2xl font-black uppercase italic text-black leading-tight mb-2 line-clamp-2">',
    '<h3 className="text-xl md:text-2xl font-black uppercase italic text-white leading-tight mb-2 line-clamp-2">'
)
content = content.replace(
    '<p className="text-sm text-gray-600 italic mb-6 leading-relaxed">',
    '<p className="text-sm text-white/70 italic mb-6 leading-relaxed">'
)
content = content.replace(
    '<div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">',
    '<div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">'
)

# Others Grid
content = content.replace(
    'className="bg-white rounded-md border border-black/5 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,174,239,0.1)] bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col group shadow-sm hover:shadow-lg transition-shadow cursor-pointer"',
    'className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex flex-col group shadow-lg transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_20px_40px_rgba(0,174,239,0.15)] hover:border-white/40 cursor-pointer"'
)
content = content.replace(
    '<div className="h-52 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 group-hover:bg-white transition-colors">',
    '<div className="h-52 bg-white/5 flex items-center justify-center p-6 border-b border-white/10 group-hover:bg-white/10 transition-colors relative"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />'
)
content = content.replace(
    '<h4 className="text-sm font-black uppercase italic text-black leading-tight mb-3 min-h-[2rem] line-clamp-2">',
    '<h4 className="text-sm font-black uppercase italic text-white leading-tight mb-3 min-h-[2rem] line-clamp-2">'
)
content = content.replace(
    '<p className="text-[11px] text-gray-500 mb-3">',
    '<p className="text-[11px] text-white/50 mb-3">'
)
content = content.replace(
    '<div className="mt-auto pt-4 border-t border-gray-100">',
    '<div className="mt-auto pt-4 border-t border-white/10">'
)
content = content.replace(
    '<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Compatibility</span>',
    '<span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Compatibility</span>'
)
content = content.replace(
    '<button onClick={onRestart} className="bg-transparent text-gray-500 font-bold uppercase tracking-wider text-xs border border-gray-200 rounded px-5 py-2.5 hover:text-black hover:border-gray-400 transition-colors px-12 py-4 opacity-40 hover:opacity-100 transition-opacity text-[10px]">',
    '<button onClick={onRestart} className="bg-white/5 backdrop-blur-sm text-white/50 font-bold uppercase tracking-wider border border-white/20 rounded-xl px-12 py-4 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all text-[10px]">'
)

# Popup Modal
content = content.replace(
    '<div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedResult(null)}>',
    '<div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[1000] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedResult(null)}>'
)
content = content.replace(
    'className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-y-auto relative shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-gray-100"',
    'className="bg-black/90 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-y-auto relative shadow-[0_0_80px_rgba(0,174,239,0.15)] border border-white/20"'
)
content = content.replace(
    '<div className="sticky top-0 bg-white border-b border-gray-50 px-4 sm:px-6 lg:px-8 py-10 flex justify-between items-center z-10 rounded-t-xl">',
    '<div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-10 flex justify-between items-center z-10 rounded-t-3xl">'
)
content = content.replace(
    'className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-xs"',
    'className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors text-white text-xs"'
)
content = content.replace(
    '<div className="bg-gray-50 rounded-xl p-10 aspect-square flex items-center justify-center shadow-inner">',
    '<div className="bg-white/5 border border-white/10 rounded-2xl p-10 aspect-square flex items-center justify-center shadow-inner relative"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/10 to-transparent" />'
)
content = content.replace(
    '<h3 className={`text-xl font-black uppercase italic text-black leading-tight ${selectedResult.aiHeadline ? \'mb-6 text-gray-500\' : \'mb-6 text-3xl\'}`}>',
    '<h3 className={`text-xl font-black uppercase italic text-white leading-tight ${selectedResult.aiHeadline ? \'mb-6 text-white/50\' : \'mb-6 text-3xl\'}`}>'
)
content = content.replace(
    '<span className="bg-black text-white text-[9px] font-black px-4 py-1.5 uppercase italic tracking-widest">{selectedResult.matchStrategy || "Technical Recommendation"}</span>',
    '<span className="bg-white/10 border border-white/20 text-white text-[9px] font-black px-4 py-1.5 uppercase italic tracking-widest rounded-sm">{selectedResult.matchStrategy || "Technical Recommendation"}</span>'
)
content = content.replace(
    '<p className="text-xl text-gray-700 font-medium leading-relaxed italic border-l-4 border-gray-100 pl-8">',
    '<p className="text-xl text-white/80 font-medium leading-relaxed italic border-l-4 border-white/20 pl-8">'
)
content = content.replace(
    '<div className="h-px w-full bg-gray-50 mb-24"></div>',
    '<div className="h-px w-full bg-white/10 mb-24"></div>'
)
content = content.replace(
    '<div className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap mb-12">',
    '<div className="text-lg text-white/70 leading-relaxed whitespace-pre-wrap mb-12">'
)
content = content.replace(
    '<div className="bg-slate-50 border-l-4 border-[#00AEEF] p-8 md:p-10 rounded-r-2xl relative">',
    '<div className="bg-[#00AEEF]/5 border-l-4 border-[#00AEEF] p-8 md:p-10 rounded-r-2xl relative backdrop-blur-sm">'
)
content = content.replace(
    '<p className="text-gray-800 text-lg leading-relaxed italic font-medium pl-8">',
    '<p className="text-white/90 text-lg leading-relaxed italic font-medium pl-8">'
)
content = content.replace(
    '<div className="bg-gray-50 rounded-2xl p-10 mb-24 border border-gray-100">',
    '<div className="bg-white/5 rounded-2xl p-10 mb-24 border border-white/10">'
)
content = content.replace(
    '<h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-black/20 mb-8">Engineering Specifications</h4>',
    '<h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Engineering Specifications</h4>'
)
content = content.replace(
    '<p className="text-base font-black text-black">',
    '<p className="text-base font-black text-white">'
)
content = content.replace(
    'className="border border-gray-200 px-10 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors text-gray-400 hover:text-black"',
    'className="border border-white/20 bg-white/5 rounded-sm px-10 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors text-white/50 hover:text-white"'
)


with open("/Users/kevin/Documents/FiveO/app/components/oracle/ResultsPresentation.tsx", "w") as f:
    f.write(content)

print("Rewrite successful")

