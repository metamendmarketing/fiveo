/**
 * Fuel Injector Oracle | Home Page
 * 
 * This page serves as the primary entry point for the technical sizing assistant.
 * 
 * Current State: UI Shell with placeholder Wizard components.
 * To Do:
 * - Implement state machine for the step-based wizard.
 * - Integrate with Supabase 'products' and 'engines' tables.
 * - Add real-time flow rate calculations based on target HP.
 */
export default function Home() {
  return (
    <div className="flex justify-center items-start w-full min-h-[70vh]">
      <div className="w-full max-w-3xl flex flex-col items-center py-6 sm:py-10 text-center">
        {/* 1. Header — Electric Blue as requested */}
        <h1
          className="font-black uppercase tracking-tighter italic text-black mt-10 mb-2"
          style={{ fontSize: "var(--text-hero)" }}
        >
          Fuel Injector <span className="text-[#00AEEF]">Oracle</span>
        </h1>
        <p
          className="text-[#666666] max-w-2xl mx-auto mb-10 uppercase tracking-[0.15em] sm:tracking-widest font-bold px-2"
          style={{ fontSize: "var(--text-xs)" }}
        >
          The ultimate technical sizing assistant for high-performance builds.
          Powered by real-time physics and expert calibration data.
        </p>

        {/* 2. Wizard Shell (Contrasting Light Grey) */}
        <div className="bg-[#f0f2f5] border border-gray-200 shadow-2xl shadow-black/5 rounded-md p-6 sm:p-8 lg:p-12 relative overflow-hidden w-full max-w-2xl mx-auto flex flex-col items-center text-center">
          {/* Subtle Brand Accents */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#00AEEF]" />
          
          <div className="relative z-10 flex flex-col items-center justify-center w-full gap-6 sm:gap-8">
            {/* Oracle Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#00AEEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h2
                className="font-black uppercase italic text-black"
                style={{ fontSize: "var(--text-xl)" }}
              >
                Oracle Initialization
              </h2>
              <p
                className="text-[#999999] uppercase tracking-[0.2em]"
                style={{ fontSize: "var(--text-xs)" }}
              >
                Calibrating Results for High-Performance Requirements
              </p>
            </div>

            {/* Placeholder Wizard Fields — Contrasting Mode */}
            <div className="w-full max-w-md grid grid-cols-1 gap-3 sm:gap-4 opacity-60">
              <div className="h-14 bg-white border border-gray-200 rounded-sm flex items-center px-5 justify-between shadow-sm">
                <span className="text-[11px] uppercase font-black text-[#333333]">Target Horsepower</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-[#00AEEF]" />
                </div>
              </div>
              <div className="h-14 bg-white border border-gray-200 rounded-sm flex items-center px-5 justify-between shadow-sm">
                <span className="text-[11px] uppercase font-black text-[#333333]">Fuel Type / Aspiration</span>
                <div className="flex gap-2">
                   <div className="w-10 h-5 bg-gray-200 rounded-sm" />
                   <div className="w-10 h-5 bg-[#00AEEF] rounded-sm" />
                </div>
              </div>
              <button className="bg-[#E10600] text-white font-black uppercase tracking-[0.3em] italic text-xs sm:text-sm py-4 rounded-sm mt-4 cursor-wait w-full shadow-lg hover:shadow-xl transition-shadow">
                Synthesize Results
              </button>
            </div>
          </div>
        </div>

        {/* 3. Authority Grid — Subdued for White Background */}
        <div className="mt-16 mb-8 pb-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 opacity-30 w-full max-w-2xl mx-auto">
          {["ASNU CALIBRATED", "BOSCH CORE", "E85 READY", "EXPERT TUNED"].map(
            (tag) => (
              <div key={tag} className="flex flex-col items-center py-2">
                <div className="h-[1px] w-6 sm:w-8 bg-black/20 mb-2" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black">
                  {tag}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
