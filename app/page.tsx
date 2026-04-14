export default function Home() {
  return (
    <div className="relative min-h-[calc(100svh-theme(spacing.16))] sm:min-h-[calc(100svh-theme(spacing.20))] lg:min-h-[80vh] flex flex-col items-center">
      {/* 1. Technical Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 w-full fiveo-container py-10 sm:py-16 lg:py-24 text-center">
        {/* 2. Hero Title — Fluid Typography */}
        <h1
          className="font-black uppercase tracking-tighter mb-3 sm:mb-4 italic"
          style={{ fontSize: "var(--text-hero)" }}
        >
          Fuel Injector <span className="text-[#00AEEF]">Oracle</span>
        </h1>
        <p
          className="text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-12 uppercase tracking-[0.15em] sm:tracking-widest font-bold px-2"
          style={{ fontSize: "var(--text-sm)" }}
        >
          The ultimate technical sizing assistant for high-performance builds.
          Powered by real-time physics and expert calibration data.
        </p>

        {/* 3. Wizard Shell (Placeholder) */}
        <div className="fiveo-glass p-6 sm:p-8 lg:p-12 border border-white/5 shadow-2xl relative overflow-hidden mx-auto max-w-2xl">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#E10600]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00AEEF]/10 blur-[100px] rounded-full" />

          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
            {/* Oracle Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 animate-pulse">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#00AEEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2
                className="font-bold uppercase italic"
                style={{ fontSize: "var(--text-xl)" }}
              >
                Oracle Initialization
              </h2>
              <p
                className="text-gray-500 uppercase tracking-[0.15em] sm:tracking-[0.2em]"
                style={{ fontSize: "var(--text-xs)" }}
              >
                Ready to calculate pulse width, duty cycle, and flow requirements
              </p>
            </div>

            {/* Placeholder Wizard Fields */}
            <div className="w-full max-w-md grid grid-cols-1 gap-3 sm:gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="h-12 bg-white/5 border border-white/5 rounded flex items-center px-4 justify-between">
                <span className="text-[10px] sm:text-xs uppercase font-bold text-gray-400">Target Horsepower</span>
                <div className="w-20 sm:w-24 h-1 bg-white/10 rounded-full" />
              </div>
              <div className="h-12 bg-white/5 border border-white/5 rounded flex items-center px-4 justify-between">
                <span className="text-[10px] sm:text-xs uppercase font-bold text-gray-400">Fuel Type</span>
                <div className="w-14 sm:w-16 h-4 bg-white/10 rounded" />
              </div>
              <button className="fiveo-button-red tracking-[0.3em] sm:tracking-[0.4em] italic text-xs sm:text-sm mt-2 sm:mt-4 cursor-wait w-full">
                Synthesize Results
              </button>
            </div>
          </div>
        </div>

        {/* 4. Authority Tags */}
        <div className="mt-10 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 opacity-40 grayscale">
          {["ASNU CALIBRATED", "BOSCH CORE", "E85 READY", "EXPERT TUNED"].map(
            (tag) => (
              <div key={tag} className="flex flex-col items-center py-2">
                <div className="h-[1px] w-6 sm:w-8 bg-white/20 mb-2" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">
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
