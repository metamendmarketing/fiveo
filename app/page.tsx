import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center">
      {/* 1. Technical Hero Background (Subtle) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        {/* Placeholder for technical background imagery if needed later */}
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        {/* 2. Main Title Section */}
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic">
          Fuel Injector <span className="text-[#00AEEF]">Oracle</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto mb-12 uppercase tracking-widest font-bold">
          The ultimate technical sizing assistant for high-performance builds. 
          Powered by real-time physics and expert calibration data.
        </p>

        {/* 3. The Wizard Shell (Placeholder) */}
        <div className="fiveo-glass p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Subtle Red glow to match branding */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#E10600]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00AEEF]/10 blur-[100px] rounded-full" />

          <div className="relative z-10 flex flex-col items-center space-y-8">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 animate-pulse">
              <svg className="w-10 h-10 text-[#00AEEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase italic">Oracle Initialization</h2>
              <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Ready to calculate pulse width, duty cycle, and flow requirements</p>
            </div>

            {/* Placeholder UI for the Wizard */}
            <div className="w-full max-w-md grid grid-cols-1 gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
               <div className="h-12 bg-white/5 border border-white/5 rounded flex items-center px-4 justify-between">
                 <span className="text-[10px] uppercase font-bold text-gray-400">Target Horsepower</span>
                 <div className="w-24 h-1 bg-white/10 rounded-full" />
               </div>
               <div className="h-12 bg-white/5 border border-white/5 rounded flex items-center px-4 justify-between">
                 <span className="text-[10px] uppercase font-bold text-gray-400">Fuel Type</span>
                 <div className="w-16 h-4 bg-white/10 rounded" />
               </div>
               <button className="fiveo-button-red py-4 tracking-[0.4em] italic text-sm mt-4 cursor-wait">
                 Synthesize Results
               </button>
            </div>
          </div>
        </div>

        {/* 4. Authority Footer Icons */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale">
          {['ASNU CALIBRATED', 'BOSCH CORE', 'E85 READY', 'EXPERT TUNED'].map((tag) => (
             <div key={tag} className="flex flex-col items-center">
                <div className="h-[1px] w-8 bg-white/20 mb-2" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">{tag}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
