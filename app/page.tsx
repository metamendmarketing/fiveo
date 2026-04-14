export default function Home() {
  return (
    <div className="relative min-h-[70vh] flex flex-col items-center">
      <div className="relative z-10 w-full fiveo-container py-6 sm:py-10 text-center">
        {/* 1. Header — Electric Blue as requested */}
        <h1
          className="font-black uppercase tracking-tighter mb-2 italic text-black"
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

        {/* 2. Wizard Shell (White Ecommerce Style) */}
        <div className="bg-white border border-[#e5e5e5] shadow-xl rounded-sm p-6 sm:p-8 lg:p-12 relative overflow-hidden w-full max-w-2xl mx-auto">
          {/* Subtle Brand Accents */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#00AEEF]" />
          
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
            {/* Oracle Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
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

            {/* Placeholder Wizard Fields — Light Mode */}
            <div className="w-full max-w-md grid grid-cols-1 gap-3 sm:gap-4 opacity-60">
              <div className="h-14 bg-gray-50 border border-gray-200 rounded-sm flex items-center px-5 justify-between">
                <span className="text-[11px] uppercase font-black text-[#333333]">Target Horsepower</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-[#00AEEF]" />
                </div>
              </div>
              <div className="h-14 bg-gray-50 border border-gray-200 rounded-sm flex items-center px-5 justify-between">
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
        <div className="mt-12 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 opacity-30">
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
